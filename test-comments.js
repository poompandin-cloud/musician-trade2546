// Test script สำหรับทดสอบระบบคอมเมนต์
// รันใน browser console

function testComments() {
  console.log('💬 Testing comments system...');
  
  // 1. ตรวจสอบว่ามี component ProfileComments หรือไม่
  console.log('🔍 Checking ProfileComments component...');
  const commentsSection = document.querySelector('[data-testid="profile-comments"]');
  if (commentsSection) {
    console.log('✅ ProfileComments component found');
  } else {
    console.log('❌ ProfileComments component not found');
  }
  
  // 2. ตรวจสอบว่า user login อยู่หรือไม่
  console.log('👤 Checking user login status...');
  const loginButton = document.querySelector('button:has([data-testid="login-button"])');
  const commentInput = document.querySelector('textarea[placeholder*="คอมเมนต์"]');
  
  if (commentInput) {
    console.log('✅ User is logged in (can see comment input)');
  } else if (loginButton) {
    console.log('❌ User is not logged in (showing login button)');
  } else {
    console.log('❌ Cannot determine login status');
  }
  
  // 3. ทดสอบการเพิ่มคอมเมนต์ (ถ้า login อยู่)
  if (commentInput) {
    console.log('🧪 Testing comment submission...');
    
    // ตั้งค่าข้อความทดสอบ
    const testComment = 'ทดสอบคอมเมนต์ภาษาไทย สวัสดีครับ! 🎵';
    commentInput.value = testComment;
    commentInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    console.log('📝 Test comment set:', testComment);
    
    // หาปุ่มส่ง
    const submitButton = document.querySelector('button:has([data-testid="submit-comment"])');
    if (submitButton) {
      console.log('🔘 Submit button found, checking state...');
      console.log('🔘 Button disabled:', submitButton.disabled);
      
      if (!submitButton.disabled) {
        console.log('🖱️ Attempting to submit test comment...');
        // ถ้าต้องการทดสอบจริง ให้ uncomment บรรทัดด้านล่าง
        // submitButton.click();
        console.log('⚠️ Manual click required to actually submit comment');
      }
    } else {
      console.log('❌ Submit button not found');
    }
  }
  
  // 4. ตรวจสอบคอมเมนต์ที่มีอยู่
  console.log('📋 Checking existing comments...');
  const commentElements = document.querySelectorAll('[data-testid="comment-item"]');
  console.log('📋 Comments found:', commentElements.length);
  
  commentElements.forEach((comment, index) => {
    const author = comment.querySelector('[data-testid="comment-author"]')?.textContent;
    const content = comment.querySelector('[data-testid="comment-content"]')?.textContent;
    const time = comment.querySelector('[data-testid="comment-time"]')?.textContent;
    
    console.log(`💬 Comment ${index + 1}:`, {
      author: author || 'Unknown',
      content: content?.substring(0, 50) + '...' || 'No content',
      time: time || 'No time'
    });
  });
  
  // 5. ตรวจสอบการเชื่อมต่อกับ Supabase
  console.log('🔗 Testing Supabase connection...');
  
  // ตรวจสอบว่ามีการ import supabase หรือไม่ (จาก window object)
  if (typeof window !== 'undefined' && window.supabase) {
    console.log('✅ Supabase client available');
    
    // ทดสอบการดึงข้อมูลคอมเมนต์
    window.supabase
      .from('profile_comments')
      .select('count')
      .then(({ data, error }) => {
        if (error) {
          console.log('❌ Supabase connection error:', error);
        } else {
          console.log('✅ Supabase connection working, total comments:', data?.[0]?.count || 0);
        }
      });
  } else {
    console.log('❌ Supabase client not available in window');
  }
  
  // 6. ตรวจสอบ profile ID
  console.log('🆔 Checking profile ID...');
  const urlParams = new URLSearchParams(window.location.search);
  const profileId = urlParams.get('id');
  console.log('🆔 Profile ID from URL:', profileId);
  
  // 7. ตรวจสอบ UI elements
  console.log('🎨 Checking UI elements...');
  const uiChecks = {
    'Comment card': document.querySelector('.bg-gray-100.rounded-2xl'),
    'Avatar': document.querySelector('.avatar'),
    'Timestamp': document.querySelector('.text-gray-500.text-xs'),
    'Delete button': document.querySelector('button:has([data-testid="delete-comment"])'),
    'Load more button': document.querySelector('button:contains("โหลดคอมเมนต์เพิ่มเติม")')
  };
  
  Object.entries(uiChecks).forEach(([name, element]) => {
    console.log(`🎨 ${name}:`, element ? '✅ Found' : '❌ Not found');
  });
  
  console.log('💬 Comments system test completed!');
}

// รันการทดสอบ
testComments();

// Export สำหรับใช้งาน
if (typeof window !== 'undefined') {
  window.testComments = testComments;
}
