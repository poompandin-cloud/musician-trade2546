import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, Calendar, TrendingUp, Users, Clock, CheckCircle, MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRealTimeCredits, refetchProfile } from "@/services/realTimeCreditService";

interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: 'monthly_reset' | 'job_application' | 'job_completion' | 'admin_adjustment';
  description: string;
  created_at: string;
  balance_after: number;
}

interface CreditUsage {
  id: string;
  user_id: string;
  job_id: string;
  credits_used: number;
  job_title: string;
  created_at: string;
}

const CreditDetailsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [usage, setUsage] = useState<CreditUsage[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // ใช้ Real-time Credits แทนการดึงข้อมูลใหม่
  const { credits: currentCredits, loading: creditsLoading } = useRealTimeCredits(userId);

  useEffect(() => {
    // ดึง userId จาก supabase auth
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    
    getCurrentUser();
    fetchCreditDetails();
  }, []);

  const fetchCreditDetails = async () => {
    try {
      setLoading(true);
      
      // ดึงข้อมูลเครดิตปัจจุบัน (ไม่ต้องดึงแล้ว เพราะใช้ Real-time)
      // แต่ยังคงดึงเพื่อความปลอดภัย
      const { data: profile, error: profileError } = await (supabase as any)
        .from('profiles')
        .select('credits')
        .single();

      if (profileError) {
        console.error('Error fetching credits:', profileError);
      } else {
        // ไม่ต้อง setCurrentCredits แล้ว เพราะใช้ Real-time
        console.log('📊 Profile credits:', profile?.credits || 0);
      }

      // ดึงประวัติการณ์การเครดิต
      const { data: transactionsData, error: transactionsError } = await (supabase as any)
        .from('credit_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError);
      } else {
        setTransactions(transactionsData || []);
      }

      // ดึงประวัติการณ์การใช้เครดิต
      const { data: usageData, error: usageError } = await (supabase as any)
        .from('credit_usage')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (usageError) {
        console.error('Error fetching usage:', usageError);
      } else {
        setUsage(usageData || []);
      }

    } catch (error) {
      console.error('Error fetching credit details:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดึงข้อมูลเครดิตได้",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    
    // ใช้ refetchProfile จาก realTimeCreditService เพื่ออัปเดตข้อมูล
    if (userId) {
      await refetchProfile(userId);
    }
    
    // ดึงข้อมูลอื่นๆ ใหม่
    await fetchCreditDetails();
    setRefreshing(false);
  };

  const handleLineContact = () => {
  window.open('https://line.me/ti/p/@121jhulh', '_blank');
};

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'monthly_reset':
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'job_application':
        return <TrendingUp className="w-4 h-4 text-orange-500" />;
      case 'job_completion':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'admin_adjustment':
        return <RefreshCw className="w-4 h-4 text-purple-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'monthly_reset':
        return 'text-blue-600';
      case 'job_application':
        return 'text-orange-600';
      case 'job_completion':
        return 'text-green-600';
      case 'admin_adjustment':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-border p-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            ย้อนกลับ
          </Button>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              รีเฟรช
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8 max-w-4xl mx-auto px-4">
        {/* Current Credits Display */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <span className="text-2xl font-bold">💰</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-1">เครดิตคงเหลือ</h1>
                  <p className="text-blue-100">ประจำบัญชีของคุณ</p>
                </div>
              </div>
              <div className="text-5xl font-bold mb-2">
                {creditsLoading ? (
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
                ) : (
                  currentCredits.toLocaleString()
                )}
              </div>
              <div className="flex items-center justify-center gap-2 text-blue-100">
                <Users className="w-4 h-4" />
                <span className="text-sm">อัปเดตล่าสุด: {new Date().toLocaleDateString('th-TH')}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Credit Rules */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                กฎเกณฑ์การใช้เครดิต
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <RefreshCw className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">รีเซ็ตรายเดือน</h3>
                  <p className="text-sm text-blue-700">เครดิตจะถูกรีเซ็ตใหม่ทุกวันที่ 1 ของเดือน</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <TrendingUp className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-green-900 mb-1">รับเครดิตฟรี</h3>
                  <p className="text-sm text-green-700">รับเครดิตฟรี 25 เครดิตต่อเดือนสำหรับผู้ใช้ทุกคน</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <CheckCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-orange-900 mb-1">การใช้งาน</h3>
                  <p className="text-sm text-orange-700">ใช้ 5 เครดิตต่อการประกาศงาน 1 ครั้ง</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top-up Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                ต้องการเติมเครดิตเพิ่ม?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <p className="text-center text-green-800 mb-4 font-medium">
                  ติดต่อเพื่อสิทธิประโยชน์และโอกาสการใช้งานมากขึ้น
                </p>
                <Button
                  onClick={handleLineContact}
                  className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                  size="lg"
                >
                  <Send className="w-5 h-5" />
                  ติดต่อเติมเครดิตผ่าน Line
                </Button>
              </div>
              
              <div className="text-center text-sm text-gray-600">
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" />
              ประวัติการณ์การเครดิต
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-4"></div>
                <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">ยังไม่มีประวัติการณ์การเครดิต</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {getTransactionIcon(transaction.transaction_type)}
                      <div>
                        <p className={`font-medium ${getTransactionColor(transaction.transaction_type)}`}>
                          {transaction.description}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(transaction.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-lg ${
                        transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                      </p>
                      <p className="text-xs text-gray-500">
                        คงเหลือ: {transaction.balance_after}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-orange-500" />
              ประวัติการณ์การใช้เครดิต
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-4"></div>
                <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
              </div>
            ) : usage.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">ยังไม่มีประวัติการณ์การใช้เครดิต</p>
              </div>
            ) : (
              <div className="space-y-3">
                {usage.map((usageItem) => (
                  <div
                    key={usageItem.id}
                    className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-orange-600" />
                      <div>
                        <p className="font-medium text-orange-900">
                          สมัครงาน: {usageItem.job_title}
                        </p>
                        <p className="text-sm text-orange-700">
                          {formatDate(usageItem.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-red-600">
                        -{usageItem.credits_used}
                      </p>
                      <p className="text-xs text-gray-500">
                        ใช้ไป
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CreditDetailsPage;
