import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { code } = await request.json();
    
    if (!code) {
      return Response.json({ error: 'Authorization code is required' }, { status: 400 });
    }
    
    // สร้าง Supabase client เพื่อตรวจสอบ session
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
    );
    
    // แลกเปลี่ยน authorization code กับ access token
    const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: `${window.location.origin}/line-callback`,
        client_id: import.meta.env.VITE_LINE_CLIENT_ID,
        client_secret: import.meta.env.VITE_LINE_CLIENT_SECRET,
      }),
    });
    
    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      console.error('LINE Token Error:', tokenData);
      return Response.json({ 
        error: 'Failed to exchange authorization code' 
      }, { status: 400 });
    }
    
    // ดึง user profile จาก LINE
    const profileResponse = await fetch('https://api.line.me/oauth2/v2.1/userinfo', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });
    
    const profileData = await profileResponse.json();
    
    if (!profileResponse.ok) {
      console.error('LINE Profile Error:', profileData);
      return Response.json({ 
        error: 'Failed to get user profile' 
      }, { status: 400 });
    }
    
    // ส่งคืน LINE User ID
    return Response.json({ 
      lineUserId: profileData.userId,
      displayName: profileData.displayName,
      pictureUrl: profileData.pictureUrl
    });
    
  } catch (error) {
    console.error('Error in line-token-exchange API:', error);
    return Response.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
