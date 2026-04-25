import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet, Plus, CreditCard, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const WalletPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentProfile, setCurrentProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
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
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount);
    if (!amount || amount <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid amount.',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);

    try {
      // In a real implementation, you would integrate with a payment gateway here
      // For now, we'll simulate adding funds to the wallet
      const newBalance = (currentProfile?.wallet_balance || 0) + amount;
      
      const { error } = await supabase
        .from('profiles')
        .update({ wallet_balance: newBalance })
        .eq('id', currentProfile.id);

      if (error) {
        throw error;
      }

      // Create transaction record
      await supabase
        .from('transactions')
        .insert({
          user_id: currentProfile.id,
          transaction_type: 'deposit',
          amount: amount,
          balance_before: currentProfile.wallet_balance || 0,
          balance_after: newBalance,
          reference_id: null,
          reference_type: 'topup',
          description: `Wallet top-up of ${amount} Baht`
        });

      toast({
        title: 'Top-up successful!',
        description: `${amount} Baht has been added to your wallet.`,
        variant: 'default'
      });

      setTopUpAmount('');
      fetchProfile(); // Refresh balance

    } catch (error: any) {
      console.error('Top-up error:', error);
      toast({
        title: 'Top-up failed',
        description: error.message || 'Failed to add funds to wallet.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-bold">Wallet</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {currentProfile?.full_name || 'Guest'}
              </span>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Wallet className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Wallet Balance Card */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-blue-600" />
                Current Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {(currentProfile?.wallet_balance || 0).toFixed(2)}  Baht
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Available for bookings and tips
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Top-up Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-green-600" />
                Add Funds
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="topup-amount">Amount (Baht)</Label>
                <Input
                  id="topup-amount"
                  type="number"
                  placeholder="100, 500, 1000"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  min="100"
                  step="100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum 100 Baht
                </p>
              </div>
              <Button 
                onClick={handleTopUp}
                disabled={isProcessing || !topUpAmount}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Add Funds
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Amount Buttons */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Add</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[100, 500, 1000, 2000].map((amount) => (
              <Button
                key={amount}
                variant="outline"
                onClick={() => setTopUpAmount(amount.toString())}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {amount} Baht
              </Button>
            ))}
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">About Wallet</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">How to use</h4>
              <ul className="space-y-1 text-sm text-blue-700">
                <li>· Add funds to your wallet</li>
                <li>· Use wallet balance for table bookings</li>
                <li>· Tip musicians during live performances</li>
                <li>· All transactions are secure</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Benefits</h4>
              <ul className="space-y-1 text-sm text-blue-700">
                <li>· Instant booking confirmation</li>
                <li>· No payment delays</li>
                <li>· Secure escrow system</li>
                <li>· Transaction history</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletPage;
