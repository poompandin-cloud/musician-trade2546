import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/integrations/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const { profile_id, session_id, visitor_id } = await request.json();
    
    if (!profile_id) {
      return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 });
    }

    // ดึงข้อมูลจาก request
    const getVisitorData = (req: NextRequest) => {
      // ดึง IP Address
      const getIpAddress = (): string => {
        const forwardedFor = req.headers.get('x-forwarded-for');
        if (forwardedFor) {
          return forwardedFor.split(',')[0].trim();
        }
        
        const realIp = req.headers.get('x-real-ip');
        if (realIp) {
          return realIp.trim();
        }
        
        const cfIp = req.headers.get('cf-connecting-ip');
        if (cfIp) {
          return cfIp.trim();
        }
        
        return 'unknown';
      };

      // ดึง User Agent
      const userAgent = req.headers.get('user-agent') || 'unknown';
      
      // ดึง Referrer
      const referrer = req.headers.get('referer') || null;
      
      // ดึง Landing Page
      const landingPage = req.headers.get('x-landing-page') || req.url;

      return {
        visitor_ip: getIpAddress(),
        user_agent: userAgent,
        referrer: referrer,
        landing_page: landingPage,
      };
    };

    const visitorData = getVisitorData(request);
    
    // สร้าง Supabase client
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
    );

    // สร้าง visitor log ใหม่
    const { data, error } = await supabase
      .from('visitor_logs')
      .insert({
        profile_id: profile_id,
        ...visitorData,
        visitor_id: visitor_id || null,
        session_id: session_id || null,
      })
      .select('id, created_at')
      .single();

    if (error) {
      console.error('Error creating visitor log:', error);
      // ไม่ต้อง return error เพราะเป็น background process
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to log visit' 
      }, { status: 200 }); // Return 200 เพื่อไม่ให้กระทบ UX
    }

    return NextResponse.json({ 
      success: true, 
      log_id: data.id,
      message: 'Visit logged successfully'
    });

  } catch (error) {
    console.error('Error in visitor logging:', error);
    // เสมอ return success สำหรับ background process
    return NextResponse.json({ 
      success: false, 
      message: 'Background logging failed' 
    }, { status: 200 });
  }
}

// PUT endpoint สำหรับอัปเดตข้อมูลการเข้าชม (duration, bounce)
export async function PUT(request: NextRequest) {
  try {
    const { log_id, visit_duration_seconds, is_bounce } = await request.json();
    
    if (!log_id) {
      return NextResponse.json({ error: 'Log ID is required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
    );

    // อัปเดตข้อมูลการเข้าชม
    const { data, error } = await supabase
      .from('visitor_logs')
      .update({
        visit_duration_seconds: visit_duration_seconds || 0,
        is_bounce: is_bounce || false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', log_id)
      .select('id')
      .single();

    if (error) {
      console.error('Error updating visitor log:', error);
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to update visit' 
      }, { status: 200 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Visit updated successfully'
    });

  } catch (error) {
    console.error('Error in visitor update:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Background update failed' 
    }, { status: 200 });
  }
}

// GET endpoint สำหรับ Admin ในการดู visitor logs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profile_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!profileId) {
      return NextResponse.json({ 
        error: 'Profile ID is required' 
      }, { status: 400 });
    }

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
    );

    // ดึง user session
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // ตรวจสอบว่าเป็น Admin หรือเจ้าของโปรไฟล์
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', profileId)
      .single();

    const isAdmin = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .eq('role', 'admin')
      .single();

    const isOwner = profile?.id === user.id;

    if (!isAdmin.data && !isOwner) {
      return NextResponse.json({ 
        error: 'Access denied' 
      }, { status: 403 });
    }

    let result;

    if (isAdmin.data) {
      // Admin ดูข้อมูลพร้อม IP
      const { data, error } = await supabase
        .rpc('admin_get_visitor_logs_with_ip', { 
          profile_uuid: profileId,
          limit_count: limit,
          offset_count: offset
        });
      
      if (error) throw error;
      result = data;
    } else {
      // เจ้าของโปรไฟล์ดูข้อมูลไม่รวม IP
      const { data, error } = await supabase
        .from('public_visitor_logs')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ 
      success: true, 
      data: result 
    });

  } catch (error) {
    console.error('Error in visitor logs access:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
