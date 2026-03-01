import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { jobData } = await request.json();
    
    if (!jobData) {
      return Response.json({ error: 'Job data is required' }, { status: 400 });
    }
    
    // สร้าง Supabase client
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
    );
    
    // ดึงรายชื่อ line_user_id ทั้งหมดที่เชื่อมต่อ LINE ไว้
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('line_user_id, full_name')
      .not('line_user_id', 'is', null)
      .not('line_user_id', 'eq', '');
    
    if (profilesError) {
      console.error('Error fetching LINE user IDs:', profilesError);
      return Response.json({ error: 'Failed to fetch LINE user IDs' }, { status: 500 });
    }
    
    if (!profiles || profiles.length === 0) {
      console.log('No LINE users found to notify');
      return Response.json({ success: true, message: 'No LINE users to notify' });
    }
    
    // สร้าง Flex Message สำหรับแจ้งเตือนงานใหม่
    const flexMessage = {
      type: 'flex',
      altText: `🎵 งานใหม่: ${jobData.instrument} ที่ ${jobData.venue}`,
      contents: {
        type: 'bubble',
        styles: {
          header: {
            backgroundColor: '#FF6B35',
            color: '#FFFFFF',
            size: 'lg'
          },
          hero: {
            backgroundColor: '#F8F9FA'
          },
          body: {
            backgroundColor: '#FFFFFF'
          },
          footer: {
            backgroundColor: '#F8F9FA'
          }
        },
        header: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '🎵 งานใหม่!',
              weight: 'bold',
              color: '#FFFFFF',
              size: 'xl',
              align: 'center'
            },
            {
              type: 'text',
              text: 'Gig Glide',
              color: '#FFFFFF',
              size: 'sm',
              align: 'center',
              margin: 'md'
            }
          ]
        },
        hero: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: jobData.instrument || 'นักดนตรี',
              weight: 'bold',
              color: '#FF6B35',
              size: 'xxl',
              align: 'center',
              margin: 'lg'
            }
          ]
        },
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: jobData.title || 'หางานดนตรี',
              weight: 'bold',
              size: 'lg',
              margin: 'md'
            },
            {
              type: 'separator',
              margin: 'md'
            },
            {
              type: 'box',
              layout: 'vertical',
              margin: 'md',
              contents: [
                {
                  type: 'box',
                  layout: 'horizontal',
                  contents: [
                    {
                      type: 'text',
                      text: '📍',
                      size: 'sm',
                      flex: 1
                    },
                    {
                      type: 'text',
                      text: `${jobData.venue || '-'} ${jobData.province || ''}`,
                      size: 'sm',
                      flex: 5,
                      wrap: true
                    }
                  ]
                },
                {
                  type: 'box',
                  layout: 'horizontal',
                  margin: 'sm',
                  contents: [
                    {
                      type: 'text',
                      text: '📅',
                      size: 'sm',
                      flex: 1
                    },
                    {
                      type: 'text',
                      text: `${jobData.date || '-'} ${jobData.time || ''}`,
                      size: 'sm',
                      flex: 5,
                      wrap: true
                    }
                  ]
                },
                {
                  type: 'box',
                  layout: 'horizontal',
                  margin: 'sm',
                  contents: [
                    {
                      type: 'text',
                      text: '💰',
                      size: 'sm',
                      flex: 1
                    },
                    {
                      type: 'text',
                      text: jobData.budget || 'ตามตกลง',
                      size: 'sm',
                      flex: 5,
                      weight: 'bold',
                      color: '#FF6B35'
                    }
                  ]
                }
              ]
            }
          ]
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          spacing: 'sm',
          contents: [
            {
              type: 'button',
              action: {
                type: 'uri',
                uri: `${import.meta.env.VITE_APP_URL || 'https://musiciantradethai.com'}/profile#${jobData.id}`,
                label: 'ดูรายละเอียดงาน'
              },
              style: 'primary',
              color: '#FF6B35'
            },
            {
              type: 'button',
              action: {
                type: 'uri',
                uri: import.meta.env.VITE_APP_URL || 'https://musiciantradethai.com',
                label: 'เปิดแอป Gig Glide'
              },
              style: 'secondary'
            }
          ]
        }
      }
    };
    
    // ส่งข้อความไปยังทุกคนที่เชื่อมต่อ LINE
    const lineAccessToken = import.meta.env.VITE_LINE_ACCESS_TOKEN;
    
    if (!lineAccessToken) {
      console.log('LINE Access Token not found - skipping LINE notifications');
      return Response.json({ 
        success: true, 
        message: 'Job created successfully (LINE notifications skipped - no access token)',
        notifiedUsers: 0
      });
    }
    
    const notificationPromises = profiles.map(async (profile) => {
      try {
        const response = await fetch('https://api.line.me/v2/bot/message/push', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${lineAccessToken}`
          },
          body: JSON.stringify({
            to: profile.line_user_id,
            messages: [flexMessage]
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error(`Failed to send LINE notification to ${profile.line_user_id}:`, errorData);
          return { success: false, userId: profile.line_user_id, error: errorData };
        }
        
        console.log(`✅ LINE notification sent to ${profile.line_user_id} (${profile.full_name})`);
        return { success: true, userId: profile.line_user_id };
        
      } catch (error) {
        console.error(`Error sending LINE notification to ${profile.line_user_id}:`, error);
        return { success: false, userId: profile.line_user_id, error: error.message };
      }
    });
    
    const results = await Promise.allSettled(notificationPromises);
    
    const successCount = results.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length;
    
    const failureCount = results.length - successCount;
    
    console.log(`📊 LINE Notification Summary: ${successCount} success, ${failureCount} failed`);
    
    return Response.json({
      success: true,
      message: `Job created and notifications sent`,
      notifiedUsers: successCount,
      failedNotifications: failureCount,
      totalUsers: profiles.length
    });
    
  } catch (error) {
    console.error('Error in job notification system:', error);
    return Response.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
