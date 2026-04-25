import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, Eye, User, Store, Calendar, Search, Filter, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VerificationRequest {
  id: string;
  full_name: string;
  role: string;
  verification_status: string;
  verification_docs: any;
  created_at: string;
  updated_at: string;
  verification_feedback?: string;
}

const AdminVerificationDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    checkAdminRole();
  }, []);

  const checkAdminRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
        
      if (error || !data || data.role !== 'admin') {
        toast({ 
          title: 'Access Denied', 
          description: 'This page is restricted to administrators only',
          variant: 'destructive' 
        });
        navigate('/');
        return;
      }
      
      // User is admin, proceed to fetch data
      fetchVerificationRequests();
    } catch (err) {
      toast({ 
        title: 'Authentication Error', 
        description: 'Failed to verify admin access',
        variant: 'destructive' 
      });
      navigate('/');
    } finally {
      setCheckingAuth(false);
    }
  };

  const fetchVerificationRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('verification_status', ['pending', 'rejected'])
        .order('updated_at', { ascending: false });
      
      if (error) {
        toast({ title: 'Failed to load requests', description: error.message, variant: 'destructive' });
      } else {
        console.log('Fetched verification requests:', data);
        console.log('Sample verification_docs:', data?.[0]?.verification_docs);
        setRequests(data || []);
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to fetch verification requests', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.verification_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openReviewModal = (request: VerificationRequest) => {
    console.log('Opening review modal for:', request);
    console.log('Verification docs:', request.verification_docs);
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  const openRejectModal = (request: VerificationRequest) => {
    setSelectedRequest(request);
    setShowRejectModal(true);
    setRejectReason('');
  };

  const approveRequest = async () => {
    if (!selectedRequest) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          verification_status: 'verified',
          is_verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedRequest.id);
        
      if (error) throw error;
      
      toast({ title: 'Approved!', description: `Verified ${selectedRequest.full_name}` });
      setShowDetailModal(false);
      fetchVerificationRequests();
    } catch (err: any) {
      toast({ title: 'Failed to approve', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const rejectRequest = async () => {
    if (!selectedRequest || !rejectReason.trim()) {
      toast({ title: 'Please provide rejection reason', variant: 'destructive' });
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          verification_status: 'rejected',
          is_verified: false,
          verification_feedback: rejectReason,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedRequest.id);
        
      if (error) throw error;
      
      toast({ title: 'Rejected', description: `Rejected ${selectedRequest.full_name}` });
      setShowRejectModal(false);
      setShowDetailModal(false);
      fetchVerificationRequests();
    } catch (err: any) {
      toast({ title: 'Failed to reject', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Pending</Badge>;
      case 'verified':
        return <Badge variant="default" className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Verified</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="w-3 h-3" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'musician':
        return <Badge variant="outline" className="flex items-center gap-1"><User className="w-3 h-3" /> Musician</Badge>;
      case 'venue':
        return <Badge variant="outline" className="flex items-center gap-1"><Store className="w-3 h-3" /> Venue</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const ImageCard = ({ url, title, onClick }: { url: string; title: string; onClick: () => void }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group" onClick={onClick}>
      <div className="aspect-square relative bg-gray-100">
        {url ? (
          <>
            <img 
              src={url} 
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
              <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 bg-gray-200 rounded-lg flex items-center justify-center">
                <X className="w-6 h-6" />
              </div>
              <p className="text-xs">No image</p>
            </div>
          </div>
        )}
      </div>
      <CardContent className="p-3">
        <h4 className="font-medium text-sm truncate">{title}</h4>
      </CardContent>
    </Card>
  );

  const DocumentViewer = ({ url, title }: { url: string; title: string }) => {
    console.log(`DocumentViewer - ${title}:`, url);
    
    // Check if it's a Supabase storage URL or any image URL
    if (url && (url.match(/\.(jpg|jpeg|png|gif|webp)$/i) || url.includes('supabase.co/storage'))) {
      return (
        <ImageCard 
          url={url} 
          title={title} 
          onClick={() => setLightboxImage(url)}
        />
      );
    }
    
    return (
      <Card className="p-4">
        <Label className="text-sm font-medium block mb-2">{title}</Label>
        {url ? (
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-sm flex items-center gap-1"
          >
            <Eye className="w-3 h-3" />
            View {title}
          </a>
        ) : (
          <p className="text-gray-500 text-sm">Not provided</p>
        )}
      </Card>
    );
  };

  // Show loading while checking admin role
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Verifying access...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Verification Dashboard</h1>
              <p className="text-gray-600">Manage user verification requests</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold">{requests.length}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Filter className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {requests.filter(r => r.verification_status === 'pending').length}
                  </p>
                </div>
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">
                    {requests.filter(r => r.verification_status === 'rejected').length}
                  </p>
                </div>
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>Verification Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">CheckSquare</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No verification requests</h3>
                <p className="text-gray-600">No pending or rejected requests found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Name</th>
                      <th className="text-left py-3 px-4 font-medium">Role</th>
                      <th className="text-left py-3 px-4 font-medium">Status</th>
                      <th className="text-left py-3 px-4 font-medium">Submitted</th>
                      <th className="text-left py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((request) => (
                      <tr key={request.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{request.full_name}</p>
                            <p className="text-sm text-gray-500">ID: {request.id.slice(0, 8)}...</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {getRoleBadge(request.role)}
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(request.verification_status)}
                          {request.verification_feedback && (
                            <p className="text-xs text-gray-500 mt-1">{request.verification_feedback}</p>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {new Date(request.updated_at).toLocaleDateString('th-TH')}
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openReviewModal(request)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            Review
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Review Detail Modal */}
        {showDetailModal && selectedRequest && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getRoleBadge(selectedRequest.role)}
                    <span>{selectedRequest.full_name}</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setShowDetailModal(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Musician Documents */}
                {selectedRequest.role === 'musician' && selectedRequest.verification_docs && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Musician Verification Documents
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <DocumentViewer url={selectedRequest.verification_docs.id_card_photo} title="ID Card Photo" />
                      <DocumentViewer url={selectedRequest.verification_docs.selfie_with_id} title="Selfie with ID" />
                      {selectedRequest.verification_docs.portfolio_link && (
                        <Card className="p-4">
                          <Label className="text-sm font-medium block mb-2">Portfolio Link</Label>
                          <a 
                            href={selectedRequest.verification_docs.portfolio_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            View Portfolio
                          </a>
                        </Card>
                      )}
                    </div>
                  </div>
                )}

                {/* Venue Documents */}
                {selectedRequest.role === 'venue' && selectedRequest.verification_docs && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Store className="w-5 h-5" />
                      Venue Verification Documents
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <DocumentViewer url={selectedRequest.verification_docs.business_license} title="Business License" />
                      <DocumentViewer url={selectedRequest.verification_docs.utility_bill} title="Utility Bill" />
                      <DocumentViewer url={selectedRequest.verification_docs.selfie_with_shop_sign} title="Selfie with Shop Sign" />
                      <DocumentViewer url={selectedRequest.verification_docs.owner_selfie_with_id} title="Owner Selfie with ID" />
                      <Card className="p-4">
                        <Label className="text-sm font-medium block mb-2">Official Phone</Label>
                        <p className="text-sm">{selectedRequest.verification_docs.official_phone || 'Not provided'}</p>
                      </Card>
                      {selectedRequest.verification_docs.social_media_link && (
                        <Card className="p-4">
                          <Label className="text-sm font-medium block mb-2">Social Media Link</Label>
                          <a 
                            href={selectedRequest.verification_docs.social_media_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            View Social Media
                          </a>
                        </Card>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={approveRequest}
                    disabled={loading}
                    className="flex-1"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => openRejectModal(selectedRequest)}
                    disabled={loading}
                    variant="destructive"
                    className="flex-1"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && selectedRequest && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Reject Verification</CardTitle>
                <p className="text-sm text-gray-600">
                  Please provide a reason for rejecting {selectedRequest.full_name}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="rejectReason">Rejection Reason</Label>
                  <Textarea
                    id="rejectReason"
                    placeholder="e.g., ID card not clear, Not the actual owner, Documents incomplete..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={4}
                  />
                </div>
                
                <div className="flex gap-3">
                  <Button
                    onClick={rejectRequest}
                    disabled={loading || !rejectReason.trim()}
                    className="flex-1"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Confirm Reject
                  </Button>
                  <Button
                    onClick={() => setShowRejectModal(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Lightbox Modal */}
        {lightboxImage && (
          <div 
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
            onClick={() => setLightboxImage(null)}
          >
            <div className="relative max-w-7xl max-h-full">
              <Button
                variant="ghost"
                size="icon"
                className="absolute -top-12 right-0 text-white hover:bg-white/20"
                onClick={() => setLightboxImage(null)}
              >
                <X className="w-6 h-6" />
              </Button>
              <img 
                src={lightboxImage} 
                alt="Verification Document"
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />
              <div className="text-center mt-4">
                <p className="text-white/80 text-sm">Click anywhere to close</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminVerificationDashboard;
