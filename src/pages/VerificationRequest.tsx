import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Check, AlertCircle, User, Camera, FileText, Globe, Store, Phone, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const VerificationRequest = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  // Musician state
  const [musicianFiles, setMusicianFiles] = useState({
    fullName: '',
    idCardPhoto: null as File | null,
    selfieWithId: null as File | null,
    portfolioLink: '',
  });
  
  // Venue state
  const [venueFiles, setVenueFiles] = useState({
    businessLicense: null as File | null,
    utilityBill: null as File | null,
    selfieWithShopSign: null as File | null,
    ownerSelfieWithId: null as File | null,
    officialPhone: '',
    socialMediaLink: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('role, is_verified')
        .eq('id', user.id)
        .single();
        
      if (error) {
        console.error('Profile fetch error:', error);
        toast({ title: 'Failed to load profile', description: error.message, variant: 'destructive' });
      } else {
        console.log('Profile data:', data);
        setProfile(data);
        const role = data?.role || '';
        setUserRole(role);
        
        // If user has no role, show toast to select role first
        if (!role) {
          toast({ 
            title: 'กรุณาเลือก Role ก่อน', 
            description: 'กรุณาไปที่หน้า Profile เพื่อเลือก Role (Musician หรือ Venue) ก่อนยืนยันตัวตน',
            variant: 'default' 
          });
        }
      }
    } catch (err) {
      console.error('Fetch profile error:', err);
      toast({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถดึงข้อมูลได้', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleMusicianFileChange = (field: keyof typeof musicianFiles, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.type === 'file' && e.target.files && e.target.files[0]) {
      setMusicianFiles({ ...musicianFiles, [field]: e.target.files[0] });
    } else if (e.target.type === 'text') {
      setMusicianFiles({ ...musicianFiles, [field]: e.target.value });
    }
  };

  const handleVenueFileChange = (field: keyof typeof venueFiles, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.type === 'file' && e.target.files && e.target.files[0]) {
      setVenueFiles({ ...venueFiles, [field]: e.target.files[0] });
    } else if (e.target.type === 'text') {
      setVenueFiles({ ...venueFiles, [field]: e.target.value });
    }
  };

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const { error } = await supabase.storage
      .from('verification-docs')
      .upload(path, file, { contentType: file.type });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage
      .from('verification-docs')
      .getPublicUrl(path);
    return publicUrl;
  };

  const submitMusicianVerification = async () => {
    if (!musicianFiles.fullName || !musicianFiles.idCardPhoto || !musicianFiles.selfieWithId) {
      toast({ title: 'กรุณากรอกข้อมูลให้ครบถ้วน', variant: 'destructive' });
      return;
    }
    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: 'Not logged in', variant: 'destructive' });
      setUploading(false);
      return;
    }

    try {
      const idCardUrl = await uploadFile(musicianFiles.idCardPhoto!, `id-card-${user.id}-${Date.now()}`);
      const selfieUrl = await uploadFile(musicianFiles.selfieWithId!, `selfie-id-${user.id}-${Date.now()}`);

      const { error } = await supabase
        .from('profiles')
        .update({
          verification_status: 'pending',
          verification_docs: {
            full_name: musicianFiles.fullName,
            id_card_photo: idCardUrl,
            selfie_with_id: selfieUrl,
            portfolio_link: musicianFiles.portfolioLink,
          },
        })
        .eq('id', user.id);
      if (error) throw error;

      toast({ title: 'ส่งคำขอยืนยันตัวตนแล้ว!' });
      navigate('/profile');
    } catch (err: any) {
      toast({ title: 'อัปโหลดล้มเหลว', description: err.message, variant: 'destructive' });
    }
    setUploading(false);
  };

  const submitVenueVerification = async () => {
    if (!venueFiles.businessLicense || !venueFiles.utilityBill || !venueFiles.selfieWithShopSign || !venueFiles.ownerSelfieWithId || !venueFiles.officialPhone) {
      toast({ title: 'กรุณากรอกข้อมูลให้ครบถ้วน', variant: 'destructive' });
      return;
    }
    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: 'Not logged in', variant: 'destructive' });
      setUploading(false);
      return;
    }

    try {
      const licenseUrl = await uploadFile(venueFiles.businessLicense!, `license-${user.id}-${Date.now()}`);
      const utilityUrl = await uploadFile(venueFiles.utilityBill!, `utility-${user.id}-${Date.now()}`);
      const selfieShopUrl = await uploadFile(venueFiles.selfieWithShopSign!, `selfie-shop-${user.id}-${Date.now()}`);
      const ownerSelfieUrl = await uploadFile(venueFiles.ownerSelfieWithId!, `owner-selfie-${user.id}-${Date.now()}`);

      const { error } = await supabase
        .from('profiles')
        .update({
          verification_status: 'pending',
          verification_docs: {
            business_license: licenseUrl,
            utility_bill: utilityUrl,
            selfie_with_shop_sign: selfieShopUrl,
            owner_selfie_with_id: ownerSelfieUrl,
            official_phone: venueFiles.officialPhone,
            social_media_link: venueFiles.socialMediaLink,
          },
        })
        .eq('id', user.id);
      if (error) throw error;

      toast({ title: 'ส่งคำขอยืนยันตัวตนแล้ว!' });
      navigate('/profile');
    } catch (err: any) {
      toast({ title: 'อัปโหลดล้มเหลว', description: err.message, variant: 'destructive' });
    }
    setUploading(false);
  };

  if (profile?.is_verified) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">ยืนยันตัวตนแล้ว</h2>
              <p className="text-gray-500">บัญชีของคุณได้รับการยืนยันแล้ว</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">คำขอยืนยันตัวตน</h1>
        </div>

        {userRole === 'musician' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                ยืนยันตัวตน (นักดนตรี)
              </CardTitle>
              <p className="text-sm text-gray-500">กรุณาอัปโหลดเอกสารเพื่อยืนยันตัวตน</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="ชื่อ-นามสกุล"
                  value={musicianFiles.fullName}
                  onChange={(e) => handleMusicianFileChange('fullName', e)}
                />
                <p className="text-xs text-gray-500 mt-1">ต้องตรงกับหน้าบัตรประชาชน</p>
              </div>

              <div>
                <Label htmlFor="idCardPhoto">ID Card Photo</Label>
                <Input
                  id="idCardPhoto"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleMusicianFileChange('idCardPhoto', e)}
                />
                <p className="text-xs text-gray-500 mt-1">กรุณาถ่ายให้เห็นตัวเลขบนบัตรและข้อมูลให้ชัดเจน</p>
              </div>

              <div>
                <Label htmlFor="selfieWithId">Selfie with ID</Label>
                <Input
                  id="selfieWithId"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleMusicianFileChange('selfieWithId', e)}
                />
                <p className="text-xs text-gray-500 mt-1">กรุณาถือบัตรใกล้ใบหน้า ถ่ายในที่สว่าง ให้เห็นทั้งหน้าและบัตรชัดเจน</p>
              </div>

              <div>
                <Label htmlFor="portfolioLink">Portfolio Link</Label>
                <Input
                  id="portfolioLink"
                  placeholder="https://youtube.com/..."
                  value={musicianFiles.portfolioLink}
                  onChange={(e) => handleMusicianFileChange('portfolioLink', e)}
                />
                <p className="text-xs text-gray-500 mt-1">ลิงก์ผลงาน (YouTube/TikTok/Social Media)</p>
              </div>

              <Button onClick={submitMusicianVerification} disabled={uploading} className="w-full">
                {uploading ? 'กำลังส่ง...' : 'ส่งคำขอยืนยันตัวตน'}
              </Button>
            </CardContent>
          </Card>
        )}

        {userRole === 'venue' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5" />
                ยืนยันตัวตน (ร้านค้า)
              </CardTitle>
              <p className="text-sm text-gray-500">กรุณาอัปโหลดเอกสารเพื่อยืนยันสถานประกอบการ</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="businessLicense">Business License</Label>
                <Input
                  id="businessLicense"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleVenueFileChange('businessLicense', e)}
                />
                <p className="text-xs text-gray-500 mt-1">ใช้ไฟล์สแกนหรือรูปถ่ายที่เห็นรายละเอียดครบถ้วน</p>
              </div>

              <div>
                <Label htmlFor="utilityBill">Utility Bill</Label>
                <Input
                  id="utilityBill"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleVenueFileChange('utilityBill', e)}
                />
                <p className="text-xs text-gray-500 mt-1">ย้อนหลังไม่เกิน 3 เดือน และต้องเห็นที่อยู่ร้านชัดเจน</p>
              </div>

              <div>
                <Label htmlFor="selfieWithShopSign">Selfie with Shop Sign</Label>
                <Input
                  id="selfieWithShopSign"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleVenueFileChange('selfieWithShopSign', e)}
                />
                <p className="text-xs text-gray-500 mt-1">ถ่ายให้เห็นตัวคุณคู่กับป้ายชื่อร้านหรือบรรยากาศภายในร้าน</p>
              </div>

              <div>
                <Label htmlFor="ownerSelfieWithId">Owner Selfie with ID</Label>
                <Input
                  id="ownerSelfieWithId"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleVenueFileChange('ownerSelfieWithId', e)}
                />
                <p className="text-xs text-gray-500 mt-1">เพื่อยืนยันความเป็นเจ้าของสถานประกอบการ</p>
              </div>

              <div>
                <Label htmlFor="officialPhone">Official Phone</Label>
                <Input
                  id="officialPhone"
                  placeholder="เบอร์โทรศัพท์"
                  value={venueFiles.officialPhone}
                  onChange={(e) => handleVenueFileChange('officialPhone', e)}
                />
                <p className="text-xs text-gray-500 mt-1">เบอร์โทรศัพท์ทางการของร้าน</p>
              </div>

              <div>
                <Label htmlFor="socialMediaLink">Social Media Link</Label>
                <Input
                  id="socialMediaLink"
                  placeholder="https://facebook.com/..."
                  value={venueFiles.socialMediaLink}
                  onChange={(e) => handleVenueFileChange('socialMediaLink', e)}
                />
                <p className="text-xs text-gray-500 mt-1">ลิงก์ Official Page ของร้าน</p>
              </div>

              <Button onClick={submitVenueVerification} disabled={uploading} className="w-full">
                {uploading ? 'กำลังส่ง...' : 'ส่งคำขอยืนยันตัวตน'}
              </Button>
            </CardContent>
          </Card>
        )}

        {!userRole && (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">ยังไม่ได้เลือก Role</h2>
              <p className="text-gray-500 mb-4">กรุณาเลือก Role ก่อนยืนยันตัวตน</p>
              <div className="space-y-2">
                <Button 
                  onClick={() => navigate('/profile')} 
                  className="w-full"
                  variant="outline"
                >
                  ไปที่หน้า Profile เพื่อเลือก Role
                </Button>
                <Button 
                  onClick={() => window.history.back()} 
                  className="w-full"
                  variant="ghost"
                >
                  กลับ
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default VerificationRequest;
