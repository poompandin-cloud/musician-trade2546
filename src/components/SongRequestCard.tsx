import React, { useState } from 'react';
import { Music, CreditCard, Heart, Play, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SongRequestCardProps {
  gigId: string;
  musicianId: string;
  musicianName?: string;
  currentProfile?: any;
  onRequestComplete?: () => void;
}

const SongRequestCard: React.FC<SongRequestCardProps> = ({ 
  gigId, 
  musicianId, 
  musicianName,
  currentProfile, 
  onRequestComplete 
}) => {
  const { toast } = useToast();
  const [isRequesting, setIsRequesting] = useState(false);
  const [songName, setSongName] = useState('');
  const [tipAmount, setTipAmount] = useState('');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [wantsToTip, setWantsToTip] = useState(false);
  const [showPaymentQR, setShowPaymentQR] = useState(false);

  const handleSongRequest = async () => {
    if (!currentProfile || currentProfile.account_type !== 'customer') {
      toast({ 
        title: 'Customer account required', 
        description: 'Please log in as a customer to make song requests.',
        variant: 'destructive' 
      });
      return;
    }

    if (!songName.trim()) {
      toast({ 
        title: 'Song name required', 
        description: 'Please enter the song name you want to request.',
        variant: 'destructive' 
      });
      return;
    }

    const tip = wantsToTip ? parseFloat(tipAmount) || 0 : 0;
    
    if (wantsToTip && (isNaN(tip) || tip < 0)) {
      toast({ 
        title: 'Invalid tip amount', 
        description: 'Please enter a valid tip amount.',
        variant: 'destructive' 
      });
      return;
    }

    setIsRequesting(true);

    try {
      // Create song request record
      const { data: songRequest, error: requestError } = await supabase
        .from('song_requests')
        .insert({
          gig_id: gigId,
          musician_id: musicianId,
          customer_id: currentProfile.id,
          song_name: songName.trim(),
          tip_amount: tip,
          payment_status: tip > 0 ? 'paid' : 'pending'
        })
        .select()
        .single();

      if (requestError) {
        throw requestError;
      }

      // Update gig total tips
      const { error: gigError } = await supabase.rpc('increment_gig_tips', {
        gig_id_param: gigId,
        tip_amount_param: tip
      });

      if (gigError) {
        throw gigError;
      }

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: currentProfile.id,
          transaction_type: 'deposit',
          amount: tip,
          balance_before: currentProfile.wallet_balance || 0,
          balance_after: (currentProfile.wallet_balance || 0) + tip,
          reference_id: songRequest.id,
          reference_type: 'song_request',
          description: `Tip for song request: "${songName}" to ${musicianName || 'musician'}`
        });

      if (transactionError) {
        throw transactionError;
      }

      // Create platform fee record
      const platformFee = tip * 0.10;
      const { error: feeError } = await supabase
        .from('platform_fees')
        .insert({
          gig_id: gigId,
          song_request_id: songRequest.id,
          fee_amount: platformFee,
          fee_type: 'tip',
          percentage_rate: 10.00
        });

      if (feeError) {
        throw feeError;
      }

      toast({ 
        title: 'Song request sent!', 
        description: `Your request for "${songName}"${tip > 0 ? ` with ¥${tip.toFixed(2)} tip` : ''} has been sent.`,
        variant: 'default' 
      });

      setShowRequestForm(false);
      setSongName('');
      setTipAmount('');
      setWantsToTip(false);
      onRequestComplete?.();

    } catch (error: any) {
      console.error('Song request error:', error);
      toast({ 
        title: 'Request failed', 
        description: error.message || 'Failed to send song request.',
        variant: 'destructive' 
      });
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="w-5 h-5 text-purple-500" />
          Request a Song
        </CardTitle>
        <p className="text-sm text-gray-500">
          Send a song request with tip to {musicianName || 'the musician'}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!showRequestForm ? (
          <Button onClick={() => setShowRequestForm(true)} className="w-full">
            <Heart className="w-4 h-4 mr-2" />
            Request Song
          </Button>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="song-name">Song Name</Label>
              <Input
                id="song-name"
                placeholder="Enter song title..."
                value={songName}
                onChange={(e) => setSongName(e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="want-tip"
                checked={wantsToTip}
                onChange={(e) => setWantsToTip(e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <Label htmlFor="want-tip" className="text-sm">
                88
              </Label>
            </div>
            
            {wantsToTip && (
              <div>
                <Label htmlFor="tip-amount">Tip Amount (¥)</Label>
                <Input
                  id="tip-amount"
                  type="number"
                  placeholder="50, 100, 200"
                  value={tipAmount}
                  onChange={(e) => setTipAmount(e.target.value)}
                  min="0"
                  step="10"
                />
                <p className="text-xs text-gray-500 mt-1">
                  88
                </p>
              </div>
            )}
            <div className="flex gap-2">
              <Button 
                onClick={handleSongRequest}
                disabled={isRequesting || !songName.trim()}
                className="flex-1"
              >
                {isRequesting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Send Request
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowRequestForm(false)}
                disabled={isRequesting}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
        
        <div className="text-xs text-gray-500 bg-purple-50 p-3 rounded">
          <p className="font-medium mb-1">How it works:</p>
          <ul className="space-y-1">
            <li>1. Request your favorite song</li>
            <li>2. Add an optional tip to show appreciation</li>
            <li>3. Musician receives the request immediately</li>
            <li>4. Tip goes directly to musician's wallet</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default SongRequestCard;
