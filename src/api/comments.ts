import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/integrations/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const { profile_id, content } = await request.json();
    
    if (!profile_id || !content?.trim()) {
      return NextResponse.json({ error: 'Profile ID and content are required' }, { status: 400 });
    }

    // ดึง IP Address จาก request headers
    const getIpAddress = (req: NextRequest): string => {
      // ลองดึงจาก x-forwarded-for ก่อน (สำหรับ reverse proxy อย่าง Vercel, Cloudflare)
      const forwardedFor = req.headers.get('x-forwarded-for');
      if (forwardedFor) {
        // x-forwarded-for อาจมีหลาย IP เช่น "client, proxy1, proxy2"
        // เราจะเอา IP แรก (client IP)
        return forwardedFor.split(',')[0].trim();
      }
      
      // ลองดึงจาก x-real-ip (สำหรับ nginx หรือ reverse proxy อื่นๆ)
      const realIp = req.headers.get('x-real-ip');
      if (realIp) {
        return realIp.trim();
      }
      
      // ลองดึงจาก cf-connecting-ip (Cloudflare)
      const cfIp = req.headers.get('cf-connecting-ip');
      if (cfIp) {
        return cfIp.trim();
      }
      
      // ถ้าไม่มี header พิเศษ ให้ใช้ค่า fallback
      // NextRequest ไม่มี .ip property โดยตรง ใช้ค่า fallback แทน
      return 'unknown';
    };

    const authorIp = getIpAddress(request);
    
    // สร้าง Supabase client
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
    );

    // ดึง user session จาก header หรือ cookie
    const authHeader = request.headers.get('authorization');
    let userId = null;
    
    if (authHeader) {
      const { data: { user }, error: authError } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      );
      
      if (!authError && user) {
        userId = user.id;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ตรวจสอบ spam protection: สูงสุด 3 คอมเมนต์ใน 1 นาที
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { data: recentComments, error: spamError } = await supabase
      .from('profile_comments')
      .select('id')
      .eq('author_id', userId)
      .gte('created_at', oneMinuteAgo);

    if (spamError) {
      console.error('Error checking spam:', spamError);
    } else if (recentComments && recentComments.length >= 3) {
      return NextResponse.json({ 
        error: 'Too many comments. Please wait a moment before posting again.',
        code: 'RATE_LIMIT_EXCEEDED'
      }, { status: 429 });
    }

    // สร้างคอมเมนต์ใหม่พร้อม IP Address
    console.debug('Inserting comment with IP:', authorIp);
    console.debug('User ID from auth:', userId);
    console.debug('Profile ID target:', profile_id);
    
    const { data: comment, error: insertError } = await supabase
      .from('profile_comments')
      .insert({
        profile_id: profile_id,
        author_id: userId,
        content: content.trim(),
        author_ip: authorIp || 'unknown', // เพิ่ม IP Address พร้อม fallback
      })
      .select(`
        id,
        profile_id,
        author_id,
        content,
        created_at,
        updated_at,
        author:profiles!author_id (
          full_name,
          avatar_url
        )
      `)
      .single();

    console.debug('Insert result:', { comment, insertError });
    console.debug('Insert error details:', {
      message: insertError?.message,
      details: insertError?.details,
      hint: insertError?.hint,
      code: insertError?.code
    });

    if (insertError) {
      console.error('Error inserting comment:', insertError);
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
    }

    // ส่งข้อมูลคอมเมนต์กลับไป (ใช้ข้อมูลจาก comment ตรงๆ เพื่อป้องกันปัญหา view)
    console.debug('Returning comment data directly (bypassing public_comments view)');
    
    return NextResponse.json({ 
      success: true, 
      comment: {
        id: comment.id,
        profile_id: comment.profile_id,
        author_id: comment.author_id,
        content: comment.content,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        author: comment.author
      },
      message: 'Comment created successfully'
    });

  } catch (error) {
    console.error('Error in comment creation:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// GET endpoint สำหรับ Admin ในการดู IP Address
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('comment_id');
    const profileId = searchParams.get('profile_id');

    if (!commentId && !profileId) {
      return NextResponse.json({ 
        error: 'Either comment_id or profile_id is required' 
      }, { status: 400 });
    }

    // สร้าง Supabase client
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

    // ตรวจสอบว่าเป็น Admin หรือไม่
    const { data: adminCheck, error: adminError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminError || !adminCheck || adminCheck.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Admin access required' 
      }, { status: 403 });
    }

    let result;

    if (commentId) {
      // ดู IP ของคอมเมนต์เดียว
      const { data, error } = await supabase
        .rpc('admin_get_comment_with_ip', { comment_id: commentId });
      
      if (error) throw error;
      result = data;
    } else if (profileId) {
      // ดู IP ของคอมเมนต์ทั้งหมดในโปรไฟล์
      const { data, error } = await supabase
        .rpc('admin_get_profile_comments_with_ip', { profile_uuid: profileId });
      
      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ 
      success: true, 
      data: result 
    });

  } catch (error) {
    console.error('Error in admin comment access:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
