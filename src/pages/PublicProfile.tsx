import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Phone, MessageCircle, MapPin, Facebook, Music, Users, Star, Heart, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { INSTRUMENTS, getInstrumentLabel } from '@/constants/instruments';

interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  line_id: string | null;
  facebook_url: string | null;
  avatar_url: string | null;
  credits: number;
  instruments?: string[] | null;
  province?: string | null;
}

interface Job {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  rate: string;
  status: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  reviewer_name: string;
  reviewer_avatar: string | null;
  created_at: string;
}

const PublicProfile = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  // ดึงข้อมูลโปรไฟล์
  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) return;

      try {
        console.log("Fetching public profile for user:", id);
        
        const { data, error } = await (supabase as any)
          .from("profiles")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
          
          // ตรวจสอบว่าเป็นข้อผิดพลาดเกี่ยวกับคอลัมน์ facebook_url หรือไม่
          if (error.message && error.message.includes('facebook_url')) {
            toast({ 
              title: "ต้องอัปเดตฐานข้อมูล", 
              description: "กรุณารัน SQL migration เพื่อเพิ่มคอลัมน์ facebook_url ในตาราง profiles", 
              variant: "destructive" 
            });
          } else {
            toast({ title: "เกิดข้อผิดพลาด", description: "ไม่พบโปรไฟล์นี้", variant: "destructive" });
          }
        } else if (data) {
          console.log("Public profile data loaded:", data);
          console.log("Facebook URL from DB:", data.facebook_url);
          
          setProfile(data);
          
          // ดึงข้อมูลงาน
          const { data: jobsData, error: jobsError } = await (supabase as any)
            .from("jobs")
            .select("*")
            .eq("user_id", id)
            .order("date", { ascending: true });

          if (!jobsError && jobsData) {
            setJobs(jobsData);
          }

          // ดึงข้อมูลรีวิว
          const { data: reviewsData, error: reviewsError } = await (supabase as any)
            .from("reviews")
            .select(`
              *,
              reviewer_profiles (
                full_name,
                avatar_url
              )
            `)
            .eq('reviewee_id', id)
            .order('created_at', { ascending: false })
            .limit(10);

          if (!reviewsError && reviewsData) {
            setReviews(reviewsData);
          }
        }
      } catch (err) {
        console.error("Error:", err);
        toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถโหลดข้อมูลได้", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  const handleShareProfile = () => {
    const profileUrl = `${window.location.origin}/profile/${id}`;
    if (navigator.share) {
      navigator.share({
        title: `${profile?.full_name || 'โปรไฟล์'} - หาคนแทน`,
        text: `ดูโปรไฟล์ของ ${profile?.full_name || 'นักดนตรีคนนี้'} ในแอปพลิเคชัน หาคนแทน`,
        url: profileUrl,
      });
    } else {
      navigator.clipboard.writeText(profileUrl);
      toast({ title: "คัดลอกลิงก์", description: "ลิงก์โปรไฟล์ถูกคัดลอกแล้ว" });
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">ไม่พบโปรไฟล์</h2>
              <Button onClick={handleBack} className="bg-orange-500 hover:bg-orange-600">
                <ArrowLeft className="w-4 h-4 mr-2" />
                กลับ
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const instrumentsArray = Array.isArray(profile.instruments) 
    ? profile.instruments 
    : (profile.instruments && typeof profile.instruments === 'string' ? (profile.instruments as string).split(',').map((i: string) => i.trim()) : []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            onClick={handleBack}
            className="text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            กลับ
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleShareProfile}
            className="text-orange-500 border-orange-500 hover:bg-orange-50"
          >
            <Share2 className="w-4 h-4 mr-2" />
            แชร์โปรไฟล์
          </Button>
        </div>

        {/* Profile Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Avatar */}
              <div className="flex flex-col items-center">
                <Avatar className="w-32 h-32 border-4 border-orange-200">
                  <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name || "Profile"} />
                  <AvatarFallback className="bg-orange-100 text-orange-600 text-4xl font-bold">
                    {profile.full_name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Info */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  {profile.full_name || "ไม่ระบุชื่อ"}
                </h1>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Facebook URL - Public View */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Facebook className="w-4 h-4" />
                      Facebook Profile
                    </div>
                    {profile.facebook_url && profile.facebook_url.trim() !== '' ? (
                      <a
                        href={profile.facebook_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 underline rounded-lg h-12 px-4 border border-input bg-background"
                      >
                        <Facebook className="w-4 h-4" />
                        {profile.facebook_url.replace('https://www.facebook.com/', '').replace('https://facebook.com/', '')}
                      </a>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground rounded-lg h-12 px-4 border border-input bg-gray-50">
                        <Facebook className="w-4 h-4" />
                        ไม่ระบุ
                      </div>
                    )}
                  </div>

                  {/* Line ID - Public View */}
                  {profile.line_id && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <MessageCircle className="w-4 h-4" />
                        Line ID
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 rounded-lg h-12 px-4 border border-input bg-gray-50">
                        <MessageCircle className="w-4 h-4" />
                        {profile.line_id}
                      </div>
                    </div>
                  )}
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.phone && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Phone className="w-4 h-4" />
                        เบอร์โทรศัพท์
                      </div>
                      <div className="text-gray-600">{profile.phone}</div>
                    </div>
                  )}
                  
                  {profile.province && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <MapPin className="w-4 h-4" />
                        จังหวัด
                      </div>
                      <div className="text-gray-600">{profile.province}</div>
                    </div>
                  )}
                </div>

                {/* Instruments */}
                {instrumentsArray.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Music className="w-4 h-4" />
                      เครื่องดนตรี
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {instrumentsArray.map((instrument) => (
                        <Badge key={instrument} variant="secondary" className="bg-orange-100 text-orange-800">
                          {getInstrumentLabel(instrument)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Jobs Section */}
        {jobs.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-500" />
                งานที่ประกาศ ({jobs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {jobs.map((job) => (
                  <div key={job.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-800">{job.title}</h3>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        {job.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {job.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {job.rate}
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        {job.date}
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {job.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reviews Section */}
        {reviews.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                รีวิว ({reviews.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border rounded-lg p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={review.reviewer_avatar || undefined} alt={review.reviewer_name} />
                        <AvatarFallback className="bg-orange-100 text-orange-600">
                          {review.reviewer_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-gray-800">{review.reviewer_name}</div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(review.created_at).toLocaleDateString('th-TH')}
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PublicProfile;
