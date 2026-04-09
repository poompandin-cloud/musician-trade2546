// Service สำหรับระบบ 'ออกเงินให้ก่อนแล้วหัก 7%'

import { supabase } from "@/integrations/supabase/client";
import { 
  Gig, 
  GigLog, 
  CreateGigRequest, 
  UpdateGigFinancialRequest, 
  CreateGigLogRequest, 
  UpdatePaymentStatusRequest,
  PaymentStatus,
  UserRole,
  FinancialCalculation,
  PayoutSummary,
  GigFilter,
  GigSort,
  GigSearchParams,
  ApiResponse,
  PaginatedResponse,
  GigListResponse,
  GigLogListResponse,
  FEE_RATE,
  PAYOUT_RATE
} from '@/types/payout-system';

export class PayoutService {
  // =====================================================
  // 1. Gig Management
  // =====================================================

  // สร้างงานใหม่พร้อมข้อมูลการเงิน
  static async createGig(data: CreateGigRequest): Promise<ApiResponse<Gig>> {
    try {
      // คำนวณข้อมูลการเงิน
      const financialData = this.calculateFinancialData(data.total_amount);
      
      const { data: gigData, error } = await supabase
        .from('gigs')
        .insert({
          title: data.title,
          description: data.description,
          musician_id: data.musician_id,
          shop_id: data.shop_id,
          date: data.date,
          time: data.time,
          location: data.location,
          total_amount: data.total_amount,
          fee_amount: financialData.fee_amount,
          musician_payout: financialData.musician_payout,
          payment_status: 'pending'
        })
        .select(`
          *,
          musician:profiles!gigs_musician_id_fkey(
            id, 
            full_name, 
            email, 
            phone, 
            role,
            avatar_url
          ),
          shop:profiles!gigs_shop_id_fkey(
            id, 
            full_name, 
            email, 
            phone, 
            role,
            avatar_url
          )
        `)
        .single();

      if (error) {
        console.error('Error creating gig:', error);
        return {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'ไม่สามารถสร้างงานได้',
            details: error
          }
        };
      }

      return {
        success: true,
        data: gigData as Gig
      };
    } catch (error) {
      console.error('Error in createGig:', error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
          details: error
        }
      };
    }
  }

  // อัปเดตข้อมูลการเงินของงาน
  static async updateGigFinancial(gigId: string, data: UpdateGigFinancialRequest): Promise<ApiResponse<void>> {
    try {
      // คำนวณข้อมูลการเงินใหม่
      const financialData = this.calculateFinancialData(data.total_amount);
      
      const { error } = await supabase
        .from('gigs')
        .update({
          total_amount: data.total_amount,
          fee_amount: financialData.fee_amount,
          musician_payout: financialData.musician_payout,
          updated_at: new Date().toISOString()
        })
        .eq('id', gigId);

      if (error) {
        console.error('Error updating gig financial:', error);
        return {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'ไม่สามารถอัปเดตข้อมูลการเงินได้',
            details: error
          }
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in updateGigFinancial:', error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
          details: error
        }
      };
    }
  }

  // ดึงข้อมูลงาน
  static async getGig(gigId: string): Promise<ApiResponse<Gig>> {
    try {
      const { data, error } = await supabase
        .from('gigs')
        .select(`
          *,
          musician:profiles!gigs_musician_id_fkey(
            id, 
            full_name, 
            email, 
            phone, 
            role,
            avatar_url
          ),
          shop:profiles!gigs_shop_id_fkey(
            id, 
            full_name, 
            email, 
            phone, 
            role,
            avatar_url
          ),
          gig_logs(*)
        `)
        .eq('id', gigId)
        .single();

      if (error) {
        console.error('Error fetching gig:', error);
        return {
          success: false,
          error: {
            code: 'GIG_NOT_FOUND',
            message: 'ไม่พบข้อมูลงาน',
            details: error
          }
        };
      }

      return {
        success: true,
        data: data as Gig
      };
    } catch (error) {
      console.error('Error in getGig:', error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
          details: error
        }
      };
    }
  }

  // ดึงรายการงานพร้อมการกรองและจัดเรียง
  static async getGigs(params: GigSearchParams = {}): Promise<ApiResponse<GigListResponse>> {
    try {
      let query = supabase
        .from('gigs')
        .select(`
          *,
          musician:profiles!gigs_musician_id_fkey(
            id, 
            full_name, 
            email, 
            phone, 
            role,
            avatar_url
          ),
          shop:profiles!gigs_shop_id_fkey(
            id, 
            full_name, 
            email, 
            phone, 
            role,
            avatar_url
          ),
          gig_logs(*)
        `, { count: 'exact' });

      // Apply filters
      if (params.filter) {
        if (params.filter.payment_status) {
          query = query.eq('payment_status', params.filter.payment_status);
        }
        if (params.filter.musician_id) {
          query = query.eq('musician_id', params.filter.musician_id);
        }
        if (params.filter.shop_id) {
          query = query.eq('shop_id', params.filter.shop_id);
        }
        if (params.filter.date_from) {
          query = query.gte('date', params.filter.date_from);
        }
        if (params.filter.date_to) {
          query = query.lte('date', params.filter.date_to);
        }
        if (params.filter.min_amount) {
          query = query.gte('total_amount', params.filter.min_amount);
        }
        if (params.filter.max_amount) {
          query = query.lte('total_amount', params.filter.max_amount);
        }
      }

      // Apply sorting
      if (params.sort) {
        const sortField = params.sort.field === 'confirmed_at' ? 'gigs(confirmed_at)' : params.sort.field;
        query = query.order(sortField, { ascending: params.sort.order === 'asc' });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      const page = params.page || 1;
      const limit = params.limit || 10;
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching gigs:', error);
        return {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'ไม่สามารถดึงข้อมูลงานได้',
            details: error
          }
        };
      }

      // Calculate summary
      let summary = undefined;
      if (data && data.length > 0) {
        summary = {
          total_amount: data.reduce((sum, gig) => sum + (gig.total_amount || 0), 0),
          total_fees: data.reduce((sum, gig) => sum + (gig.fee_amount || 0), 0),
          total_payouts: data.reduce((sum, gig) => sum + (gig.musician_payout || 0), 0)
        };
      }

      return {
        success: true,
        data: {
          data: data as Gig[],
          total: count || 0,
          page,
          limit,
          hasMore: (count || 0) > to + 1,
          summary
        }
      };
    } catch (error) {
      console.error('Error in getGigs:', error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
          details: error
        }
      };
    }
  }

  // =====================================================
  // 2. Payment Status Management
  // =====================================================

  // อัปเดตสถานะการจ่ายเงิน
  static async updatePaymentStatus(gigId: string, status: PaymentStatus): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('gigs')
        .update({
          payment_status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', gigId);

      if (error) {
        console.error('Error updating payment status:', error);
        return {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'ไม่สามารถอัปเดตสถานะการจ่ายเงินได้',
            details: error
          }
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in updatePaymentStatus:', error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
          details: error
        }
      };
    }
  }

  // ดึงข้อมูลสรุปการจ่ายเงิน
  static async getPayoutSummary(params: GigFilter = {}): Promise<ApiResponse<PayoutSummary[]>> {
    try {
      let query = supabase
        .from('gig_financial_summary')
        .select('*');

      // Apply filters
      if (params.payment_status) {
        query = query.eq('payment_status', params.payment_status);
      }
      if (params.musician_id) {
        query = query.eq('musician_id', params.musician_id);
      }
      if (params.shop_id) {
        query = query.eq('shop_id', params.shop_id);
      }
      if (params.date_from) {
        query = query.gte('created_at', params.date_from);
      }
      if (params.date_to) {
        query = query.lte('created_at', params.date_to);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching payout summary:', error);
        return {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'ไม่สามารถดึงข้อมูลสรุปการจ่ายเงินได้',
            details: error
          }
        };
      }

      return {
        success: true,
        data: data as PayoutSummary[]
      };
    } catch (error) {
      console.error('Error in getPayoutSummary:', error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
          details: error
        }
      };
    }
  }

  // =====================================================
  // 3. Gig Log Management
  // =====================================================

  // สร้าง gig log (หลักฐานการทำงาน)
  static async createGigLog(data: CreateGigLogRequest): Promise<ApiResponse<GigLog>> {
    try {
      // ตรวจสอบว่ามี gig นี้จริงและผู้ใช้มีสิทธิ์
      const gigCheck = await this.getGig(data.gig_id);
      if (!gigCheck.success) {
        return {
          success: false,
          error: {
            code: 'GIG_NOT_FOUND',
            message: 'ไม่พบข้อมูลงาน'
          }
        };
      }

      const { data: logData, error } = await supabase
        .from('gig_logs')
        .insert({
          gig_id: data.gig_id,
          evidence_photo_url: data.evidence_photo_url,
          check_in_location: data.check_in_location
        })
        .select(`
          *,
          gig:gigs(
            id,
            title,
            total_amount,
            musician_payout,
            payment_status,
            musician:profiles!gigs_musician_id_fkey(id, full_name),
            shop:profiles!gigs_shop_id_fkey(id, full_name)
          )
        `)
        .single();

      if (error) {
        console.error('Error creating gig log:', error);
        return {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'ไม่สามารถสร้างหลักฐานการทำงานได้',
            details: error
          }
        };
      }

      return {
        success: true,
        data: logData as GigLog
      };
    } catch (error) {
      console.error('Error in createGigLog:', error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
          details: error
        }
      };
    }
  }

  // ดึงข้อมูล gig logs
  static async getGigLogs(gigId: string, params: { page?: number; limit?: number } = {}): Promise<ApiResponse<GigLogListResponse>> {
    try {
      const page = params.page || 1;
      const limit = params.limit || 10;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await supabase
        .from('gig_logs_detail')
        .select('*', { count: 'exact' })
        .eq('gig_id', gigId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('Error fetching gig logs:', error);
        return {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'ไม่สามารถดึงข้อมูลหลักฐานการทำงานได้',
            details: error
          }
        };
      }

      // Get gig info for the response
      let gig = undefined;
      if (data && data.length > 0) {
        gig = await this.getGig(gigId);
      }

      return {
        success: true,
        data: {
          data: data as GigLog[],
          total: count || 0,
          page,
          limit,
          hasMore: (count || 0) > to + 1,
          gig: gig?.data
        }
      };
    } catch (error) {
      console.error('Error in getGigLogs:', error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
          details: error
        }
      };
    }
  }

  // =====================================================
  // 4. User Role Management
  // =====================================================

  // ดึงข้อมูลผู้ใช้พร้อม role
  static async getUserProfile(userId: string): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'ไม่สามารถดึงข้อมูลผู้ใช้ได้',
            details: error
          }
        };
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
          details: error
        }
      };
    }
  }

  // อัปเดต role ของผู้ใช้ (สำหรับ admin)
  static async updateUserRole(userId: string, role: UserRole): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          role: role,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user role:', error);
        return {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'ไม่สามารถอัปเดตบทบาทผู้ใช้ได้',
            details: error
          }
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in updateUserRole:', error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
          details: error
        }
      };
    }
  }

  // =====================================================
  // 5. Utility Functions
  // =====================================================

  // คำนวณข้อมูลการเงิน
  static calculateFinancialData(totalAmount: number): FinancialCalculation {
    const fee_amount = totalAmount * FEE_RATE;
    const musician_payout = totalAmount * PAYOUT_RATE;
    
    return {
      total_amount: totalAmount,
      fee_rate: FEE_RATE,
      fee_amount,
      payout_rate: PAYOUT_RATE,
      musician_payout
    };
  }

  // ตรวจสอบสิทธิ์ผู้ใช้
  static async checkUserPermission(userId: string, gigId: string, requiredRole?: UserRole): Promise<ApiResponse<boolean>> {
    try {
      // ดึงข้อมูลผู้ใช้
      const userResult = await this.getUserProfile(userId);
      if (!userResult.success) {
        return {
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'ไม่สามารถตรวจสอบสิทธิ์ผู้ใช้ได้'
          }
        };
      }

      const user = userResult.data;
      
      // ถ้าต้องการ role พิเศษ
      if (requiredRole && user.role !== requiredRole && user.role !== 'ADMIN') {
        return {
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'ไม่มีสิทธิ์ในการดำเนินการ'
          }
        };
      }

      // ดึงข้อมูลงาน
      const gigResult = await this.getGig(gigId);
      if (!gigResult.success) {
        return {
          success: false,
          error: {
            code: 'GIG_NOT_FOUND',
            message: 'ไม่พบข้อมูลงาน'
          }
        };
      }

      const gig = gigResult.data;
      
      // ตรวจสอบว่าผู้ใช้เกี่ยวข้องกับงานนี้หรือเป็น admin
      const hasPermission = 
        gig.musician_id === userId || 
        gig.shop_id === userId || 
        user.role === 'ADMIN';

      if (!hasPermission) {
        return {
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'ไม่มีสิทธิ์ในการดำเนินการกับงานนี้'
          }
        };
      }

      return { success: true, data: true };
    } catch (error) {
      console.error('Error in checkUserPermission:', error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
          details: error
        }
      };
    }
  }

  // ดึงข้อมูลสรุปสำหรับ Dashboard
  static async getDashboardData(userId: string, userRole: UserRole): Promise<ApiResponse<any>> {
    try {
      let dashboardData = {};

      switch (userRole) {
        case 'MUSICIAN':
          // ดึงข้อมูลสำหรับนักดนตรี
          const musicianGigs = await this.getGigs({
            filter: { musician_id: userId }
          });
          
          if (musicianGigs.success) {
            const completedGigs = musicianGigs.data.data.filter(gig => 
              gig.status === 'completed'
            );
            
            const totalEarnings = completedGigs.reduce((sum, gig) => 
              sum + (gig.musician_payout || 0), 0
            );
            
            const pendingPayouts = musicianGigs.data.data.filter(gig => 
              gig.payment_status === 'advanced_by_admin'
            ).reduce((sum, gig) => sum + (gig.musician_payout || 0), 0);

            dashboardData = {
              total_gigs: musicianGigs.data.total,
              completed_gigs: completedGigs.length,
              total_earnings: totalEarnings,
              pending_payouts: pendingPayouts,
              recent_gigs: musicianGigs.data.data.slice(0, 5)
            };
          }
          break;

        case 'SHOP':
          // ดึงข้อมูลสำหรับร้าน
          const shopGigs = await this.getGigs({
            filter: { shop_id: userId }
          });
          
          if (shopGigs.success) {
            const completedGigs = shopGigs.data.data.filter(gig => 
              gig.status === 'completed'
            );
            
            const totalSpent = completedGigs.reduce((sum, gig) => 
              sum + (gig.total_amount || 0), 0
            );
            
            const pendingPayments = shopGigs.data.data.filter(gig => 
              gig.payment_status === 'advanced_by_admin'
            ).reduce((sum, gig) => sum + (gig.total_amount || 0), 0);

            dashboardData = {
              total_gigs: shopGigs.data.total,
              completed_gigs: completedGigs.length,
              total_spent: totalSpent,
              pending_payments: pendingPayments,
              recent_gigs: shopGigs.data.data.slice(0, 5)
            };
          }
          break;

        case 'ADMIN':
          // ดึงข้อมูลสำหรับ admin
          const allGigs = await this.getGigs();
          
          if (allGigs.success) {
            const totalFeesCollected = allGigs.data.data.reduce((sum, gig) => 
              sum + (gig.fee_amount || 0), 0
            );
            
            const pendingAdvances = allGigs.data.data.filter(gig => 
              gig.payment_status === 'pending'
            ).length;
            
            const pendingRepayments = allGigs.data.data.filter(gig => 
              gig.payment_status === 'advanced_by_admin'
            ).length;

            dashboardData = {
              total_gigs: allGigs.data.total,
              total_fees_collected: totalFeesCollected,
              pending_advances: pendingAdvances,
              pending_repayments: pendingRepayments,
              recent_gigs: allGigs.data.data.slice(0, 10)
            };
          }
          break;
      }

      return {
        success: true,
        data: dashboardData
      };
    } catch (error) {
      console.error('Error in getDashboardData:', error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
          details: error
        }
      };
    }
  }
}
