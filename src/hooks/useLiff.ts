import { useState, useEffect } from 'react';
import { liffService, LiffProfile } from '@/services/liffService';

export interface UseLiffReturn {
  isInitialized: boolean;
  isLoggedIn: boolean;
  isInClient: boolean;
  profile: LiffProfile | null;
  loading: boolean;
  error: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  sendMessages: (messages: any[]) => Promise<void>;
  openWindow: (url: string, external?: boolean) => Promise<void>;
  closeWindow: () => Promise<void>;
  getOS: () => string;
  getVersion: () => string;
}

export const useLiff = (): UseLiffReturn => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isInClient, setIsInClient] = useState(false);
  const [profile, setProfile] = useState<LiffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeLiff = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🔧 Initializing LIFF in useLiff hook...');
        const success = await liffService.init();
        
        if (success) {
          setIsInitialized(true);
          setIsLoggedIn(liffService.isLoggedIn());
          setIsInClient(liffService.isInClient());
          setProfile(liffService.getProfile());
          
          console.log('✅ LIFF initialized in hook');
          console.log('📱 Is logged in:', liffService.isLoggedIn());
          console.log('📱 Is in client:', liffService.isInClient());
          
          const profile = liffService.getProfile();
          if (profile) {
            console.log('👤 Profile in hook:', profile);
            setProfile(profile);
          }
        } else {
          setError('Failed to initialize LIFF');
        }
      } catch (err) {
        console.error('❌ LIFF initialization error in hook:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    initializeLiff();
  }, []);

  const login = async (): Promise<void> => {
    try {
      await liffService.login();
      setIsLoggedIn(true);
      setProfile(liffService.getProfile());
    } catch (err) {
      console.error('❌ Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await liffService.logout();
      setIsLoggedIn(false);
      setProfile(null);
    } catch (err) {
      console.error('❌ Logout error:', err);
      setError(err instanceof Error ? err.message : 'Logout failed');
    }
  };

  const sendMessages = async (messages: any[]): Promise<void> => {
    try {
      await liffService.sendMessages(messages);
    } catch (err) {
      console.error('❌ Send messages error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send messages');
    }
  };

  const openWindow = async (url: string, external: boolean = false): Promise<void> => {
    try {
      await liffService.openWindow(url, external);
    } catch (err) {
      console.error('❌ Open window error:', err);
      setError(err instanceof Error ? err.message : 'Failed to open window');
    }
  };

  const closeWindow = async (): Promise<void> => {
    try {
      await liffService.closeWindow();
    } catch (err) {
      console.error('❌ Close window error:', err);
      setError(err instanceof Error ? err.message : 'Failed to close window');
    }
  };

  const getOS = (): string => {
    return liffService.getOS();
  };

  const getVersion = (): string => {
    return liffService.getVersion();
  };

  return {
    isInitialized,
    isLoggedIn,
    isInClient,
    profile,
    loading,
    error,
    login,
    logout,
    sendMessages,
    openWindow,
    closeWindow,
    getOS,
    getVersion,
  };
};
