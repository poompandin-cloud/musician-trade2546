import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, Calendar, MusicIcon, DollarSign, CheckCircle, XCircle, Timer, Upload, Camera, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import confetti from 'canvas-confetti';

const VenueGigDetailsPage = () => {
  const { gigId } = useParams<{ gigId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [gig, setGig] = useState<any>(null);
  const [musicianProfile, setMusicianProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [showProofDialog, setShowProofDialog] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (!gigId) {
      toast({ title: 'Invalid gig ID', variant: 'destructive' });
      navigate('/venue/qr-select');
      return;
    }
    fetchGigDetails();

    // Set up real-time subscription for gig updates
    const channel = supabase
      .channel('gig-updates')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'gigs',
        filter: `id=eq.${gigId}` 
      }, (payload) => {
        console.log('Gig update received:', payload);
        // When musician uploads proof and status changes
        fetchGigDetails();
        toast({ title: 'Musician submitted proof!' });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gigId]);

  const fetchGigDetails = async () => {
    try {
      // Fetch gig details
      const { data: gigData, error: gigError } = await supabase
        .from('gigs')
        .select('*')
        .eq('id', gigId)
        .single();

      if (gigError || !gigData) {
        toast({ title: 'Failed to load gig', description: gigError?.message, variant: 'destructive' });
        navigate('/venue/qr-select');
        return;
      }

      setGig(gigData);

      // If gig has musician_id, fetch musician profile
      if (gigData.musician_id) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, email, phone, instruments, avatar_url')
          .eq('id', gigData.musician_id)
          .single();

        if (profileError) {
          console.error('Error fetching musician profile:', profileError);
        } else {
          setMusicianProfile(profileData);
        }
      }

    } catch (error) {
      console.error('Error fetching gig details:', error);
      toast({ title: 'Error', description: 'Failed to load gig details', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const completeGig = async () => {
    try {
      const { error } = await supabase
        .from('gigs')
        .update({ status: 'completed' })
        .eq('id', gigId);

      if (error) {
        toast({ title: 'Failed to complete gig', description: error.message, variant: 'destructive' });
        return;
      }

      toast({ title: 'Gig completed successfully!' });
      navigate('/venue/qr-select');
    } catch (error) {
      console.error('Error completing gig:', error);
      toast({ title: 'Error', description: 'Failed to complete gig', variant: 'destructive' });
    }
  };

  const acceptWork = async () => {
    try {
      const { error } = await supabase
        .from('gigs')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', gigId);

      if (error) {
        toast({ title: 'Failed to accept work', description: error.message, variant: 'destructive' });
        return;
      }

      // Show confetti celebration
      setShowConfetti(true);
      
      // Launch confetti
      confetti({
        particleCount: 100,
        spread: 90,
        startVelocity: 30,
        gravity: 1.2,
        colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'],
        origin: { x: 0.5, y: 0.5 }
      });

      toast({ title: 'Work accepted and gig completed!' });
      
      // Hide confetti after 3 seconds and navigate
      setTimeout(() => {
        setShowConfetti(false);
        navigate('/venue/qr-select');
      }, 3000);
      
    } catch (error) {
      console.error('Error accepting work:', error);
      toast({ title: 'Error', description: 'Failed to accept work', variant: 'destructive' });
    }
  };

  const rejectProof = async () => {
    if (!confirm('Are you sure you want to reject this proof? The musician will need to submit a new one.')) return;

    try {
      const { error } = await supabase
        .from('gigs')
        .update({ 
          status: 'in_progress',
          performance_proof_url: null,
          rejection_reason: 'Proof does not meet requirements'
        })
        .eq('id', gigId);

      if (error) {
        toast({ title: 'Failed to reject proof', description: error.message, variant: 'destructive' });
        return;
      }

      toast({ title: 'Proof rejected', description: 'Musician will need to submit new proof' });
      fetchGigDetails(); // Refresh to show updated status
    } catch (error) {
      console.error('Error rejecting proof:', error);
      toast({ title: 'Error', description: 'Failed to reject proof', variant: 'destructive' });
    }
  };

  const cancelGig = async () => {
    if (!confirm('Are you sure you want to cancel this gig?')) return;

    try {
      const { error } = await supabase
        .from('gigs')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', gigId);

      if (error) {
        toast({ title: 'Failed to cancel gig', description: error.message, variant: 'destructive' });
        return;
      }

      toast({ title: 'Gig cancelled' });
      navigate('/venue/qr-select');
    } catch (error) {
      console.error('Error cancelling gig:', error);
      toast({ title: 'Error', description: 'Failed to cancel gig', variant: 'destructive' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'awaiting_approval': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Timer className="w-4 h-4" />;
      case 'in_progress': return <Clock className="w-4 h-4" />;
      case 'awaiting_approval': return <AlertCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading gig details...</p>
        </div>
      </div>
    );
  }

  if (!gig) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Gig not found</p>
          <Button onClick={() => navigate('/venue/qr-select')} className="mt-4">
            Back to Gig Selection
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/venue/qr-select')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Gig Details</h1>
        </div>

        {/* Gig Status Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{gig.title || 'Untitled Gig'}</CardTitle>
              <Badge className={getStatusColor(gig.status)}>
                <div className="flex items-center gap-1">
                  {getStatusIcon(gig.status)}
                  {gig.status?.replace('_', ' ').toUpperCase()}
                </div>
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">{gig.location || 'Not specified'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">{gig.date || 'Not specified'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MusicIcon className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Instrument</p>
                  <p className="font-medium">{gig.instrument || 'Not specified'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Price</p>
                  <p className="font-medium">{gig.final_price || 0} Baht</p>
                </div>
              </div>
            </div>

            {/* Musician Information */}
            {musicianProfile && (
              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Musician Information</h3>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="font-medium">{musicianProfile.full_name || 'Unknown'}</p>
                  {musicianProfile.email && (
                    <p className="text-sm text-gray-600">Email: {musicianProfile.email}</p>
                  )}
                  {musicianProfile.phone && (
                    <p className="text-sm text-gray-600">Phone: {musicianProfile.phone}</p>
                  )}
                  {musicianProfile.instruments && (
                    <p className="text-sm text-gray-600">Instruments: {musicianProfile.instruments}</p>
                  )}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">Timeline</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p>Created: {new Date(gig.created_at).toLocaleString()}</p>
                {gig.started_at && (
                  <p>Started: {new Date(gig.started_at).toLocaleString()}</p>
                )}
                {gig.completed_at && (
                  <p>Completed: {new Date(gig.completed_at).toLocaleString()}</p>
                )}
                {gig.cancelled_at && (
                  <p>Cancelled: {new Date(gig.cancelled_at).toLocaleString()}</p>
                )}
              </div>
            </div>

            {/* Performance Proof Display */}
            {gig.status === 'awaiting_approval' && gig.performance_proof_url && (
              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Performance Proof</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-center mb-4">
                    <img 
                      src={gig.performance_proof_url} 
                      alt="Performance Proof" 
                      className="max-w-full h-auto rounded-lg shadow-md cursor-pointer"
                      onClick={() => setShowProofDialog(true)}
                    />
                  </div>
                  <div className="flex justify-center">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowProofDialog(true)}
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      View Full Size
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              {gig.status === 'pending' && (
                <Button onClick={cancelGig} variant="destructive" className="flex-1">
                  Cancel Gig
                </Button>
              )}
              {gig.status === 'in_progress' && (
                <>
                  <Button onClick={completeGig} className="flex-1">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Complete Gig
                  </Button>
                  <Button onClick={cancelGig} variant="destructive" className="flex-1">
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel Gig
                  </Button>
                </>
              )}
              {gig.status === 'awaiting_approval' && (
                <>
                  <Button onClick={acceptWork} className="flex-1">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Accept Work
                  </Button>
                  <Button onClick={rejectProof} variant="destructive" className="flex-1">
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject/Request Edit
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Proof Image Dialog */}
      {showProofDialog && gig.performance_proof_url && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h3 className="text-lg font-medium">Performance Proof</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowProofDialog(false)}>
                <XCircle className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-4">
              <img 
                src={gig.performance_proof_url} 
                alt="Performance Proof Full Size" 
                className="w-full h-auto rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Confetti Celebration */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <canvas id="confetti-canvas" className="w-full h-full" />
        </div>
      )}
    </div>
  );
};

export default VenueGigDetailsPage;
