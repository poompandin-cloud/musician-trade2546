import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, QrCode, Clock, MapPin, Calendar, AlertCircle, Camera, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const VenueQRSelectPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pendingGigs, setPendingGigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [newGigForm, setNewGigForm] = useState({
    title: '',
    instrument: '',
    location: '',
    date: '',
    final_price: '',
  });

  useEffect(() => {
    fetchPendingGigs();
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('is_verified')
      .eq('id', user.id)
      .single();
    if (data) {
      setProfile(data);
    }
  };

  const fetchPendingGigs = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from('gigs')
      .select('*')
      .eq('shop_id', user.id)
      .in('status', ['pending', 'awaiting_approval']) // Include both pending and awaiting_approval
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Failed to load gigs', description: error.message, variant: 'destructive' });
    } else {
      setPendingGigs(data || []);
    }
  };

  const createNewGig = async () => {
    if (!newGigForm.title || !newGigForm.location || !newGigForm.final_price) {
      toast({ title: 'Please fill required fields', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: 'Not logged in', variant: 'destructive' });
      setLoading(false);
      return;
    }
    const now = new Date();
    const finalPriceNum = parseFloat(newGigForm.final_price);
    console.log('final_price from form:', newGigForm.final_price, 'parsed to number:', finalPriceNum);
    const payload = {
      shop_id: user.id,
      title: newGigForm.title,
      instrument: newGigForm.instrument,
      location: newGigForm.location,
      date: newGigForm.date || now.toISOString().split('T')[0],
      final_price: finalPriceNum,
      status: 'pending',
    };
    console.log('Insert payload:', payload);
    const { data, error } = await supabase
      .from('gigs')
      .insert(payload)
      .select()
      .single();
    if (error) {
      console.error('Insert error details:', error);
      toast({ title: 'Failed to create gig', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Gig created!' });
      navigate(`/venue/qr/${data.id}`);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Select or Create Gig</h1>
        </div>

        {profile?.is_verified === false && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">Verify your venue to Create Gig</p>
              <p className="text-xs text-yellow-700">บัญชีของคุณยังไม่ได้รับการยืนยัน กรุณายืนยันตัวตนเพื่อเปิดใช้งาน</p>
              <Button size="sm" onClick={() => navigate('/venue/verification-request')}>
                Verify Now
              </Button>
            </div>
          </div>
        )}

        {/* Create new gig form */}
        <Card>
          <CardHeader>
            <CardTitle>ระบุรายละเอียดการจ้าง</CardTitle>
            <p className="text-sm text-gray-500">ระบุรายละเอียดการจ้างเพื่อสร้าง QR CODE</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title"> ชื่อนักดนตรี( ผู้ที่ถูกจ้าง )*</Label>
              <Input
                id="title"
                placeholder="เบส,ฟิว,กาย"
                value={newGigForm.title}
                onChange={(e) => setNewGigForm({ ...newGigForm, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="instrument">เครื่องดนตรีที่จ้าง</Label>
              <Input
                id="instrument"
                placeholder="กีต้าร์,กลอง,เบส,ร้อง"
                value={newGigForm.instrument}
                onChange={(e) => setNewGigForm({ ...newGigForm, instrument: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="location">ชื่อร้าน *</Label>
              <Input
                id="location"
                placeholder="ร้าน ABC"
                value={newGigForm.location}
                onChange={(e) => setNewGigForm({ ...newGigForm, location: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="date">วันที่</Label>
              <Input
                id="date"
                type="date"
                value={newGigForm.date}
                onChange={(e) => setNewGigForm({ ...newGigForm, date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="final_price">ราคาที่จ้าง (บาท) *</Label>
              <Input
                id="final_price"
                type="number"
                placeholder="900,1000,1500"
                value={newGigForm.final_price}
                onChange={(e) => setNewGigForm({ ...newGigForm, final_price: e.target.value })}
              />
            </div>
            <Button onClick={createNewGig} disabled={loading || profile?.is_verified === false} className="w-full">
              {profile?.is_verified === false ? (
                <>
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Verify your venue first
                </>
              ) : loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Gig & Generate QR
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Pending gigs list */}
        {pendingGigs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Pending Gigs</CardTitle>
              <p className="text-sm text-gray-500">Select a gig to generate its QR code</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingGigs.map((gig) => (
                <div key={gig.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{gig.title || gig.instrument}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {gig.location}
                    </p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {gig.date}
                    </p>
                    {gig.final_price && (
                      <p className="text-sm font-medium text-green-600">
                        Price: {gig.final_price} Baht
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    {gig.status === 'awaiting_approval' ? (
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => navigate(`/venue/gig/${gig.id}`)}
                        >
                          <Camera className="w-4 h-4 mr-1" />
                          View Proof
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => navigate(`/venue/gig/${gig.id}`)}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Check Work
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" onClick={() => navigate(`/venue/qr/${gig.id}`)}>
                        <QrCode className="w-4 h-4 mr-1" />
                        QR
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default VenueQRSelectPage;
