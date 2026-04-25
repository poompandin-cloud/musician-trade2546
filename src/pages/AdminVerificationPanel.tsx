import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, Store, Globe, FileText, Eye, User, Camera, Phone, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const AdminVerificationPanel = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [unverifiedVenues, setUnverifiedVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
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
      fetchPendingRequests();
      fetchUnverifiedVenues();
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

  const fetchPendingRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('verification_status', 'pending')
        .order('updated_at', { ascending: false });
      if (error) {
        console.error('Fetch pending requests error:', error);
        toast({ title: 'Failed to load requests', description: error.message, variant: 'destructive' });
      } else {
        console.log('Pending requests fetched:', data);
        if (data && data.length > 0) {
          console.log('Sample pending request structure:', data[0]);
          console.log('Sample pending request ID:', data[0].id);
          console.log('Sample pending request ID type:', typeof data[0].id);
        }
        setPendingRequests(data || []);
      }
    } catch (err) {
      console.error('Unexpected error fetching pending requests:', err);
      toast({ title: 'Error', description: 'Failed to fetch pending requests', variant: 'destructive' });
    }
  };

  const fetchUnverifiedVenues = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'venue')
        .eq('is_verified', false)
        .order('updated_at', { ascending: false });
      if (error) {
        console.error('Fetch unverified venues error:', error);
        toast({ title: 'Failed to load venues', description: error.message, variant: 'destructive' });
      } else {
        console.log('Unverified venues fetched:', data);
        if (data && data.length > 0) {
          console.log('Sample unverified venue structure:', data[0]);
          console.log('Sample unverified venue ID:', data[0].id);
          console.log('Sample unverified venue ID type:', typeof data[0].id);
        }
        setUnverifiedVenues(data || []);
      }
    } catch (err) {
      console.error('Unexpected error fetching unverified venues:', err);
      toast({ title: 'Error', description: 'Failed to fetch unverified venues', variant: 'destructive' });
    }
  };

  const approveVenue = async (profileId: string) => {
    console.log(' Approving profile with ID:', profileId);
    console.log(' Target ID in DB:', profileId);
    console.log(' Profile ID type:', typeof profileId);
    console.log(' Profile ID length:', profileId?.length);
    setLoading(true);
    
    try {
      // First, let's check if the profile exists before updating
      console.log(' Checking if profile exists...');
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id, full_name, role, is_verified, verification_status')
        .eq('id', profileId)
        .single();
      
      console.log(' Existing profile check:', { existingProfile, fetchError });
      
      if (fetchError) {
        console.error(' Profile fetch error:', fetchError);
        toast({ 
          title: 'Profile Not Found', 
          description: `Cannot find profile with ID: ${profileId}`,
          variant: 'destructive' 
        });
        setLoading(false);
        return;
      }
      
      if (!existingProfile) {
        console.error(' Profile does not exist:', profileId);
        toast({ 
          title: 'Profile Not Found', 
          description: `Profile with ID ${profileId} does not exist`,
          variant: 'destructive' 
        });
        setLoading(false);
        return;
      }
      
      console.log(' Profile found, attempting update...');
      console.log(' Current status:', {
        is_verified: existingProfile.is_verified,
        verification_status: existingProfile.verification_status
      });
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ is_verified: true, verification_status: 'approved' })
        .eq('id', profileId)
        .select(); //  return updated data for verification
      
      console.log(' Update result:', { data, error });
      
      if (error) {
        console.error(' Database update error:', error);
        toast({ title: 'Failed to approve', description: error.message, variant: 'destructive' });
      } else if (!data || data.length === 0) {
        console.error(' No records updated - profileId may not exist:', profileId);
        toast({ 
          title: 'Approval Failed', 
          description: 'Profile not found or no changes made',
          variant: 'destructive' 
        });
      } else {
        console.log(' Successfully updated profile:', data[0]);
        toast({ title: 'Venue approved!' });
        
        // Refresh data to ensure UI is up to date
        console.log(' Refreshing data after approval...');
        await Promise.all([
          fetchPendingRequests(),
          fetchUnverifiedVenues()
        ]);
        console.log(' Data refresh completed');
        
        // Force UI update by re-rendering
        setTimeout(() => {
          console.log(' Forcing UI re-render...');
          window.location.reload();
        }, 1000); // 1 second delay to show success message
      }
    } catch (err) {
      console.error(' Unexpected error during approval:', err);
      toast({ 
        title: 'Approval Error', 
        description: 'An unexpected error occurred',
        variant: 'destructive' 
      });
    }
    
    setLoading(false);
  };

  const rejectVenue = async (profileId: string) => {
    console.log(' Rejecting profile with ID:', profileId);
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ is_verified: false, verification_status: 'rejected' })
        .eq('id', profileId)
        .select(); //  return updated data for verification
      
      console.log(' Reject update result:', { data, error });
      
      if (error) {
        console.error(' Database reject error:', error);
        toast({ title: 'Failed to reject', description: error.message, variant: 'destructive' });
      } else if (!data || data.length === 0) {
        console.error(' No records updated during reject - profileId may not exist:', profileId);
        toast({ 
          title: 'Rejection Failed', 
          description: 'Profile not found or no changes made',
          variant: 'destructive' 
        });
      } else {
        console.log(' Successfully rejected profile:', data[0]);
        toast({ title: 'Venue rejected.' });
        
        // Refresh data to ensure UI is up to date
        console.log(' Refreshing data after rejection...');
        await Promise.all([
          fetchPendingRequests(),
          fetchUnverifiedVenues()
        ]);
        console.log(' Data refresh completed');
        
        // Force UI update by re-rendering
        setTimeout(() => {
          console.log(' Forcing UI re-render...');
          window.location.reload();
        }, 1000); // 1 second delay to show success message
      }
    } catch (err) {
      console.error(' Unexpected error during rejection:', err);
      toast({ 
        title: 'Rejection Error', 
        description: 'An unexpected error occurred',
        variant: 'destructive' 
      });
    }
    
    setLoading(false);
  };

  const toggleExpanded = (profileId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(profileId)) {
        newSet.delete(profileId);
      } else {
        newSet.add(profileId);
      }
      return newSet;
    });
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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Admin: Verification Requests</h1>
        </div>

        {pendingRequests.length === 0 && unverifiedVenues.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">No pending requests or unverified venues.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {pendingRequests.length > 0 && (
              <>
                <h2 className="text-lg font-bold mb-4">Pending Verification Requests</h2>
                {pendingRequests.map((profile) => (
                  <Card key={profile.id}>
                    <CardHeader 
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleExpanded(profile.id)}
                    >
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {profile.full_name}
                          <span className="text-sm font-normal text-gray-500">
                            ({profile.role === 'musician' ? 'Musician' : 'Venue'})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-normal text-yellow-600">{profile.verification_status}</span>
                          {expandedItems.has(profile.id) ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </CardTitle>
                    </CardHeader>
                    {expandedItems.has(profile.id) && (
                      <CardContent className="space-y-4">
                      {profile.verification_docs && (
                        <div className="space-y-4">
                          {profile.role === 'musician' && (
                            <>
                              <p className="text-sm font-medium flex items-center gap-1">
                                <Camera className="w-4 h-4" /> ID Card Photo
                              </p>
                              {profile.verification_docs.id_card_photo && (
                                <a href={profile.verification_docs.id_card_photo} target="_blank" rel="noopener noreferrer">
                                  <img
                                    src={profile.verification_docs.id_card_photo}
                                    alt="ID Card"
                                    className="w-32 h-32 rounded border object-cover"
                                  />
                                </a>
                              )}
                              <p className="text-sm font-medium flex items-center gap-1">
                                <Camera className="w-4 h-4" /> Selfie with ID
                              </p>
                              {profile.verification_docs.selfie_with_id && (
                                <a href={profile.verification_docs.selfie_with_id} target="_blank" rel="noopener noreferrer">
                                  <img
                                    src={profile.verification_docs.selfie_with_id}
                                    alt="Selfie with ID"
                                    className="w-32 h-32 rounded border object-cover"
                                  />
                                </a>
                              )}
                              <p className="text-sm font-medium flex items-center gap-1">
                                <Globe className="w-4 h-4" /> Portfolio Link
                              </p>
                              {profile.verification_docs.portfolio_link && (
                                <a href={profile.verification_docs.portfolio_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm">
                                  {profile.verification_docs.portfolio_link}
                                </a>
                              )}
                            </>
                          )}
                          
                          {profile.role === 'venue' && (
                            <>
                              <p className="text-sm font-medium flex items-center gap-1">
                                <FileText className="w-4 h-4" /> Business License
                              </p>
                              {profile.verification_docs.business_license && (
                                <a href={profile.verification_docs.business_license} target="_blank" rel="noopener noreferrer">
                                  <img
                                    src={profile.verification_docs.business_license}
                                    alt="Business License"
                                    className="w-32 h-32 rounded border object-cover"
                                  />
                                </a>
                              )}
                              <p className="text-sm font-medium flex items-center gap-1">
                                <FileText className="w-4 h-4" /> Utility Bill
                              </p>
                              {profile.verification_docs.utility_bill && (
                                <a href={profile.verification_docs.utility_bill} target="_blank" rel="noopener noreferrer">
                                  <img
                                    src={profile.verification_docs.utility_bill}
                                    alt="Utility Bill"
                                    className="w-32 h-32 rounded border object-cover"
                                  />
                                </a>
                              )}
                              <p className="text-sm font-medium flex items-center gap-1">
                                <Camera className="w-4 h-4" /> Selfie with Shop Sign
                              </p>
                              {profile.verification_docs.selfie_with_shop_sign && (
                                <a href={profile.verification_docs.selfie_with_shop_sign} target="_blank" rel="noopener noreferrer">
                                  <img
                                    src={profile.verification_docs.selfie_with_shop_sign}
                                    alt="Selfie with Shop Sign"
                                    className="w-32 h-32 rounded border object-cover"
                                  />
                                </a>
                              )}
                              <p className="text-sm font-medium flex items-center gap-1">
                                <Camera className="w-4 h-4" /> Owner Selfie with ID
                              </p>
                              {profile.verification_docs.owner_selfie_with_id && (
                                <a href={profile.verification_docs.owner_selfie_with_id} target="_blank" rel="noopener noreferrer">
                                  <img
                                    src={profile.verification_docs.owner_selfie_with_id}
                                    alt="Owner Selfie with ID"
                                    className="w-32 h-32 rounded border object-cover"
                                  />
                                </a>
                              )}
                              <p className="text-sm font-medium flex items-center gap-1">
                                <Phone className="w-4 h-4" /> Official Phone
                              </p>
                              <p className="text-sm text-gray-600">
                                {profile.verification_docs.official_phone || 'Not provided'}
                              </p>
                              {profile.verification_docs.social_media_link && (
                                <>
                                  <p className="text-sm font-medium flex items-center gap-1">
                                    <Globe className="w-4 h-4" /> Social Media Link
                                  </p>
                                  <a href={profile.verification_docs.social_media_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm">
                                    {profile.verification_docs.social_media_link}
                                  </a>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button onClick={() => {
                          console.log(' Approve button clicked for profile:', profile);
                          approveVenue(profile.id);
                        }} disabled={loading} className="flex-1">
                          <Check className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button onClick={() => {
                          console.log(' Reject button clicked for profile:', profile);
                          rejectVenue(profile.id);
                        }} disabled={loading} variant="destructive" className="flex-1">
                          <X className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                    )}
                  </Card>
                ))}
              </>
            )}
            {unverifiedVenues.length > 0 && (
              <>
                <h2 className="text-lg font-bold mb-4">Unverified Venues</h2>
                {unverifiedVenues.map((profile) => (
                  <Card key={profile.id}>
                    <CardHeader 
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleExpanded(profile.id)}
                    >
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {profile.full_name}
                          <span className="text-sm font-normal text-gray-500">Venue</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-normal text-red-600">Not Verified</span>
                          {expandedItems.has(profile.id) ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </CardTitle>
                    </CardHeader>
                    {expandedItems.has(profile.id) && (
                      <CardContent className="space-y-4">
                        <p className="text-sm text-gray-600 mb-2">Role: Venue</p>
                        <Button onClick={() => {
                          console.log(' Unverified venue approve button clicked for profile:', profile);
                          approveVenue(profile.id);
                        }} disabled={loading} className="w-full">
                          <Check className="w-4 h-4 mr-2" />
                          Approve Venue
                        </Button>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminVerificationPanel;
