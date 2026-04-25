import React, { useState, useEffect } from 'react';
import { Wallet, ArrowUpRight, ArrowDownLeft, History, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface WalletBalanceProps {
  userId: string;
  accountType: 'musician' | 'venue' | 'customer';
  className?: string;
}

interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  description?: string;
  created_at: string;
}

const WalletBalance: React.FC<WalletBalanceProps> = ({ 
  userId, 
  accountType, 
  className = '' 
}) => {
  const { toast } = useToast();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchWalletData();
  }, [userId]);

  const fetchWalletData = async () => {
    try {
      // Fetch user profile with wallet balance
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('wallet_balance')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      setBalance(profile.wallet_balance || 0);

      // Fetch recent transactions
      const { data: txs, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (txError) throw txError;
      setTransactions(txs || []);

    } catch (error: any) {
      console.error('Failed to fetch wallet data:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to load wallet data.',
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    const depositAmount = parseFloat(amount);
    if (!depositAmount || depositAmount <= 0) {
      toast({ 
        title: 'Invalid amount', 
        description: 'Please enter a valid deposit amount.',
        variant: 'destructive' 
      });
      return;
    }

    try {
      const { error } = await supabase.rpc('add_wallet_balance', {
        user_id_param: userId,
        amount_param: depositAmount,
        description_param: description || 'Wallet deposit'
      });

      if (error) throw error;

      toast({ 
        title: 'Deposit successful!', 
        description: `${depositAmount} Baht added to your wallet.`,
        variant: 'default' 
      });

      setShowDeposit(false);
      setAmount('');
      setDescription('');
      fetchWalletData();

    } catch (error: any) {
      console.error('Deposit error:', error);
      toast({ 
        title: 'Deposit failed', 
        description: error.message || 'Failed to process deposit.',
        variant: 'destructive' 
      });
    }
  };

  const handleWithdraw = async () => {
    const withdrawAmount = parseFloat(amount);
    if (!withdrawAmount || withdrawAmount <= 0) {
      toast({ 
        title: 'Invalid amount', 
        description: 'Please enter a valid withdrawal amount.',
        variant: 'destructive' 
      });
      return;
    }

    if (withdrawAmount > balance) {
      toast({ 
        title: 'Insufficient balance', 
        description: 'You do not have enough balance for this withdrawal.',
        variant: 'destructive' 
      });
      return;
    }

    try {
      const { error } = await supabase.rpc('subtract_wallet_balance', {
        user_id_param: userId,
        amount_param: withdrawAmount,
        description_param: description || 'Wallet withdrawal'
      });

      if (error) throw error;

      toast({ 
        title: 'Withdrawal successful!', 
        description: `${withdrawAmount} Baht withdrawn from your wallet.`,
        variant: 'default' 
      });

      setShowWithdraw(false);
      setAmount('');
      setDescription('');
      fetchWalletData();

    } catch (error: any) {
      console.error('Withdrawal error:', error);
      toast({ 
        title: 'Withdrawal failed', 
        description: error.message || 'Failed to process withdrawal.',
        variant: 'destructive' 
      });
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="w-4 h-4 text-green-500" />;
      case 'withdrawal':
        return <ArrowUpRight className="w-4 h-4 text-red-500" />;
      case 'tip_received':
        return <TrendingUp className="w-4 h-4 text-purple-500" />;
      case 'booking_release':
        return <Wallet className="w-4 h-4 text-blue-500" />;
      default:
        return <History className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'Deposit';
      case 'withdrawal':
        return 'Withdrawal';
      case 'tip_received':
        return 'Tip Received';
      case 'booking_release':
        return 'Gig Payment';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          My Wallet
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Balance Display */}
        <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Available Balance</p>
          <p className="text-3xl font-bold text-gray-900">
             {balance.toFixed(2)} Baht
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Account Type: {accountType.charAt(0).toUpperCase() + accountType.slice(1)}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button 
            onClick={() => setShowDeposit(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowDownLeft className="w-4 h-4" />
            Deposit
          </Button>
          <Button 
            onClick={() => setShowWithdraw(true)}
            variant="outline"
            className="flex items-center gap-2"
            disabled={balance <= 0}
          >
            <ArrowUpRight className="w-4 h-4" />
            Withdraw
          </Button>
        </div>

        {/* Recent Transactions */}
        {transactions.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">Recent Activity</h4>
            <div className="space-y-2">
              {transactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    {getTransactionIcon(tx.transaction_type)}
                    <div>
                      <p className="text-sm font-medium">
                        {getTransactionLabel(tx.transaction_type)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${
                      tx.transaction_type === 'deposit' || tx.transaction_type === 'tip_received' || tx.transaction_type === 'booking_release'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {tx.transaction_type === 'deposit' || tx.transaction_type === 'tip_received' || tx.transaction_type === 'booking_release' ? '+' : '-'}
                      {tx.amount.toFixed(2)} Baht
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deposit Modal */}
        {showDeposit && (
          <div className="space-y-4 p-4 border rounded-lg">
            <h4 className="font-medium">Add Funds</h4>
            <div>
              <Label htmlFor="deposit-amount">Amount (Baht)</Label>
              <Input
                id="deposit-amount"
                type="number"
                placeholder="100, 500, 1000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
              />
            </div>
            <div>
              <Label htmlFor="deposit-desc">Description (Optional)</Label>
              <Input
                id="deposit-desc"
                placeholder="Wallet deposit"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleDeposit} disabled={!amount}>
                Deposit
              </Button>
              <Button variant="outline" onClick={() => setShowDeposit(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Withdraw Modal */}
        {showWithdraw && (
          <div className="space-y-4 p-4 border rounded-lg">
            <h4 className="font-medium">Withdraw Funds</h4>
            <div>
              <Label htmlFor="withdraw-amount">Amount (Baht)</Label>
              <Input
                id="withdraw-amount"
                type="number"
                placeholder="100, 500, 1000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                max={balance}
              />
              <p className="text-xs text-gray-500 mt-1">
                Available: {balance.toFixed(2)} Baht
              </p>
            </div>
            <div>
              <Label htmlFor="withdraw-desc">Description (Optional)</Label>
              <Input
                id="withdraw-desc"
                placeholder="Wallet withdrawal"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleWithdraw} disabled={!amount || parseFloat(amount) > balance}>
                Withdraw
              </Button>
              <Button variant="outline" onClick={() => setShowWithdraw(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WalletBalance;
