import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Camera, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import QRScanner from '@/components/QRScanner';

interface MusicianProfile {
  id: string;
  full_name: string;
  avatar_url?: string;
  tip_qr_url?: string;
  bank_account?: string;
}

const CustomerPortal = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [currentProfile, setCurrentProfile] = useState<any>(null);
  const [selectedMusician, setSelectedMusician] = useState<MusicianProfile | null>(null);
  const [showQRScannerModal, setShowQRScannerModal] = useState(false);
  const [songName, setSongName] = useState('');
  const [tipAmount, setTipAmount] = useState('');
  const [songList, setSongList] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  
  useEffect(() => {
    fetchUserProfile();
    
    // Check if musician is selected from URL
    const musicianId = searchParams.get('musician');
    if (musicianId) {
      fetchMusicianProfile(musicianId);
    }
    
    // Parse song list from URL
    const songsParam = searchParams.get('songs');
    if (songsParam) {
      const decodedSongs = decodeURIComponent(songsParam);
      const songs = decodedSongs.split('\n').filter(song => song.trim());
      setSongList(songs);
    }
  }, [searchParams]);

  // Cleanup QR Scanner modal when component unmounts
  useEffect(() => {
    return () => {
      if (showQRScannerModal) {
        setShowQRScannerModal(false);
      }
    };
  }, [showQRScannerModal]);

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

  const fetchMusicianProfile = async (musicianId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, tip_qr_url, bank_account')
        .eq('id', musicianId)
        .single();

      if (error) {
        console.error('Error fetching musician:', error);
        toast({
          title: 'Musician not found',
          description: 'Unable to find the musician for this QR code',
          variant: 'destructive'
        });
        return;
      }

      console.log('Musician data fetched:', data);
      console.log('tip_qr_url:', data.tip_qr_url);
      setSelectedMusician(data);
      toast({
        title: 'Musician selected',
        description: `Now requesting songs for ${data.full_name}`
      });
      
      // Auto-scroll to song request form
      setTimeout(() => {
        const songRequestSection = document.getElementById('song-request-section');
        if (songRequestSection) {
          songRequestSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load musician profile',
        variant: 'destructive'
      });
    }
  };

  const handleQRScanSuccess = (musicianId: string) => {
    console.log('QR scan success, closing modal...');
    fetchMusicianProfile(musicianId);
    setShowQRScannerModal(false);
  };

  const handleSongRequest = async () => {
    if (!selectedMusician) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'กรุณาเลือกนักดนตรี',
        variant: 'destructive'
      });
      return;
    }

    if (!songName.trim()) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'กรุณากรอกชื่อเพลง',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Try to find existing gig first
      let gigId = null;
      const { data: gigData, error: gigError } = await supabase
        .from('gigs')
        .select('id')
        .eq('musician_id', selectedMusician.id)
        .limit(1)
        .single();

      console.log('Gig search result:', { gigData, gigError });

      if (gigData && !gigError) {
        gigId = gigData.id;
        console.log('Found existing gig:', gigId);
      } else {
        console.log('No existing gig found, trying to create one...');
        
        // Try to create a simple gig with minimal required fields
        try {
          const { data: newGig, error: createGigError } = await supabase
            .from('gigs')
            .insert({
              musician_id: selectedMusician.id,
              title: 'Live Performance',
              description: 'Live performance with song requests',
              location: 'Online',
              start_time: new Date().toISOString(),
              end_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
              status: 'active'
            })
            .select('id')
            .single();

          console.log('Gig creation result:', { newGig, createGigError });

          if (createGigError) {
            console.error('Detailed gig creation error:', createGigError);
            throw new Error(`ไม่สามารถสร้างกิจกรรมได้: ${createGigError.message}`);
          }

          gigId = newGig.id;
          console.log('Created new gig:', gigId);
        } catch (createError) {
          console.error('Failed to create gig:', createError);
          
          // If gig creation fails, try to insert song request without gig_id
          // This requires modifying the database schema to make gig_id optional
          console.log('Attempting to insert song request without gig_id...');
          
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('song_requests')
            .insert({
              musician_id: selectedMusician.id,
              customer_id: currentProfile?.id || null,
              song_name: songName.trim(),
              tip_amount: parseFloat(tipAmount) || 0,
              payment_status: 'pending'
            })
            .select()
            .single();

          if (fallbackError) {
            console.error('Fallback song request error:', fallbackError);
            throw new Error(`ไม่สามารถส่งคำขอเพลงได้: ${fallbackError.message}`);
          }

          toast({
            title: 'ส่งคำขอเพลงสำเร็จ',
            description: `ส่งคำขอเพลง "${songName}" ให้ ${selectedMusician.full_name} แล้ว`
          });

          // Change to step 2
          setCurrentStep(2);
          setIsSubmitting(false);
          return;
        }
      }

      // Insert song request with gig_id
      const { data, error } = await supabase
        .from('song_requests')
        .insert({
          gig_id: gigId,
          musician_id: selectedMusician.id,
          customer_id: currentProfile?.id || null,
          song_name: songName.trim(),
          tip_amount: parseFloat(tipAmount) || 0,
          payment_status: 'pending'
        })
        .select()
        .single();

      console.log('Song request result:', { data, error });

      if (error) {
        console.error('Song request error:', error);
        throw new Error(`ไม่สามารถส่งคำขอเพลงได้: ${error.message}`);
      }

      toast({
        title: 'ส่งคำขอเพลงสำเร็จ',
        description: `ส่งคำขอเพลง "${songName}" ให้ ${selectedMusician.full_name} แล้ว`
      });

      // Change to step 2
      setCurrentStep(2);
      setSongName('');
      setTipAmount('');

    } catch (error) {
      console.error('Complete error in handleSongRequest:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message || 'ไม่สามารถส่งคำขอเพลงได้',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-bold">พอร์ทัลลูกค้า</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                ยอด: {currentProfile?.full_name || 'Guest'}
              </span>
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <QrCode className="w-4 h-4 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Selected Musician Display */}
        {selectedMusician && (
          <div className="mb-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  
                </div>
                <div>
                  <h3 className="font-medium text-purple-900">
                    88: {selectedMusician.full_name}
                  </h3>
                  <p className="text-sm text-purple-700">
                    88
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedMusician(null)}
                className="border-purple-300 text-purple-700 hover:bg-purple-100"
              >
                88
              </Button>
            </div>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            รับชมการแสดงสดและสนับสนุนนักดนตรี
          </h2>
          <p className="text-gray-600">
            จองโต๊ะล่วงหน้า ขอเพลงเพลงโปรด และให้ทิปสนับสนุนความสามารถของนักดนตรี
          </p>
        </div>

        {/* QR Scanner Button */}
        {!selectedMusician && (
          <div className="mb-8">
            <Card className="border-2 border-dashed border-purple-300 bg-purple-50">
              <CardContent className="p-8 text-center">
                <QrCode className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-purple-900 mb-2">
                  สแกน QR Code เพื่อเลือกนักดนตรี
                </h3>
                <p className="text-purple-700 mb-4">
                  สแกน QR Code ของนักดนตรีที่คุณต้องการสนับสนุน
                </p>
                <Button
                  onClick={() => setShowQRScannerModal(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  สแกน QR Code
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Song Request Form */}
        {selectedMusician && (
          <div id="song-request-section" className="mb-8">
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader>
                <CardTitle className="text-purple-900">
                  ขอเพลงให้ {selectedMusician.full_name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Step 1: Request Song */}
                {currentStep === 1 && (
                  <div>
                    <label className="block text-sm font-medium text-purple-900 mb-2">
                      ชื่อเพลง
                    </label>
                    <input
                      type="text"
                      value={songName}
                      onChange={(e) => setSongName(e.target.value)}
                      className="w-full px-3 py-2 border border-purple-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="กรอกชื่อเพลงที่ต้องการขอ"
                    />
                  </div>
                )}
                {/* Step 2: Support Musician */}
                {currentStep === 2 && (
                  <>
                    <div className="text-center py-4">
                      <div className="text-6xl mb-4">🎵</div>
                      <h3 className="text-xl font-semibold text-purple-900 mb-2">
                        ขอบคุณสำหรับคำขอเพลง!
                      </h3>
                      <p className="text-purple-700 mb-6">
                        คำขอเพลง "{songName}" ของคุณได้ถูกส่งให้ {selectedMusician.full_name} เรียบร้อยแล้ว
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-purple-900 mb-2">
                        จำนวนทิป (บาท)
                      </label>
                      <input
                        type="number"
                        value={tipAmount}
                        onChange={(e) => setTipAmount(e.target.value)}
                        className="w-full px-3 py-2 border border-purple-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="0"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    
                    {/* QR Code Display */}
                    {(() => {
                      console.log('Checking QR display - selectedMusician:', selectedMusician);
                      console.log('tip_qr_url exists:', !!selectedMusician?.tip_qr_url);
                      console.log('tip_qr_url value:', selectedMusician?.tip_qr_url);
                      return selectedMusician?.tip_qr_url;
                    })() && (
                      <div className="text-center">
                        <p className="text-sm font-medium text-purple-900 mb-2">
                          สแกน QR Code สำหรับให้ทิป
                        </p>
                        <div className="inline-block bg-white p-4 rounded-lg border-2 border-purple-200 shadow-sm">
                          <img 
                            src={selectedMusician.tip_qr_url} 
                            alt="QR Code สำหรับให้ทิป" 
                            className="w-32 h-32 object-contain"
                            onLoad={() => console.log('QR Code image loaded successfully')}
                            onError={(e) => console.error('QR Code image failed to load:', e)}
                          />
                        </div>
                        <p className="text-xs text-purple-600 mt-2">
                          สแกนเพื่อให้ทิปสนับสนุนนักดนตรี
                        </p>
                      </div>
                    )}
                    
                    <Button
                      onClick={() => {
                        setCurrentStep(1);
                        setSongName('');
                        setTipAmount('');
                      }}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      กลับไปขอเพลงเพิ่ม
                    </Button>
                  </>
                )}
                
                {/* Step 1 Submit Button */}
                {currentStep === 1 && (
                  <Button
                    onClick={handleSongRequest}
                    disabled={isSubmitting}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {isSubmitting ? 'กำลังส่ง...' : 'ส่งคำขอเพลง'}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Song List Suggestions */}
        {selectedMusician && songList.length > 0 && (
          <div className="mb-8">
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-orange-900">
                  เพลงที่แนะนำโดยนักดนตรี
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {songList.map((song, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      onClick={() => setSongName(song)}
                      className="border-orange-300 text-orange-700 hover:bg-orange-100 text-left justify-start"
                    >
                      {song}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* QR Scanner Modal */}
        {showQRScannerModal && (
          <QRScanner
            onScanSuccess={handleQRScanSuccess}
            onClose={() => setShowQRScannerModal(false)}
          />
        )}
      </div>
    </div>
  );
};

export default CustomerPortal;
