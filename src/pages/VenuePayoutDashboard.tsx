import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, DollarSign, Calendar, MapPin, Star, Camera, X, Eye, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const VenuePayoutDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [completedGigs, setCompletedGigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRating, setShowRating] = useState<{ gigId: string; musicianId: string } | null>(null);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [showPaymentQR, setShowPaymentQR] = useState<string | null>(null);
  const [showProofDialog, setShowProofDialog] = useState<{ gigId: string; imageUrl: string } | null>(null);

  useEffect(() => {
    fetchCompletedGigs();
  }, []);

  const fetchCompletedGigs = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('No user found');
      return;
    }
    
    console.log('=== DEBUGGING VenuePayoutDashboard ===');
    console.log('User ID:', user.id);
    console.log('User email:', user.email);
    
    // Try 1: Basic query to check if gigs table exists
    console.log('\n--- Try 1: Basic gigs table check ---');
    const { data: basicData, error: basicError } = await supabase
      .from('gigs')
      .select('id, status, shop_id')
      .limit(5);
      
    console.log('Basic query result:', { basicData, basicError });
    
    // Try 2: Query with shop_id filter
    console.log('\n--- Try 2: Query with shop_id filter ---');
    const { data: shopData, error: shopError } = await supabase
      .from('gigs')
      .select('*')
      .eq('shop_id', user.id);
      
    console.log('Shop query result:', { shopData, shopError });
    
    // Try 3: Query with status filter only
    console.log('\n--- Try 3: Query with status filter only ---');
    const { data: statusData, error: statusError } = await supabase
      .from('gigs')
      .select('*')
      .in('status', ['awaiting_approval', 'completed', 'paid']);
      
    console.log('Status query result:', { statusData, statusError });
    
    // Try 4: Original query (อันนี้คืออันที่ใช้งานจริง)
    const { data, error } = await supabase
      .from('gigs')
      .select('*')
      .order('updated_at', { ascending: false });
      
    console.log('Original query result:', { data, error });
    
    // Try 5: Check if it's 'jobs' table instead of 'gigs'
    console.log('\n--- Try 5: Check jobs table ---');
    const { data: jobsData, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .eq('shop_id', user.id)
      .in('status', ['awaiting_approval', 'completed', 'paid']);
      
    console.log('Jobs table result:', { jobsData, jobsError });
    
    // Try 6: Check all gigs for this user without status filter
    console.log('\n--- Try 6: All gigs for user ---');
    const { data: allGigsData, error: allGigsError } = await supabase
      .from('gigs')
      .select('*')
      .eq('shop_id', user.id);
      
    console.log('All gigs result:', { allGigsData, allGigsError });
    
    // Use the original query result for display
    if (error) {
      console.error('Supabase error:', error);
      toast({ title: 'Failed to load gigs', description: error.message, variant: 'destructive' });
    } else {
      console.log('Final gigs to display:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('Gig details:', data.map(g => ({ 
          id: g.id, 
          title: g.title, 
          status: g.status, 
          shop_id: g.shop_id,
          performance_proof_url: g.performance_proof_url,
          has_proof: !!g.performance_proof_url
        })));
      }
      setCompletedGigs(data || []);
    }
  };

  const approveAndPay = async (gig: any) => {
    setLoading(true);
    
    console.log('=== ESCROW RELEASE TRIGGERED ===');
    console.log('Gig ID:', gig.id);
    console.log('Musician ID:', gig.musician_id);
    
    // Update gig status to completed - this will trigger the escrow release function
    const { error } = await supabase
      .from('gigs')
      .update({ status: 'completed' })
      .eq('id', gig.id);
      
    if (error) {
      console.error('Failed to approve gig:', error);
      toast({ title: 'Failed to approve', description: error.message, variant: 'destructive' });
    } else {
      console.log('Gig approved successfully - escrow release triggered');
      
      // Show success message with escrow information
      toast({ 
        title: 'Work approved! Escrow released.', 
        description: 'Customer payments have been released to the musician (10% platform fee deducted).',
        variant: 'default' 
      });
      
      // Refresh data to show updated status
      fetchCompletedGigs();
      
      // Show rating dialog
      setShowRating({ gigId: gig.id, musicianId: gig.musician_id });
    }
    setLoading(false);
  };

  const viewPaymentQR = async (musicianId: string, amount?: number) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('payment_qr_url, bank_account')
      .eq('id', musicianId)
      .single();
    if (error) {
      toast({ title: 'Failed to load payment info', description: error.message, variant: 'destructive' });
      return;
    }
    // If amount is provided and bank account looks like PromptPay, generate a PromptPay QR with amount
    if (amount && data.bank_account && /^\d{10}$/.test(data.bank_account.replace(/-/g, ''))) {
      try {
        // Generate PromptPay QR with amount using a simple payload
        const promptPayPayload = `000201010211300700${data.bank_account.replace(/-/g, '').padStart(13, '0')}520400005303${amount}5802TH`;
        const QRCode = (await import('qrcode')).default;
        const qrUrl = await QRCode.toDataURL(promptPayPayload, { width: 256 });
        setShowPaymentQR(qrUrl);
      } catch (err) {
        console.error('Failed to generate PromptPay QR', err);
        setShowPaymentQR(data.payment_qr_url);
      }
    } else {
      setShowPaymentQR(data.payment_qr_url);
    }
  };

  const submitRating = async () => {
    if (!showRating || rating === 0) {
      toast({ title: 'Please select a star rating', variant: 'destructive' });
      return;
    }
    const { error } = await supabase
      .from('reviews')
      .insert({
        gig_id: showRating.gigId,
        reviewer_id: (await supabase.auth.getUser()).data.user?.id,
        reviewee_id: showRating.musicianId,
        rating,
        comment: ratingComment,
      });
    if (error) {
      toast({ title: 'Failed to submit rating', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Thank you! Rating submitted.' });
      setShowRating(null);
      setRating(0);
      setRatingComment('');
      fetchCompletedGigs();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Venue Payout Dashboard</h1>
          </div>
          <Button 
            onClick={fetchCompletedGigs} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {completedGigs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">No completed gigs to review.</p>
            </CardContent>
          </Card>
        ) : (
          completedGigs.map((gig) => (
            <Card key={gig.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {gig.title || gig.instrument}
                  <span className="text-sm font-normal text-green-600">{gig.status}</span>
                </CardTitle>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {gig.location}
                </p>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {gig.date}
                </p>
                {gig.final_price && (
                  <p className="text-sm font-medium text-green-600 flex items-center gap-1">
                    <DollarSign className="w-4 h-4" /> {gig.final_price} Baht
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {(() => {
                  console.log(`🔍 DEBUGGING IMAGE for Gig ${gig.id}:`);
                  console.log('- performance_proof_url:', gig.performance_proof_url);
                  console.log('- type:', typeof gig.performance_proof_url);
                  console.log('- is null:', gig.performance_proof_url === null);
                  console.log('- is undefined:', gig.performance_proof_url === undefined);
                  console.log('- is empty string:', gig.performance_proof_url === '');
                  console.log('- trimmed:', gig.performance_proof_url?.trim());
                  console.log('- should show image:', gig.performance_proof_url && gig.performance_proof_url.trim() !== '');
                  
                  return gig.performance_proof_url && gig.performance_proof_url.trim() !== '';
                })() && (
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-1">
                      <Camera className="w-4 h-4" /> Performance Proof
                    </p>
                    <div className="relative group">
                      <img
                        src={gig.performance_proof_url}
                        alt="Performance Proof"
                        className="w-full rounded-lg border-2 border-gray-200 cursor-pointer transition-all hover:border-blue-300 hover:shadow-md"
                        onClick={() => setShowProofDialog({ gigId: gig.id, imageUrl: gig.performance_proof_url })}
                        onError={(e) => {
                          console.error('❌ Image failed to load:', gig.performance_proof_url);
                          e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f3f4f6"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="%236b7280" font-size="12">Image not available</text></svg>';
                        }}
                        onLoad={() => {
                          console.log('✅ Image loaded successfully for gig', gig.id);
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-lg pointer-events-none" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Click to view full size</p>
                  </div>
                )}
                {gig.status === 'awaiting_approval' && (
                  <div className="space-y-2">
                    <Button
                      onClick={() => setShowProofDialog({ gigId: gig.id, imageUrl: gig.performance_proof_url })}
                      variant="outline"
                      className="w-full"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Proof
                    </Button>
                    <Button
                      onClick={() => approveAndPay(gig)}
                      disabled={loading}
                      className="w-full"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                  </div>
                )}
                {(gig.status === 'completed' || gig.status === 'paid') && (
                  <Button
                    onClick={() => viewPaymentQR(gig.musician_id, gig.final_price)}
                    variant="outline"
                    className="w-full"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Payment QR (Payment QR)
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}

        {showRating && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Rate Musician
                  <Button variant="ghost" size="icon" onClick={() => setShowRating(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-8 h-8 cursor-pointer ${
                        star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                      }`}
                      onClick={() => setRating(star)}
                    />
                  ))}
                </div>
                <textarea
                  className="w-full border rounded p-2 text-sm"
                  rows={3}
                  placeholder="Optional comment..."
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                />
                <Button onClick={submitRating} className="w-full">
                  Submit Rating
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {showPaymentQR && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Payment QR Code
                  <Button variant="ghost" size="icon" onClick={() => setShowPaymentQR(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {showPaymentQR ? (
                  <>
                    <img src={showPaymentQR} alt="Payment QR" className="w-full rounded-lg" />
                    <p className="text-xs text-center text-gray-500">Scan to pay the agreed amount</p>
                  </>
                ) : (
                  <p className="text-center text-gray-500">No QR code provided</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Proof Image Dialog */}
        {showProofDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
              <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
                <h3 className="text-lg font-medium">Performance Proof</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowProofDialog(null)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="p-4">
                <img 
                  src={showProofDialog.imageUrl} 
                  alt="Performance Proof Full Size" 
                  className="w-full h-auto rounded-lg"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VenuePayoutDashboard;
