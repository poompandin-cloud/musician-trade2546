import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { ArrowLeft, Camera, Upload, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const MusicianScanPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [scanning, setScanning] = useState(false);
  const [gig, setGig] = useState<any>(null);
  const [showPriceConfirm, setShowPriceConfirm] = useState(false);
  const [proofImageFile, setProofImageFile] = useState<File | null>(null);
  const [proofImagePreview, setProofImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  // Load active gig from localStorage on mount
  useEffect(() => {
    const savedGigId = localStorage.getItem('active_gig_id');
    const savedGigData = localStorage.getItem('active_gig_data');
    
    if (savedGigId && savedGigData) {
      try {
        const gigData = JSON.parse(savedGigData);
        console.log('Restored gig from localStorage:', gigData);
        setGig(gigData);
        
        // If gig is in_progress, restore the proof image state
        if (gigData.status === 'in_progress' && gigData.proof_image_file) {
          // Restore proof image from localStorage if exists
          const savedProofData = localStorage.getItem('active_gig_proof');
          if (savedProofData) {
            const proofData = JSON.parse(savedProofData);
            setProofImagePreview(proofData.preview);
          }
        }
      } catch (error) {
        console.error('Error parsing saved gig data:', error);
        localStorage.removeItem('active_gig_id');
        localStorage.removeItem('active_gig_data');
      }
    }
  }, []);

  // Save gig to localStorage when it changes
  useEffect(() => {
    if (gig) {
      localStorage.setItem('active_gig_id', gig.id);
      localStorage.setItem('active_gig_data', JSON.stringify(gig));
      console.log('Saved gig to localStorage:', gig);
    }
  }, [gig]);

  useEffect(() => {
    if (scanning) {
      startScanner();
    } else {
      stopScanner();
    }
    return () => stopScanner();
  }, [scanning]);

  const startScanner = async () => {
    try {
      html5QrCodeRef.current = new Html5Qrcode('reader');
      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          onScanSuccess(decodedText);
        },
        () => {}
      );
    } catch (err) {
      console.error('Unable to start scanning', err);
      toast({ title: 'Failed to start camera', description: 'Please allow camera access', variant: 'destructive' });
      setScanning(false);
    }
  };

  const stopScanner = () => {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current.stop().catch(() => {});
      html5QrCodeRef.current = null;
    }
  };

  const onScanSuccess = async (decodedText: string) => {
    setScanning(false);
    console.log('=== DEBUGGING MusicianScanPage QR Scan ===');
    console.log('Scanned QR code:', decodedText);
    
    // Fetch gig details
    const { data, error } = await supabase
      .from('gigs')
      .select('*')
      .eq('id', decodedText)
      .single();
    
    console.log('Gig query result:', { data, error });
    
    if (error) {
      console.error('Gig fetch error:', error);
      if (error.message?.includes('PGRST208') || error.message?.includes('foreign key')) {
        toast({ 
          title: 'Database relation error', 
          description: 'Could not fetch gig details. Please contact support.', 
          variant: 'destructive' 
        });
      } else {
        toast({ title: 'Invalid gig QR', variant: 'destructive' });
      }
      return;
    }
    
    if (!data) {
      console.error('No gig found with ID:', decodedText);
      toast({ title: 'Gig not found', variant: 'destructive' });
      return;
    }
    
    console.log('Gig loaded successfully:', data);
    setGig(data);
    toast({ title: 'Gig loaded!', description: data.title || data.instrument });
  };

  const startGig = async () => {
    if (!gig) return;
    const { error } = await supabase
      .from('gigs')
      .update({ status: 'in_progress' })
      .eq('id', gig.id);
    if (error) {
      toast({ title: 'Failed to start gig', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Gig started!' });
      setGig({ ...gig, status: 'in_progress' });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProofImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const preview = event.target.result as string;
          setProofImagePreview(preview);
          
          // Save proof image data to localStorage
          const proofData = {
            file: file.name,
            size: file.size,
            type: file.type,
            preview: preview,
            timestamp: Date.now()
          };
          localStorage.setItem('active_gig_proof', JSON.stringify(proofData));
          console.log('Saved proof image to localStorage:', proofData);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const compressImage = async (file: File, maxWidth: number = 1280, maxHeight: number = 1280, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          }
        }, file.type, quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const uploadProof = async () => {
    if (!proofImageFile || !gig) return;
    
    setUploading(true);
    
    try {
      // Compress image first
      console.log('Compressing image before upload...');
      const compressedFile = await compressImage(proofImageFile);
      console.log('Original size:', proofImageFile.size, 'Compressed size:', compressedFile.size);
      
      // Check compressed file size (1MB limit)
      if (compressedFile.size > 1024 * 1024) {
        toast({ 
          title: 'File too large after compression', 
          description: 'Compressed image is still too large. Please try a smaller image.', 
          variant: 'destructive' 
        });
        setUploading(false);
        return;
      }
      
      const fileName = `gig-${gig.id}-${Date.now()}.${compressedFile.type.split('/')[1]}`;
      const { error } = await supabase.storage
        .from('gig-proofs')
        .upload(fileName, compressedFile, { contentType: compressedFile.type });
      
      if (error) {
        toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
        setUploading(false);
        return;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('gig-proofs')
        .getPublicUrl(fileName);
      
      // Update gig with proof image URL and change status
      const { error: updateError } = await supabase
        .from('gigs')
        .update({ 
          performance_proof_url: publicUrl,
          status: 'awaiting_approval'
        })
        .eq('id', gig.id);
      
      if (updateError) {
        toast({ title: 'Failed to save proof', description: updateError.message, variant: 'destructive' });
      } else {
        toast({ 
          title: 'Proof uploaded successfully!', 
          description: 'Your performance proof has been submitted. The venue will review it shortly.',
          variant: 'default' 
        });
        
        // Clear proof image from localStorage after successful upload
        localStorage.removeItem('active_gig_proof');
        console.log('Cleared proof image from localStorage after upload');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: 'Upload failed', description: 'Failed to process image', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const uploadAndFinishGig = async () => {
    if (!proofImageFile || !gig) {
      toast({ title: 'Please select a photo first', variant: 'destructive' });
      return;
    }
    
    setFinishing(true);
    
    try {
      // Compress image first
      console.log('Compressing image before upload...');
      const compressedFile = await compressImage(proofImageFile);
      console.log('Original size:', proofImageFile.size, 'Compressed size:', compressedFile.size);
      
      // Check compressed file size (1MB limit)
      if (compressedFile.size > 1024 * 1024) {
        toast({ 
          title: 'File too large after compression', 
          description: 'Compressed image is still too large. Please try a smaller image.', 
          variant: 'destructive' 
        });
        setFinishing(false);
        return;
      }
      
      const fileName = `gig-${gig.id}-${Date.now()}.${compressedFile.type.split('/')[1]}`;
      const { error } = await supabase.storage
        .from('gig-proofs')
        .upload(fileName, compressedFile, { contentType: compressedFile.type });
      
      if (error) {
        toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
        setFinishing(false);
        return;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('gig-proofs')
        .getPublicUrl(fileName);
      
      // Update gig with proof image URL and change status to awaiting_approval
      console.log('=== DEBUGGING MusicianScanPage Update ===');
      console.log('Updating gig ID:', gig.id);
      console.log('Public URL to save:', publicUrl);
      
      const { error: updateError } = await supabase
        .from('gigs')
        .update({ 
          performance_proof_url: publicUrl,
          status: 'awaiting_approval'
        })
        .eq('id', gig.id);
      
      console.log('Update result:', { updateError });
      
      if (updateError) {
        console.error('Failed to update gig:', updateError);
        toast({ title: 'Failed to submit proof', description: updateError.message, variant: 'destructive' });
      } else {
        console.log('Successfully updated gig with performance_proof_url');
        
        // Verify the update by fetching the gig again
        const { data: verifyData, error: verifyError } = await supabase
          .from('gigs')
          .select('performance_proof_url, status')
          .eq('id', gig.id)
          .single();
        
        if (verifyError) {
          console.error('Verification error:', verifyError);
        } else {
          console.log('✅ VERIFICATION SUCCESSFUL:');
          console.log('- performance_proof_url:', verifyData.performance_proof_url);
          console.log('- status:', verifyData.status);
          console.log('- URL is not null:', verifyData.performance_proof_url !== null);
          console.log('- URL is not empty:', verifyData.performance_proof_url !== '');
        }
        toast({ 
          title: 'Proof uploaded successfully!', 
          description: 'Your performance proof has been submitted. The venue will review it shortly.',
          variant: 'default' 
        });
        
        // Clear proof image from localStorage after successful upload
        localStorage.removeItem('active_gig_proof');
        console.log('Cleared proof image from localStorage after upload');
        
        // Update local gig state
        setGig({ ...gig, performance_proof_url: publicUrl, status: 'awaiting_approval' });
        
        // Navigate to home after a short delay
        setTimeout(() => {
          navigate('/');
        }, 1500);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: 'Upload failed', description: 'Failed to process image', variant: 'destructive' });
    } finally {
      setFinishing(false);
    }
  };

  const finishGig = async () => {
    if (!gig) return;
    setFinishing(true);
    const { error } = await supabase
      .from('gigs')
      .update({ status: 'completed' })
      .eq('id', gig.id);
    if (error) {
      toast({ title: 'Failed to finish gig', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Gig completed!' });
      
      // Clear all localStorage data when gig is completed
      localStorage.removeItem('active_gig_id');
      localStorage.removeItem('active_gig_data');
      localStorage.removeItem('active_gig_proof');
      console.log('Cleared all gig data from localStorage after completion');
      
      // Navigate to home after a short delay
      setTimeout(() => {
        navigate('/');
      }, 1500);
    }
    setFinishing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Scan QR to Start Gig</h1>
        </div>

        {!gig ? (
          <Card>
            <CardContent className="p-4">
              {!scanning ? (
                <div className="text-center space-y-4">
                  <Camera className="w-16 h-16 mx-auto text-gray-400" />
                  <p className="text-gray-600">Scan a QR code to begin a gig</p>
                  <Button onClick={() => setScanning(true)} className="w-full">
                    Start Scanner
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div id="reader" className="w-full" />
                  <Button variant="outline" onClick={() => setScanning(false)} className="w-full">
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : gig.status === 'awaiting_approval' || gig.status === 'completed' ? (
          <div className="space-y-4">
            {/* Scanner for Other Gigs - TOP */}
            <Card>
              <CardContent className="p-4">
                {!scanning ? (
                  <div className="text-center space-y-4">
                    <Camera className="w-16 h-16 mx-auto text-gray-400" />
                    <p className="text-gray-600">Scan QR to work on another gig</p>
                    <Button onClick={() => setScanning(true)} className="w-full">
                      Scan Another Gig
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div id="reader" className="w-full" />
                    <Button variant="outline" onClick={() => setScanning(false)} className="w-full">
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Current Gig Details - BOTTOM */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  {gig.title || gig.instrument}
                </CardTitle>
                <p className="text-sm text-gray-500">{gig.location}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm">
                    Status: <span className="font-medium text-green-600">{gig.status}</span>
                  </p>
                  {gig.final_price && (
                    <p className="text-sm">
                      Agreed Price: <span className="font-medium">{gig.final_price} Baht</span>
                    </p>
                  )}
                  <p className="text-sm text-blue-600">
                    {gig.status === 'awaiting_approval' 
                      ? 'Your work is being reviewed by the venue. You can scan other gigs while waiting.'
                      : 'This gig has been completed and approved!'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : gig ? (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{gig.title || gig.instrument}</CardTitle>
                <p className="text-sm text-gray-500">{gig.location}</p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Status: <span className="font-medium">{gig.status}</span>
                </p>
                {gig.final_price && (
                  <p className="text-sm text-gray-600">
                    Agreed Price: <span className="font-medium">{gig.final_price} Baht</span>
                  </p>
                )}
              </CardContent>
            </Card>

            {gig.status === 'pending' && (
              <Card>
                <CardHeader>
                  <CardTitle>Start Gig</CardTitle>
                  <p className="text-sm text-gray-500">
                    Gig: <span className="font-bold">{gig.title || gig.instrument}</span><br />
                    Venue: <span className="font-bold">{gig.location}</span><br />
                    Price: <span className="font-bold text-green-600">{gig.final_price} Baht</span>
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={startGig} className="w-full">
                    <Check className="w-4 h-4 mr-2" />
                    Start Gig (เริ่มงาน)
                  </Button>
                </CardContent>
              </Card>
            )}

            {gig.status === 'in_progress' && (
              <Card>
                <CardHeader>
                  <CardTitle>Upload Performance Photo</CardTitle>
                  <p className="text-sm text-gray-500">Take a photo at the venue</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Image Preview */}
                  {proofImagePreview && (
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">Preview:</p>
                      <div className="relative rounded-lg overflow-hidden border-2 border-gray-200">
                        <img 
                          src={proofImagePreview} 
                          alt="Performance proof preview" 
                          className="w-full h-auto max-h-64 object-cover"
                        />
                        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                          Ready to upload
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {proofImagePreview ? 'Change Photo' : 'Upload Performance Photo (ถ่ายรูปหน้าเวที)'}
                  </Button>
                  <Button
                    onClick={uploadAndFinishGig}
                    disabled={!proofImageFile || finishing}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold"
                    size="lg"
                  >
                    {finishing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                    {finishing ? 'Uploading & Submitting...' : 'Finish Gig'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Camera className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">No Active Gig Found</h3>
              <p className="text-gray-500 mb-4">
                Please scan a QR code to start working on a gig.
              </p>
              <Button onClick={() => setScanning(true)} className="w-full">
                <Camera className="w-4 h-4 mr-2" />
                Start Scanner
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MusicianScanPage;
