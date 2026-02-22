import { useState, useEffect } from 'react';
import { liffService, LiffProfile } from '@/services/liffService';

export interface UseLiffReturn {
  isInitialized: boolean;
  isLoggedIn: boolean;
  isInClient: boolean;
  isExternalBrowser: boolean;
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
  clearCacheAndReinit: () => Promise<boolean>;
  validateCallbackUrl: () => Promise<boolean>;
  skipLiffAndUseNormalLogin: () => void;
}

export const useLiff = (): UseLiffReturn => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isInClient, setIsInClient] = useState(false);
  const [isExternalBrowser, setIsExternalBrowser] = useState(false);
  const [profile, setProfile] = useState<LiffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeLiff = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🔧 Initializing LIFF in useLiff hook...');
        
        // ตรวจสอบว่าเป็น External Browser หรือไม่ก่อน
        const isExternal = liffService.isExternalBrowser();
        setIsExternalBrowser(isExternal);
        
        if (isExternal) {
          console.log('🌐 Detected external browser - skipping LIFF initialization');
          console.log('🔄 Will use normal web login system');
          setIsInitialized(false);
          setIsLoggedIn(false);
          setIsInClient(false);
          setProfile(null);
          setLoading(false);
          return;
        }
        
        // ตรวจสอบ callback URL ก่อน initialize
        const isValidUrl = await liffService.validateCallbackUrl();
        if (!isValidUrl) {
          setError('Callback URL configuration error');
          return;
        }
        
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

  // เพิ่มฟังก์ชันสำหรับ clear cache
  const clearCacheAndReinit = async (): Promise<boolean> => {
    return await liffService.clearCacheAndReinit();
  };

  // เพิ่มฟังก์ชันสำหรับ validate callback URL
  const validateCallbackUrl = async (): Promise<boolean> => {
    return await liffService.validateCallbackUrl();
  };

  // เพิ่มฟังก์ชันสำหรับข้าม LIFF และใช้ระบบปกติ
  const skipLiffAndUseNormalLogin = (): void => {
    liffService.skipLiffAndUseNormalLogin();
    setIsInitialized(false);
    setIsLoggedIn(false);
    setIsInClient(false);
    setProfile(null);
    setError(null);
  };

  return {
    isInitialized,
    isLoggedIn,
    isInClient,
    isExternalBrowser,
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
    clearCacheAndReinit,
    validateCallbackUrl,
    skipLiffAndUseNormalLogin,
  };
};
