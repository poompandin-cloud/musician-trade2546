import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Music, QrCode, CheckCircle, XCircle, DollarSign, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import QRCode from 'qrcode';

interface SongRequest {
  id: string;
  gig_id: string;
  musician_id: string;
  customer_id?: string;
  song_name: string;
  tip_amount: number;
  payment_status: string;
  created_at: string;
  customer?: {
    full_name: string;
  };
}

const MusicianCommandCenter = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [songRequests, setSongRequests] = useState<SongRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalTips, setTotalTips] = useState(0);
  const [showQR, setShowQR] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<any>(null);
  const [songList, setSongList] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [tipQrUrl, setTipQrUrl] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [uploadingQr, setUploadingQr] = useState(false);
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | '2days' | '3days' | '4days' | '5days' | '6days' | '7days'>('today');
  const [todayDate, setTodayDate] = useState('');
  const [yesterdayDate, setYesterdayDate] = useState('');

  useEffect(() => {
    // Calculate dates first
    calculateDates();
  }, []);

  useEffect(() => {
    if (todayDate && yesterdayDate) {
      fetchSongRequests();
    }
    fetchProfile();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('song_requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'song_requests',
          filter: `musician_id=eq.${currentProfile?.id}`
        },
        (payload) => {
          console.log('Real-time update:', payload);
          console.log('New song request, fetching with date filter...');
          fetchSongRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentProfile, dateFilter, todayDate, yesterdayDate]);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setCurrentProfile(profile);
          setTipQrUrl(profile.tip_qr_url || '');
          setBankAccount(profile.bank_account || '');
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchSongRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Calculate dates if not already calculated
      if (!todayDate || !yesterdayDate) {
        calculateDates();
        return; // Return early and let useEffect call again
      }

      // Determine which date to filter by
      let targetDate = '';
      if (dateFilter === 'today') targetDate = todayDate;
      else if (dateFilter === 'yesterday') targetDate = yesterdayDate;
      else {
        // Calculate for 2-7 days
        const days = parseInt(dateFilter.replace('days', ''));
        const date = new Date();
        date.setDate(date.getDate() - days);
        targetDate = date.toISOString().split('T')[0];
      }
      console.log(`Fetching ${dateFilter} requests for date:`, targetDate);

      const { data, error } = await supabase
        .from('song_requests')
        .select(`
          *,
          customer:profiles!song_requests_customer_id_fkey (
            full_name
          )
        `)
        .eq('musician_id', user.id)
        .in('payment_status', ['pending', 'paid'])
        .gte('created_at', `${targetDate}T00:00:00.000Z`)
        .lt('created_at', `${targetDate}T23:59:59.999Z`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching song requests:', error);
        toast({
          title: 'Failed to load song requests',
          description: error.message,
          variant: 'destructive'
        });
        return;
      }

      console.log(`Found ${data?.length || 0} ${dateFilter} requests`);
      setSongRequests(data || []);
      
      // Calculate total tips for filtered requests
      const total = data?.reduce((sum, request) => sum + (request.tip_amount || 0), 0) || 0;
      setTotalTips(total);
    } catch (error) {
      console.error('Error fetching song requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSongAction = async (requestId: string, action: 'played' | 'skipped') => {
    try {
      const { error } = await supabase
        .from('song_requests')
        .update({
          payment_status: action === 'played' ? 'paid' : 'failed'
        })
        .eq('id', requestId);

      if (error) {
        console.error('Error updating song request:', error);
        toast({
          title: 'Failed to update song request',
          description: error.message,
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Song request updated',
        description: `Song marked as ${action === 'played' ? 'played' : 'skipped'}`
      });

      fetchSongRequests();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to update song request',
        variant: 'destructive'
      });
    }
  };

  const generateQRCode = async () => {
    if (!currentProfile) return;
    
    const qrUrl = `${window.location.origin}/customer-portal?musician=${currentProfile.id}&songs=${encodeURIComponent(songList)}`;
    
    try {
      // Generate QR code as data URL
      const qrDataUrl = await QRCode.toDataURL(qrUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      setQrCodeUrl(qrUrl);
      setQrCodeDataUrl(qrDataUrl);
      toast({
        title: 'QR Code สำหรับแล้ว',
        description: 'แชร์ QR Code ให้ลูกค้า'
      });
      
      setShowQR(true);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถสร้าง QR Code ได้',
        variant: 'destructive'
      });
    }
  };

  const handlePromptPayQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('Starting QR upload for user:', currentProfile.id);
    setUploadingQr(true);
    
    try {
      const fileName = `${currentProfile.id}-promptpay-qr-${Date.now()}`;
      console.log('Uploading file with name:', fileName);
      
      const { error } = await supabase.storage
        .from('payment-qr')
        .upload(fileName, file, { contentType: file.type });
      
      if (error) {
        console.error('Storage upload error:', error);
        toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
        return;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('payment-qr')
        .getPublicUrl(fileName);
      
      console.log('Generated public URL:', publicUrl);
      setTipQrUrl(publicUrl);
      
      // Update profile
      console.log('Updating profile with tip_qr_url:', publicUrl);
      const { error: updateError, data: updateData } = await supabase
        .from('profiles')
        .update({ tip_qr_url: publicUrl })
        .eq('id', currentProfile.id)
        .select()
        .single();
      
      console.log('Profile update result:', { updateError, updateData });
      
      if (updateError) {
        console.error('Profile update error:', updateError);
        toast({ title: 'Failed to save QR', description: updateError.message, variant: 'destructive' });
      } else {
        console.log('Profile updated successfully:', updateData);
        toast({ title: 'QR Code อัปโหลดสำเร็จ!' });
        
        // Refresh profile data
        await fetchProfile();
      }
    } catch (error) {
      console.error('Error uploading QR:', error);
      toast({ title: 'Upload failed', description: 'ไม่สามารถอัปโหลด QR Code ได้', variant: 'destructive' });
    } finally {
      setUploadingQr(false);
    }
  };

  const handleBankAccountChange = async (value: string) => {
    console.log('Updating bank account for user:', currentProfile.id, 'to:', value);
    setBankAccount(value);
  };

  const handleSavePaymentInfo = async () => {
    console.log('Manual save payment info for user:', currentProfile.id);
    console.log('Saving tip_qr_url:', tipQrUrl);
    console.log('Saving bank_account:', bankAccount);
    
    try {
      const { error, data } = await supabase
        .from('profiles')
        .update({ 
          tip_qr_url: tipQrUrl,
          bank_account: bankAccount 
        })
        .eq('id', currentProfile.id)
        .select()
        .single();
      
      console.log('Payment info save result:', { error, data });
      
      if (error) {
        console.error('Payment info save error:', error);
        toast({ 
          title: 'Failed to save payment info', 
          description: error.message, 
          variant: 'destructive' 
        });
      } else {
        console.log('Payment info saved successfully:', data);
        toast({ 
          title: 'บันทึกข้อมูลสำเร็จ!', 
          description: 'ข้อมูลการรับเงินถูกบันทึกแล้ว' 
        });
        
        // Refresh profile data
        await fetchProfile();
      }
    } catch (error) {
      console.error('Error saving payment info:', error);
      toast({ 
        title: 'Save failed', 
        description: 'ไม่สามารถบันทึกข้อมูลได้', 
        variant: 'destructive' 
      });
    }
  };

  // Calculate today and yesterday dates
  const calculateDates = () => {
    const today = new Date();
    const dates: { [key: string]: string } = {};
    
    // Calculate all 7 days
    for (let i = 0; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      if (i === 0) dates['today'] = dateStr;
      else if (i === 1) dates['yesterday'] = dateStr;
      else dates[`${i}days`] = dateStr;
    }
    
    setTodayDate(dates['today']);
    setYesterdayDate(dates['yesterday']);
    
    console.log('Date calculation:', dates);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Glass-morphism overlay */}
      <div className="min-h-screen backdrop-blur-lg bg-white/10">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="text-slate-600 hover:bg-slate-100"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">เพลงที่ได้รับจากลูกค้า</h1>
                <p className="text-slate-600">จัดการคิวเพลง</p>
              </div>
            </div>
            
            <Button
              onClick={generateQRCode}
              className="bg-slate-800 hover:bg-slate-900 text-white border border-slate-600 shadow-md"
            >
              <QrCode className="w-4 h-4 mr-2" />
              สร้างคิวอาร์โค้ดเพื่อรับเพลง
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-white/90 backdrop-blur-md border-gray-200 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm"> ทิปที่ได้รับ</p>
                    <p className="text-2xl font-bold text-slate-800">฿{totalTips.toFixed(2)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-md border-gray-200 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">ลูกค้าที่ขอเพลง</p>
                    <p className="text-2xl font-bold text-slate-800">{songRequests.length}</p>
                  </div>
                  <Music className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-md border-gray-200 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">โปรไฟล์ของฉัน</p>
                    <p className="text-2xl font-bold text-slate-800">{currentProfile?.full_name || 'Loading'}</p>
                  </div>
                  <Users className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

          {/* Song Requests Queue */}
          <Card className="bg-white/90 backdrop-blur-md border-gray-200 shadow-lg col-span-1 md:col-span-3">
            <CardHeader className="pb-2">
              {/* Header with Title and Dropdown */}
              <div className="flex items-center justify-between gap-4 mb-2">
                <CardTitle className="text-slate-800 flex items-center gap-2 text-lg">
                  <Clock className="w-5 h-5" />
                  เพลงที่ลูกค้าขอ
                </CardTitle>
                
                {/* Date Filter Dropdown */}
                <div className="relative">
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value as 'today' | 'yesterday' | '2days' | '3days' | '4days' | '5days' | '6days' | '7days')}
                    className="bg-white/90 text-slate-700 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 min-w-[120px] backdrop-blur-sm shadow-sm max-h-32 overflow-y-auto"
                  >
                    <option value="today" className="bg-white">วันนี้</option>
                    <option value="yesterday" className="bg-white">เมื่อวานนี้</option>
                    <option value="2days" className="bg-white">เมื่อ 2 วันก่อน</option>
                    <option value="3days" className="bg-white">เมื่อ 3 วันก่อน</option>
                    <option value="4days" className="bg-white">เมื่อ 4 วันก่อน</option>
                    <option value="5days" className="bg-white">เมื่อ 5 วันก่อน</option>
                    <option value="6days" className="bg-white">เมื่อ 6 วันก่อน</option>
                    <option value="7days" className="bg-white">เมื่อ 7 วันก่อน</option>
                  </select>
                </div>
              </div>
              
              {/* Date Info */}
              <div className="text-slate-600 text-sm flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                {(() => {
                let displayDate = '';
                let displayText = '';
                
                if (dateFilter === 'today') {
                  displayDate = todayDate;
                  displayText = 'วันนี้';
                } else if (dateFilter === 'yesterday') {
                  displayDate = yesterdayDate;
                  displayText = 'เมื่อวานนี้';
                } else {
                  const days = parseInt(dateFilter.replace('days', ''));
                  const date = new Date();
                  date.setDate(date.getDate() - days);
                  displayDate = date.toISOString().split('T')[0];
                  displayText = `เมื่อ ${days} วันก่อน`;
                }
                
                return <span>{displayText} ({displayDate})</span>;
              })()}
              </div>
            </CardHeader>
            <CardContent>
              {songRequests.length === 0 ? (
                <div className="text-center py-12">
                  <Music className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-slate-600 mb-2">No song requests yet</h3>
                  <p className="text-slate-500">Share your QR code to receive song requests</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {songRequests.map((request) => (
                    <div
                      key={request.id}
                      className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-gray-200 shadow-sm"
                    >
                      <div className="flex flex-col gap-2">
                        {/* Song Info */}
                        <div className="flex items-center gap-2">
                          <div className="flex-shrink-0 w-6 h-6 bg-slate-800 text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {songRequests.length - songRequests.indexOf(request)}
                          </div>
                          <h4 className="text-base font-medium text-slate-800 mb-1 truncate">
                            {request.song_name}
                          </h4>
                        </div>
                        <div>
                          <p className="text-slate-600 text-xs mb-2 truncate">
                            Requested by: {request.customer?.full_name || 'Anonymous'}
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-slate-500 text-xs">
                              {new Date(request.created_at).toLocaleTimeString()}
                            </span>
                            {request.tip_amount > 0 && (
                              <span className="text-yellow-600 font-medium text-xs">
                                ฿{request.tip_amount.toFixed(2)} ทิปที่ได้รับ
                              </span>
                            )}
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              request.payment_status === 'pending' 
                                ? 'bg-yellow-100 text-yellow-700' 
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {request.payment_status}
                            </span>
                          </div>
                        </div>
                        
                        {/* Action Button */}
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            onClick={() => handleSongAction(request.id, 'played')}
                            className="bg-green-100 hover:bg-green-200 text-green-700 border border-green-300 text-xs px-3 py-1"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            ยืนยันการเล่น
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* QR Code Modal */}
          {showQR && (
            <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black bg-opacity-50 pt-20">
              <div className="bg-white p-3 rounded-xl shadow-2xl max-w-[780px] w-full m-4 relative">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">QR Code สำหรับแล้ว</h3>
                
                {/* QR Code Section */}
                <div className="mb-4">
                  <div className="bg-white p-4 rounded border-2 border-gray-300 flex justify-center mb-4">
                    {qrCodeDataUrl ? (
                      <img 
                        src={qrCodeDataUrl} 
                        alt="QR Code" 
                        className="w-20 h-20 object-contain"
                      />
                    ) : (
                      <div className="text-center">
                        <div className="text-6xl mb-2">🎵</div>
                        <p className="text-sm text-gray-600">กำลังสร้าง QR Code...</p>
                      </div>
                    )}
                  </div>
                  <div className="bg-gray-100 rounded p-3">
                    <p className="text-gray-600 mb-2">
                      QR Code :
                    </p>
                    <p className="text-sm text-gray-700 break-all">
                      {qrCodeUrl}
                    </p>
                  </div>
                </div>
           {/* Bank Account Input */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      วิธีการนำคิวอาร์โค้ดไปใช้งาน    
                      1.นำคิวอาร์โค้ดด้านบนไปปริ้นออกมา
                      2.นำภาพคิวอาร์ที่คุณปริ้นออกมาไปแปะที่แสตนโน้ตของคุณ
                    
                    </label>
                    
                  </div>

                {/* Payment Information Section */}
                <div className="mb-6 border-t pt-4">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">อัปโหลดคิวอาร์โค้ดของคุณเพื่อรับทิป</h4>
                  
                  {/* PromptPay QR Upload */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                     
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePromptPayQrUpload}
                        disabled={uploadingQr}
                        className="hidden"
                        id="promptpay-qr-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('promptpay-qr-upload')?.click()}
                        disabled={uploadingQr}
                        className="flex-1"
                      >
                        {uploadingQr ? 'กำลังอัปโหลด...' : 'เลือกรูปคิวอาร์โค้ด'}
                      </Button>
                    </div>
                    
                    {/* QR Preview */}
                    {tipQrUrl && (
                      <div className="mt-3">
                        <img src={tipQrUrl} alt="Tip QR" className="w-32 h-32 object-contain" />
                      </div>
                    )}
                  </div>

                  

                  {/* Save Button */}
                  <Button
                    onClick={handleSavePaymentInfo}
                    disabled={uploadingQr}
                    className="w-full"
                  >
                    บันทึกข้อมูลการรับเงิน
                  </Button>
                </div>

                {/* Close Button */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowQR(false)}
                    className="flex-1"
                  >
                    ปิด
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
};

export default MusicianCommandCenter;
