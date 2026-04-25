import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, QrCode, Users, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
// Simple QR code placeholder - install react-qr-code library for actual implementation
const QRCodePlaceholder = ({ value }: { value: string }) => (
  <div className="bg-white p-4 rounded-lg border-2 border-gray-300">
    <div className="w-64 h-64 bg-gray-100 rounded flex items-center justify-center">
      <QrCode className="w-16 h-16 text-gray-400" />
      <p className="text-xs text-gray-600 mt-2 text-center">QR Code</p>
    </div>
    <p className="text-xs text-gray-500 mt-2 font-mono">{value}</p>
  </div>
);

interface Booking {
  id: string;
  gig_id: string;
  customer_id: string;
  amount_paid: number;
  status: string;
  booking_date: string;
  customer?: {
    full_name: string;
    avatar_url?: string;
  };
}

interface Gig {
  id: string;
  title?: string;
  instrument?: string;
  location: string;
  date: string;
  booking_status: string;
  total_bookings: number;
  total_tips: number;
}

const MusicianQRPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentGig, setCurrentGig] = useState<Gig | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentProfile, setCurrentProfile] = useState<any>(null);
  const [qrValue, setQrValue] = useState<string>('');

  useEffect(() => {
    fetchCurrentGig();
    fetchBookings();
    fetchUserProfile();
  }, []);

  const fetchCurrentGig = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get current active gig for this musician
      const { data: gigs, error } = await supabase
        .from('gigs')
        .select('*')
        .eq('musician_id', user.id)
        .in('status', ['in_progress', 'awaiting_approval'])
        .order('date', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching gig:', error);
        return;
      }

      if (gigs && gigs.length > 0) {
        setCurrentGig(gigs[0]);
        setQrValue(`gig-${gigs[0].id}`);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          customer:profiles!bookings_customer_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .eq('gig_id', currentGig?.id || '')
        .eq('status', 'confirmed')
        .order('booking_date', { ascending: false });

      if (error) {
        console.error('Error fetching bookings:', error);
        return;
      }

      setBookings(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        setCurrentProfile(profile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-bold">QR Code สำหรับนักดนตรี</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {currentProfile?.full_name || 'Guest'}
              </span>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <QrCode className="w-4 h-4 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {!currentGig ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              ไม่พบงานที่กำลังดำเนินงาน
            </h3>
            <p className="text-gray-600 mb-4">
              กรุณาสแกน QR Code จากหน้า Musician Scan เพื่อเริ่มงาน
            </p>
            <Button onClick={() => navigate('/musician/scan')}>
              ไปยังหน้าสแกน
            </Button>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2">
            {/* QR Code Section */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-green-600" />
                    QR Code สำหรับเข้าถึงโต๊ะ
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    แสดง QR Code นี้ให้พนักงานเพื่อยืนยันตัวตน
                  </p>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="bg-white p-4 rounded-lg inline-block">
                    {qrValue && (
                      <QRCodePlaceholder value={qrValue} />
                    )}
                  </div>
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-gray-600">
                      งาน: {currentGig.title || currentGig.instrument}
                    </p>
                    <p className="text-sm text-gray-600">
                      สถานที่: {currentGig.location}
                    </p>
                    <p className="text-sm text-gray-600">
                      วันที่: {currentGig.date}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bookings Section */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    รายชื่อผู้จองโต๊ะ
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    รายชื่อผู้ที่ได้จองโต๊ะสำหรับงานนี้
                  </p>
                </CardHeader>
                <CardContent>
                  {bookings.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-3 flex items-center justify-center">
                        <Users className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-gray-600">
                        ยังไม่มีผู้จองโต๊ะสำหรับงานนี้
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {bookings.map((booking) => (
                        <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            {booking.customer?.avatar_url ? (
                              <img
                                src={booking.customer.avatar_url}
                                alt={booking.customer.full_name}
                                className="w-8 h-8 rounded-full"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                <Users className="w-4 h-4 text-gray-600" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">
                                {booking.customer.full_name}
                              </p>
                              <p className="text-sm text-gray-600">
                                {booking.amount_paid.toFixed(2)} บาท
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-green-600 font-medium">
                              ยืนยันแล้ว
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="mt-6 bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-3">สถิติการจอง</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-blue-700">จำนวนทั้งหมด</p>
                        <p className="font-semibold text-blue-900">
                          {bookings.reduce((sum, b) => sum + b.amount_paid, 0).toFixed(2)} บาท
                        </p>
                      </div>
                      <div>
                        <p className="text-blue-700">จำนวนคน</p>
                        <p className="font-semibold text-blue-900">
                          {bookings.length} คน
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-green-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-4">
            วิธีใช้ QR Code
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium text-green-800 mb-2">สำหรับพนักงาน</h4>
              <ul className="space-y-1 text-sm text-green-700">
                <li>• สแกน QR Code นี้ด้วยแอป</li>
                <li>• ระบบจะแสดงข้อมูลการจอง</li>
                <li>• ยืนยันตัวตนและข้อมูลการจอง</li>
                <li>• ปลอดภัยเข้าถึงโต๊ะได้</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-green-800 mb-2">สำหรับนักดนตรี</h4>
              <ul className="space-y-1 text-sm text-green-700">
                <li>• แสดง QR Code ให้พนักงาน</li>
                <li>• ตรวจสอบข้อมูลการจอง</li>
                <li>• จัดการรายชื่อผู้เข้าชม</li>
                <li>• ปลอดภัยเมื่อจบการแสดงสด</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicianQRPage;
