import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, QrCode, Check, X, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import QRCode from 'qrcode';

const VenueQRPage = () => {
  const { gigId } = useParams<{ gigId?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [gig, setGig] = useState<any>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [showPopup, setShowPopup] = useState(false);
  const [finalPrice, setFinalPrice] = useState<string>('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkForExistingGigs();
  }, []);

  const checkForExistingGigs = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: 'Not logged in', variant: 'destructive' });
      navigate('/');
      return;
    }

    // Check for existing gigs with in_progress status only
    const { data: existingGig, error: fetchError } = await supabase
      .from('gigs')
      .select('*')
      .eq('shop_id', user.id)
      .eq('status', 'in_progress') // Only check for gigs that have started
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error checking existing gigs:', fetchError);
    }

    // If there is an in_progress gig, redirect to gig details
    if (existingGig) {
      console.log('Found in_progress gig:', existingGig);
      
      toast({ 
        title: 'Active gig found', 
        description: `Redirecting to active gig: ${existingGig.title || 'Untitled'}`,
        variant: 'default' 
      });
      
      // Redirect to the active gig details
      navigate(`/venue/gig/${existingGig.id}`);
      return;
    }

    // If no in_progress gigs, continue with normal flow (show QR for pending gigs)
    console.log('No in_progress gigs found, showing QR page');

    // If no existing gigs and gigId is provided, fetch that specific gig
    if (gigId) {
      fetchGig();
    } else {
      toast({ title: 'No gig ID provided', variant: 'destructive' });
      navigate('/venue/qr-select');
    }
  };

  const fetchGig = async () => {
    const { data, error } = await supabase
      .from('gigs')
      .select('*')
      .eq('id', gigId)
      .single();
    if (error || !data) {
      toast({ title: 'Failed to load gig', description: error?.message, variant: 'destructive' });
      navigate('/');
      return;
    }
    setGig(data);
    // Generate QR code containing gigId
    const qr = await QRCode.toDataURL(gigId, { width: 256 });
    setQrDataUrl(qr);
  };

  const handleStartGig = async () => {
    if (!finalPrice || !agreed) {
      toast({ title: 'Please enter price and accept terms', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from('gigs')
      .update({ status: 'in_progress', final_price: parseFloat(finalPrice) })
      .eq('id', gigId);
    if (error) {
      toast({ title: 'Failed to start gig', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Gig started successfully!' });
      setShowPopup(false);
    }
    setLoading(false);
  };

  if (!gig) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Gig QR Code</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{gig.title || gig.instrument}</CardTitle>
            <p className="text-sm text-gray-500">{gig.location}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {qrDataUrl && (
              <div className="flex justify-center">
                <img src={qrDataUrl} alt="QR Code" className="border rounded-lg" />
              </div>
            )}
            <p className="text-center text-sm text-gray-600">
              Show this QR to the musician to start the gig.
            </p>
            <Button onClick={() => setShowPopup(true)} className="w-full">
              Musician scanned QR - Set Price & Start Gig
            </Button>
          </CardContent>
        </Card>

        {showPopup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Start Gig
                  <Button variant="ghost" size="icon" onClick={() => setShowPopup(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Final Price (Baht)</label>
                  <Input
                    type="number"
                    placeholder="Enter agreed price"
                    value={finalPrice}
                    onChange={(e) => setFinalPrice(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="agree" checked={agreed} onCheckedChange={(v) => setAgreed(!!v)} />
                  <label htmlFor="agree" className="text-sm">
                    I agree to the terms and conditions of this gig.
                  </label>
                </div>
                <Button onClick={handleStartGig} disabled={!finalPrice || !agreed || loading} className="w-full">
                  {loading ? 'Starting...' : 'Start Gig'}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default VenueQRPage;
