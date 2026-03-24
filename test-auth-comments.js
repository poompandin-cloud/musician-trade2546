// Test script สำหรับทดสอบการ auth ในระบบคอมเมนต์
// รันใน browser console

function testAuthComments() {
  console.log('🔐 Testing auth in comments system...');
  
  // 1. ตรวจสอบ Supabase auth
  console.log('🔍 Checking Supabase auth...');
  if (typeof window !== 'undefined' && window.supabase) {
    window.supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error) {
        console.log('❌ Auth error:', error);
      } else if (user) {
        console.log('✅ User authenticated:', {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        });
      } else {
        console.log('❌ No user authenticated');
      }
    });
  } else {
    console.log('❌ Supabase client not available');
  }
  
  // 2. ตรวจสอบ currentUserId ใน component
  console.log('👤 Checking currentUserId in component...');
  // ตรวจสอบว่ามีการส่ง currentUserId มาให้ component หรือไม่
  const commentSection = document.querySelector('[data-testid="profile-comments"]');
  if (commentSection) {
    console.log('✅ Comment section found');
    // ตรวจสอบว่าแสดงช่องพิมพ์หรือปุ่ม login
    const commentInput = commentSection.querySelector('textarea[placeholder*="คอมเมนต์"]');
    const loginButton = commentSection.querySelector('button:has([data-testid="login-button"])');
    
    if (commentInput) {
      console.log('✅ Comment input visible (user logged in)');
    } else if (loginButton) {
      console.log('❌ Login button visible (user not logged in)');
    } else {
      console.log('❌ Cannot determine login state');
    }
  } else {
    console.log('❌ Comment section not found');
  }
  
  // 3. ทดสอบการเพิ่มคอมเมนต์ (ถ้า login อยู่)
  const commentInput = document.querySelector('textarea[placeholder*="คอมเมนต์"]');
  if (commentInput) {
    console.log('🧪 Testing comment submission with auth...');
    
    // ตั้งค่าข้อความทดสอบ
    const testComment = 'ทดสอบการ auth ในคอมเมนต์ 🔐';
    commentInput.value = testComment;
    commentInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    console.log('📝 Test comment set:', testComment);
    
    // ตรวจสอบปุ่มส่ง
    const submitButton = document.querySelector('button:has([data-testid="submit-comment"])');
    if (submitButton) {
      console.log('🔘 Submit button found');
      console.log('🔘 Button disabled:', submitButton.disabled);
      
      // ตรวจสอบว่าจะส่ง user ID ที่ถูกต้องหรือไม่
      console.log('🔍 Checking if user ID will be validated...');
      console.log('⚠️ Manual submission required to test auth validation');
    } else {
      console.log('❌ Submit button not found');
    }
  }
  
  // 4. ตรวจสอบคอมเมนต์ที่มีอยู่
  console.log('📋 Checking existing comments and author info...');
  const commentElements = document.querySelectorAll('[data-testid="comment-item"]');
  console.log('📋 Comments found:', commentElements.length);
  
  commentElements.forEach((comment, index) => {
    const author = comment.querySelector('[data-testid="comment-author"]')?.textContent;
    const content = comment.querySelector('[data-testid="comment-content"]')?.textContent;
    const time = comment.querySelector('[data-testid="comment-time"]')?.textContent;
    const avatar = comment.querySelector('[data-testid="comment-avatar"]')?.src;
    
    console.log(`💬 Comment ${index + 1}:`, {
      author: author || 'ผู้ใช้งานทั่วไป', // ควรจะแสดงชื่อสำรอง
      content: content?.substring(0, 50) + '...' || 'No content',
      time: time || 'No time',
      hasAvatar: !!avatar
    });
  });
  
  // 5. ตรวจสอบว่ามีการ join ตาราง profiles หรือไม่
  console.log('🔗 Checking database queries...');
  console.log('📝 Expected behavior:');
  console.log('  - Fetch: SELECT * FROM profile_comments (no join)');
  console.log('  - Insert: Use auth.getUser() to get real user ID');
  console.log('  - Display: Show "ผู้ใช้งานทั่วไป" for all comments');
  
  // 6. ตรวจสอบ error handling
  console.log('⚠️ Error handling check:');
  console.log('  - If not logged in: Show login button');
  console.log('  - If auth fails: Show error message');
  console.log('  - If ID mismatch: Show auth error');
  
  console.log('🔐 Auth comments test completed!');
}

// รันการทดสอบ
testAuthComments();

// Export สำหรับใช้งาน
if (typeof window !== 'undefined') {
  window.testAuthComments = testAuthComments;
}
