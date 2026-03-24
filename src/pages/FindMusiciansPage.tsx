import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, MapPin, Music, Users, Calendar, Clock, Filter, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { INSTRUMENTS } from '@/constants/instruments';
import { ProvinceSelect } from '@/components/ProvinceSelect';

interface FindMusiciansPageProps {
  onBack: () => void;
}

const FindMusiciansPage = ({ onBack }: FindMusiciansPageProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [searchData, setSearchData] = useState({
    instrument: "",
    location: "",
    province: "",
    date: "",
    time: "",
    duration: ""
  });
  
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setSearchData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearch = async () => {
    if (!searchData.instrument.trim()) {
      toast({
        title: "กรุณาระบุเครื่องดนตรี",
        description: "เลือกเครื่องดนตรีที่ต้องการหาคนแทน",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    
    try {
      // ค้นหาโปรไฟล์นักดนตรีที่ตรงกับเงื่อนไข
      let query = supabase
        .from('profiles')
        .select(`
          *,
          jobs (
            id,
            instrument,
            location,
            province,
            date,
            time,
            status
          )
        `)
        .eq('is_musician', true);

      // กรองตามเครื่องดนตรี
      if (searchData.instrument) {
        query = query.contains('instruments', [searchData.instrument]);
      }

      // กรองตามจังหวัด
      if (searchData.province) {
        query = query.eq('province', searchData.province);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Search error:', error);
        toast({
          title: "ค้นหาไม่สำเร็จ",
          description: "กรุณาลองใหม่อีกครั้ง",
          variant: "destructive"
        });
      } else {
        setSearchResults(data || []);
        setShowResults(true);
        
        if (data && data.length > 0) {
          toast({
            title: "พบนักดนตรี",
            description: `พบ ${data.length} คนที่ตรงเงื่อนไข`
          });
        } else {
          toast({
            title: "ไม่พบนักดนตรี",
            description: "ลองปรับเงื่อนไขการค้นหาดู"
          });
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "กรุณาลองใหม่อีกครั้ง",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleContactMusician = (musician: any) => {
    // สร้างข้อมูลสำหรับติดต่อนักดนตรี
    const contactData = {
      musicianId: musician.id,
      musicianName: musician.full_name,
      instrument: searchData.instrument,
      location: searchData.location,
      date: searchData.date,
      time: searchData.time,
      duration: searchData.duration
    };

    // นำทางไปหน้าติดต่อหรือแสดงข้อมูลติดต่อ
    navigate(`/profile/${musician.id}`, { state: { jobRequest: contactData } });
  };

  const resetSearch = () => {
    setSearchData({
      instrument: "",
      location: "",
      province: "",
      date: "",
      time: "",
      duration: ""
    });
    setSearchResults([]);
    setShowResults(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button onClick={onBack} variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            ย้อนกลับ
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">หาคนแทนด่วน</h1>
            <p className="text-gray-600">ค้นหานักดนตรีมืออาชีพสำหรับงานของคุณ</p>
          </div>
        </div>

        {/* Search Form */}
        {!showResults ? (
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5 text-orange-500" />
                กรอกรายละเอียดเพื่อหานักดนตรี
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* เครื่องดนตรี */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เครื่องดนตรีที่ต้องการ <span className="text-red-500">*</span>
                </label>
                <select
                  value={searchData.instrument}
                  onChange={(e) => handleInputChange('instrument', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">เลือกเครื่องดนตรี</option>
                  {INSTRUMENTS.map((instrument) => (
                    <option key={instrument.value} value={instrument.value}>
                      {instrument.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* สถานที่ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  สถานที่
                </label>
                <Input
                  placeholder="เช่น ผับแกรนด์, โรงแรมฮิลตัน"
                  value={searchData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                />
              </div>

              {/* จังหวัด */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  จังหวัด
                </label>
                <ProvinceSelect
                  value={searchData.province}
                  onChange={(value) => handleInputChange('province', value)}
                  placeholder="เลือกจังหวัด"
                />
              </div>

              {/* วันและเวลา */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    วันที่
                  </label>
                  <Input
                    type="date"
                    value={searchData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    เวลา
                  </label>
                  <Input
                    type="time"
                    value={searchData.time}
                    onChange={(e) => handleInputChange('time', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ระยะเวลา
                  </label>
                  <Input
                    placeholder="เช่น 3 ชั่วโมง"
                    value={searchData.duration}
                    onChange={(e) => handleInputChange('duration', e.target.value)}
                  />
                </div>
              </div>

              {/* ปุ่มค้นหา */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSearch}
                  disabled={isSearching || !searchData.instrument.trim()}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {isSearching ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      กำลังค้นหา...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      ค้นหานักดนตรี
                    </>
                  )}
                </Button>
                <Button
                  onClick={resetSearch}
                  variant="outline"
                  className="px-6"
                >
                  ล้าง
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Search Results */
          <div className="space-y-4">
            {/* Results Header */}
            <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  ผลการค้นหา ({searchResults.length} คน)
                </h2>
                <p className="text-sm text-gray-600">
                  เครื่องดนตรี: {searchData.instrument}
                  {searchData.province && ` • จังหวัด: ${searchData.province}`}
                </p>
              </div>
              <Button onClick={resetSearch} variant="outline" size="sm">
                <X className="w-4 h-4 mr-2" />
                ค้นหาใหม่
              </Button>
            </div>

            {/* Results List */}
            {searchResults.length === 0 ? (
              <Card className="bg-white">
                <CardContent className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    ไม่พบนักดนตรีที่ตรงเงื่อนไข
                  </h3>
                  <p className="text-gray-600 mb-4">
                    ลองปรับเงื่อนไขการค้นหาหรือลองใหม่ในภายหลัง
                  </p>
                  <Button onClick={resetSearch} variant="outline">
                    ค้นหาใหม่
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {searchResults.map((musician) => (
                  <Card key={musician.id} className="bg-white hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={musician.avatar_url} />
                          <AvatarFallback className="bg-orange-100 text-orange-600 text-lg font-semibold">
                            {musician.full_name?.charAt(0)?.toUpperCase() || 'M'}
                          </AvatarFallback>
                        </Avatar>

                        {/* Info */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {musician.full_name}
                              </h3>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {musician.instruments?.map((instrument: string) => (
                                  <Badge key={instrument} variant="secondary" className="text-xs">
                                    {instrument}
                                  </Badge>
                                ))}
                              </div>
                              {musician.location && (
                                <p className="text-sm text-gray-600 mt-2 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {musician.location}
                                  {musician.province && `, ${musician.province}`}
                                </p>
                              )}
                            </div>
                            
                            <Button
                              onClick={() => handleContactMusician(musician)}
                              className="bg-green-500 hover:bg-green-600 text-white"
                            >
                              ติดต่อ
                            </Button>
                          </div>

                          {/* Additional Info */}
                          {musician.bio && (
                            <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                              {musician.bio}
                            </p>
                          )}

                          {/* Experience */}
                          {musician.experience && (
                            <div className="flex items-center gap-2 mt-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                ประสบการณ์ {musician.experience}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FindMusiciansPage;
