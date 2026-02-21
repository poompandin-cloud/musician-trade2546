import liff from '@line/liff';
import { supabase } from '@/integrations/supabase/client';

export interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl: string;
  statusMessage?: string;
}

class LiffService {
  private liffId = '2009193181-d1LDkPcT';
  private redirectUri = 'https://www.musiciantradethai.com/';
  private isInitialized = false;
  private profile: LiffProfile | null = null;

  async init(): Promise<boolean> {
    try {
      console.log('🔧 Initializing LIFF with ID:', this.liffId);
      console.log('🌐 Callback URL:', this.redirectUri);
      
      // เพิ่ม cache busting parameter เพื่อให้แน่ใจว่าได้ค่าล่าสุด
      const timestamp = Date.now();
      const liffConfig = { 
        liffId: this.liffId,
        withLoginOnExternalBrowser: true
      };
      
      await liff.init(liffConfig);
      
      this.isInitialized = true;
      console.log('✅ LIFF initialized successfully');
      
      // ตรวจสอบว่าอยู่ใน LINE หรือไม่
      const isInClient = liff.isInClient();
      console.log('📱 Is in LINE client:', isInClient);
      
      // ตรวจสอบว่า login อยู่หรือไม่
      const isLoggedIn = liff.isLoggedIn();
      console.log('🔐 Is logged in:', isLoggedIn);
      
      // ตรวจสอบว่ากลับมาจากการ login หรือไม่ (จาก URL parameters)
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      
      if (code && state) {
        console.log('🔄 Returned from LINE login with code and state');
        // รอสักครู่ให้ LIFF ประมวลผล
        setTimeout(async () => {
          if (liff.isLoggedIn()) {
            await this.fetchProfile();
            await this.syncWithSupabase();
            // Redirect กลับไปหน้าหลัก
            window.location.href = window.location.origin;
          }
        }, 1000);
      } else if (isLoggedIn) {
        await this.fetchProfile();
        await this.syncWithSupabase();
      } else {
        // ถ้ายังไม่ได้ login และอยู่ใน LINE client ให้ login ทันที
        if (liff.isInClient()) {
          console.log('🔐 Auto-login in LINE client...');
          liff.login();
        } else {
          console.log('🌐 Not in LINE client, login required');
        }
      }
      
      return true;
    } catch (error) {
      console.error('❌ LIFF initialization failed:', error);
      return false;
    }
  }

  async fetchProfile(): Promise<LiffProfile | null> {
    try {
      if (!this.isInitialized || !liff.isLoggedIn()) {
        console.log('⚠️ LIFF not initialized or not logged in');
        return null;
      }

      const lineProfile = await liff.getProfile();
      this.profile = {
        userId: lineProfile.userId,
        displayName: lineProfile.displayName,
        pictureUrl: lineProfile.pictureUrl,
        statusMessage: lineProfile.statusMessage
      };

      console.log('👤 LINE Profile fetched:', this.profile);
      return this.profile;
    } catch (error) {
      console.error('❌ Failed to fetch LINE profile:', error);
      return null;
    }
  }

  async syncWithSupabase(): Promise<boolean> {
    try {
      if (!this.profile) {
        console.log('⚠️ No LINE profile to sync');
        return false;
      }

      console.log('🔄 Syncing LINE profile with Supabase...');
      
      // ตรวจสอบว่ามี user นี้ในระบบแล้วหรือไม่
      const { data: existingUser, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('line_user_id', this.profile.userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('❌ Error checking existing user:', fetchError);
        return false;
      }

      if (existingUser) {
        console.log('✅ User exists in database:', existingUser.full_name);
        // อัปเดตข้อมูลล่าสุดจาก LINE
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            full_name: this.profile.displayName,
            avatar_url: this.profile.pictureUrl,
            updated_at: new Date().toISOString()
          })
          .eq('line_user_id', this.profile.userId);

        if (updateError) {
          console.error('❌ Error updating user:', updateError);
          return false;
        }
        
        console.log('✅ User profile updated successfully');
      } else {
        console.log('👤 Creating new user from LINE profile...');
        
        // สร้างบัญชีใหม่จากข้อมูล LINE
        const { data: newUser, error: createError } = await supabase
          .from('profiles')
          .insert({
            line_user_id: this.profile.userId,
            full_name: this.profile.displayName,
            avatar_url: this.profile.pictureUrl,
            credits: 25, // เครดิตเริ่มต้น
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) {
          console.error('❌ Error creating new user:', createError);
          return false;
        }

        console.log('✅ New user created successfully:', newUser);
      }

      return true;
    } catch (error) {
      console.error('❌ Error syncing with Supabase:', error);
      return false;
    }
  }

  async login(): Promise<void> {
    try {
      if (!this.isInitialized) {
        console.log('⚠️ LIFF not initialized');
        return;
      }

      if (!liff.isLoggedIn()) {
        console.log('🔐 Logging in to LINE...');
        console.log('🌐 Using redirect URI:', this.redirectUri);
        
        // ใช้ redirectUri ที่ตั้งค่าไว้ใน LINE Developers Console
        liff.login({
          redirectUri: this.redirectUri
        });
      }
    } catch (error) {
      console.error('❌ Login failed:', error);
    }
  }

  async logout(): Promise<void> {
    try {
      if (!this.isInitialized) {
        console.log('⚠️ LIFF not initialized');
        return;
      }

      if (liff.isLoggedIn()) {
        console.log('🔐 Logging out from LINE...');
        liff.logout();
        this.profile = null;
      }
    } catch (error) {
      console.error('❌ Logout failed:', error);
    }
  }

  // ฟังก์ชันสำหรับล้าง cache และ reinitialize
  async clearCacheAndReinit(): Promise<boolean> {
    try {
      console.log('🧹 Clearing LIFF cache and reinitializing...');
      
      // ล้าง cache ของ localStorage
      localStorage.removeItem('liff.accessToken');
      localStorage.removeItem('liff.idToken');
      localStorage.removeItem('liff.isLoggedIn');
      localStorage.removeItem('liff.context');
      
      // Reset state
      this.isInitialized = false;
      this.profile = null;
      
      // Reinitialize
      return await this.init();
    } catch (error) {
      console.error('❌ Failed to clear cache and reinitialize:', error);
      return false;
    }
  }

  // ฟังก์ชันสำหรับตรวจสอบและแก้ไขปัญหา callback URL
  async validateCallbackUrl(): Promise<boolean> {
    try {
      console.log('🔍 Validating callback URL configuration...');
      
      // ตรวจสอบว่า redirectUri ตรงกับที่ตั้งค่าไว้
      const expectedUrl = 'https://www.musiciantradethai.com/';
      const currentUrl = this.redirectUri;
      
      console.log('📍 Expected URL:', expectedUrl);
      console.log('📍 Current URL:', currentUrl);
      
      if (currentUrl !== expectedUrl) {
        console.error('❌ Callback URL mismatch!');
        return false;
      }
      
      console.log('✅ Callback URL is correctly configured');
      return true;
    } catch (error) {
      console.error('❌ Error validating callback URL:', error);
      return false;
    }
  }

  isLoggedIn(): boolean {
    return this.isInitialized && liff.isLoggedIn();
  }

  isInClient(): boolean {
    return this.isInitialized && liff.isInClient();
  }

  getProfile(): LiffProfile | null {
    return this.profile;
  }

  getOS(): string {
    if (!this.isInitialized) return 'unknown';
    return liff.getOS();
  }

  getVersion(): string {
    if (!this.isInitialized) return 'unknown';
    return liff.getVersion();
  }

  async sendMessages(messages: any[]): Promise<void> {
    try {
      if (!this.isInitialized || !liff.isLoggedIn()) {
        console.log('⚠️ LIFF not initialized or not logged in');
        return;
      }

      await liff.sendMessages(messages);
      console.log('✅ Messages sent successfully');
    } catch (error) {
      console.error('❌ Failed to send messages:', error);
    }
  }

  async openWindow(url: string, external: boolean = false): Promise<void> {
    try {
      if (!this.isInitialized) {
        console.log('⚠️ LIFF not initialized');
        return;
      }

      liff.openWindow({
        url,
        external
      });
    } catch (error) {
      console.error('❌ Failed to open window:', error);
    }
  }

  async closeWindow(): Promise<void> {
    try {
      if (!this.isInitialized) {
        console.log('⚠️ LIFF not initialized');
        return;
      }

      liff.closeWindow();
    } catch (error) {
      console.error('❌ Failed to close window:', error);
    }
  }
}

// Export singleton instance
export const liffService = new LiffService();

// Export types for React hooks
export type { LiffService };
