import React, { useState, useEffect } from 'react';
import { ArrowLeft, QrCode, X, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PayoutService from '../services/payoutService';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const PayoutManagementPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [gigs, setGigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalFees: 0,
    totalPayout: 0,
    totalPayable: 0
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Get current session with security check
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('Session error or no session:', sessionError);
        navigate('/auth');
        return;
      }
      
      const userId = session.user.id;
      console.log(' User ID  :', userId);
      
      // Get user role with validation
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (profileError || !profile) {
        console.error('Profile error or no profile:', profileError);
        toast({ 
          title: 'Access Denied', 
          description: 'User profile not found or invalid',
          variant: 'destructive' 
        });
        navigate('/');
        return;
      }
      
      const userRole = profile.role;
      setUserRole(userRole);
      console.log(' User Role:', userRole);
      
      // Validate role before fetching data
      if (!['musician', 'venue'].includes(userRole)) {
        console.error('Invalid role for payout page:', userRole);
        toast({ 
          title: 'Access Denied', 
          description: 'This page is only available for musicians and venues',
          variant: 'destructive' 
        });
        navigate('/');
        return;
      }
      
      // Fetch gigs data with proper role validation
      await fetchGigs(userRole);
    } catch (error) {
      console.error('User data fetch error:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to load user data',
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchGigs = async (role: string) => {
    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('❌ No session found');
        return;
      }
      
      const userId = session.user.id;
      console.log('🔍 Fetching gigs for user:', userId, 'with role:', role);
      
      let filterParams = {};
      
      if (role === 'musician') {
        // ดึงเฉพาะงานที่นักดนตรีคนนี้เล่น
        filterParams = { musician_id: userId };
        console.log('🎸 Musician mode: ดึงงานที่ musician_id =', userId);
      } else if (role === 'venue') {
        // ดึงเฉพาะงานที่เกิดขึ้นที่ร้านค้าแห่งนี้
        filterParams = { shop_id: userId };
        console.log('🏪 Venue mode: ดึงงานที่ shop_id =', userId);
      }
      
      // Fetch gigs with user-specific filter
      const response = await PayoutService.getGigs({
        filter: filterParams
      });
      
      console.log('📊 ข้อมูลที่ดึงได้ (filter แล้ว):', response);
      const gigsData = response.success ? (response.data?.data || []) : [];
      setGigs(gigsData);
      console.log('📊 จำนวนข้อมูลที่ได้ (สำหรับ user นี้):', gigsData.length);
      
      // Calculate summary based on role (using filtered data only)
      const totalIncome = gigsData.reduce((sum: number, gig: any) => sum + (gig.total_amount || 0), 0);
      const totalFees = gigsData.reduce((sum: number, gig: any) => sum + (gig.fee_amount || 0), 0);
      const totalPayout = gigsData.reduce((sum: number, gig: any) => sum + (gig.musician_payout || 0), 0);
      
      // For venues: calculate payable amount (unpaid gigs)
      let totalPayable = 0;
      if (role === 'venue') {
        const unpaidGigs = gigsData.filter((gig: any) => gig.payment_status !== 'completed');
        console.log(' unpaid gigs for venue:', unpaidGigs.length, 'gigs');
        totalPayable = unpaidGigs.reduce((sum: number, gig: any) => sum + (gig.total_amount || 0), 0);
        console.log(' unpaid amount:', totalPayable);
      }
      
      const newSummary = {
        totalIncome,
        totalFees,
        totalPayout,
        totalPayable
      };
      
      console.log(' Summary calculation (filtered data only):', {
        role,
        gigsCount: gigsData.length,
        totalIncome,
        totalFees,
        totalPayout,
        totalPayable
      });
      
      setSummary(newSummary);
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการดึงข้อมูล:', error);
      console.log('❌ Fetch Error Detail:', error);
      setGigs([]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">จัดการเงิน</h1>
              <p className="text-gray-600 mt-2">
                {loading ? 'กำลังโหลด...' : `พบข้อมูลงานทั้งหมด ${gigs.length} รายการ`}
              </p>
            </div>
          </div>
        </div>

        {/* Dashboard Summary Cards */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">รายได้รวม</CardTitle>
                <span className="text-2xl">💰</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(summary.totalIncome || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท
                </div>
                <p className="text-xs text-muted-foreground">
                  {gigs.length} รายการ
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ค่าธรรมเนียม (5%)</CardTitle>
                <span className="text-2xl">📊</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {(summary.totalFees || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท
                </div>
                <p className="text-xs text-muted-foreground">
                  คิดเป็น 5% ของรายได้รวม
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {userRole === 'venue' ? 'ยอดค้างชำระทั้งหมด' : 'ยอดเงินที่จะได้รับ'}
                </CardTitle>
                <span className="text-2xl">{userRole === 'venue' ? '💳' : '💵'}</span>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {(userRole === 'venue' ? (summary.totalPayable || 0) : (summary.totalPayout || 0)).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท
                </div>
                {userRole === 'venue' && (summary.totalPayable || 0) > 0 && (
                  <Button 
                    onClick={() => setShowQRModal(true)}
                    className="w-full mt-3 bg-orange-500 hover:bg-orange-600"
                    size="sm"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    ชำระเงิน
                  </Button>
                )}
                {userRole === 'venue' && (summary.totalPayable || 0) === 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    ไม่มียอดค้างชำระ
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Gigs Table */}
        {!loading && (
          <Card>
            <CardHeader>
              <CardTitle>รายการงาน</CardTitle>
            </CardHeader>
            <CardContent>
              {gigs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead> ชื่องาน </TableHead>
                      <TableHead> วันที่ </TableHead>
                      <TableHead> สถานที่ </TableHead>
                      <TableHead> รายได้รวม </TableHead>
                      <TableHead> ค่าธรรมเนียม 5% </TableHead>
                      <TableHead> ยอดที่ได้รับ </TableHead>
                      <TableHead> สถานะการจ่าย </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gigs.map((gig, index) => (
                      <TableRow key={gig.id || index}>
                        <TableCell className="font-medium">
                          {gig.title || ' ชื่องานไม่พบ'}
                        </TableCell>
                        <TableCell>
                          {gig.date ? new Date(gig.date).toLocaleDateString('th-TH') : ' วันที่ไม่พบ'}
                        </TableCell>
                        <TableCell>
                          {gig.location || gig.venue || ' สถานที่ไม่พบ'}
                        </TableCell>
                        <TableCell>
                          {gig.total_amount?.toLocaleString('th-TH', { minimumFractionDigits: 2 }) || '0.00'} บาท
                        </TableCell>
                        <TableCell>
                          {gig.fee_amount?.toLocaleString('th-TH', { minimumFractionDigits: 2 }) || '0.00'} บาท
                        </TableCell>
                        <TableCell className="font-semibold">
                          {gig.musician_payout?.toLocaleString('th-TH', { minimumFractionDigits: 2 }) || '0.00'} บาท
                        </TableCell>
                        <TableCell>
                          <Badge variant={gig.payment_status === 'completed' ? 'default' : 'secondary'}>
                            {gig.payment_status === 'completed' ? ' จ่ายแล้ว' : gig.payment_status === 'pending' ? ' รอดำเนินการ' : ' ไม่ระบุ'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4"> 0</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2"> 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0</h3>
                  <p className="text-gray-600"> 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
            </div>
          </div>
        )}

        
        {/* QR Code Modal for Payment */}
        {showQRModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>QR Code  Payment</span>
                  <Button variant="ghost" size="icon" onClick={() => setShowQRModal(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="w-48 h-48 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <QrCode className="w-24 h-24 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-500">QR Code for Payment</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-semibold">
                      Total Amount: {summary.totalPayable.toLocaleString('th-TH', { minimumFractionDigits: 2 })} THB
                    </p>
                    <p className="text-sm text-gray-600">
                      Please scan this QR code to complete the payment
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => setShowQRModal(false)}
                  className="w-full"
                  variant="outline"
                >
                  Close
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayoutManagementPage;
