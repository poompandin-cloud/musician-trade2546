import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { lineUserId } = await request.json();
    
    if (!lineUserId) {
      return Response.json({ error: 'LINE User ID is required' }, { status: 400 });
    }
    
    // ดึง user session จาก header หรือ cookie
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // สร้าง Supabase client
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
    );
    
    // ตรวจสอบ user token
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (authError || !user) {
      return Response.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // อัปเดต line_user_id ในตาราง profiles
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ line_user_id: lineUserId })
      .eq('id', user.id);
    
    if (updateError) {
      console.error('Error updating LINE User ID:', updateError);
      return Response.json({ error: 'Failed to update LINE User ID' }, { status: 500 });
    }
    
    return Response.json({ 
      success: true, 
      message: 'LINE User ID updated successfully' 
    });
    
  } catch (error) {
    console.error('Error in update-line-user-id API:', error);
    return Response.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
