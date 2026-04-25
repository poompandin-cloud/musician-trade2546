import { supabase } from '@/integrations/supabase/client';

export interface Gig {
  id: string;
  title: string;
  description?: string;
  date: string;
  location?: string;
  venue?: string;
  musician_id: string;
  shop_id?: string;
  total_amount: number;
  fee_amount: number;
  musician_payout: number;
  payment_status?: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export interface PayoutServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class PayoutService {
  /**
   * Fetch gigs from Supabase with optional filtering
   */
  static async getGigs(params: {
    filter?: {
      musician_id?: string;
      shop_id?: string;
      payment_status?: string;
    };
    limit?: number;
    offset?: number;
  } = {}): Promise<PayoutServiceResponse<{ data: Gig[]; count: number }>> {
    try {
      let query = supabase
        .from('gigs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters if provided
      if (params.filter?.musician_id) {
        query = query.eq('musician_id', params.filter.musician_id);
      }

      if (params.filter?.shop_id) {
        query = query.eq('shop_id', params.filter.shop_id);
      }

      if (params.filter?.payment_status) {
        query = query.eq('payment_status', params.filter.payment_status);
      }

      // Apply pagination if provided
      if (params.limit) {
        query = query.limit(params.limit);
      }

      if (params.offset) {
        query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('PayoutService.getGigs error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: {
          data: data as Gig[] || [],
          count: count || 0
        }
      };
    } catch (error) {
      console.error('PayoutService.getGigs unexpected error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Update gig payment status
   */
  static async updatePaymentStatus(
    gigId: string,
    paymentStatus: string
  ): Promise<PayoutServiceResponse<Gig>> {
    try {
      const { data, error } = await supabase
        .from('gigs')
        .update({
          payment_status: paymentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', gigId)
        .select()
        .single();

      if (error) {
        console.error('PayoutService.updatePaymentStatus error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data as Gig
      };
    } catch (error) {
      console.error('PayoutService.updatePaymentStatus unexpected error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get gig by ID
   */
  static async getGigById(gigId: string): Promise<PayoutServiceResponse<Gig>> {
    try {
      const { data, error } = await supabase
        .from('gigs')
        .select(`
          *,
          profiles!gigs_musician_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .eq('id', gigId)
        .single();

      if (error) {
        console.error('PayoutService.getGigById error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data as Gig
      };
    } catch (error) {
      console.error('PayoutService.getGigById unexpected error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get gigs summary statistics
   */
  static async getGigsSummary(params: {
    musician_id?: string;
    shop_id?: string;
  } = {}): Promise<PayoutServiceResponse<{
    total_gigs: number;
    total_amount: number;
    total_payout: number;
    pending_payments: number;
    completed_payments: number;
  }>> {
    try {
      let query = supabase
        .from('gigs')
        .select('total_amount, musician_payout, payment_status');

      if (params.musician_id) {
        query = query.eq('musician_id', params.musician_id);
      }

      if (params.shop_id) {
        query = query.eq('shop_id', params.shop_id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('PayoutService.getGigsSummary error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      const gigs = data as Gig[];
      const total_gigs = gigs.length;
      const total_amount = gigs.reduce((sum, gig) => sum + (gig.total_amount || 0), 0);
      const total_payout = gigs.reduce((sum, gig) => sum + (gig.musician_payout || 0), 0);
      const pending_payments = gigs.filter(gig => gig.payment_status === 'pending').length;
      const completed_payments = gigs.filter(gig => gig.payment_status === 'completed').length;

      return {
        success: true,
        data: {
          total_gigs,
          total_amount,
          total_payout,
          pending_payments,
          completed_payments
        }
      };
    } catch (error) {
      console.error('PayoutService.getGigsSummary unexpected error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

export default PayoutService;
