// Test script สำหรับทดสอบการ join ข้อมูลคอมเมนต์
// รันใน browser console

function testCommentsJoin() {
  console.log('🔗 Testing comments with profile join...');
  
  // 1. ตรวจสอบว่ามีการ join ตาราง profiles หรือไม่
  console.log('🔍 Checking profile join in comments...');
  const commentElements = document.querySelectorAll('[data-testid="comment-item"]');
  console.log('📋 Comments found:', commentElements.length);
  
  commentElements.forEach((comment, index) => {
    const author = comment.querySelector('[data-testid="comment-author"]')?.textContent;
    const content = comment.querySelector('[data-testid="comment-content"]')?.textContent;
    const time = comment.querySelector('[data-testid="comment-time"]')?.textContent;
    const avatar = comment.querySelector('[data-testid="comment-avatar"]')?.src;
    
    console.log(`💬 Comment ${index + 1}:`, {
      author: author || 'No author',
      content: content?.substring(0, 50) + '...' || 'No content',
      time: time || 'No time',
      hasAvatar: !!avatar,
      avatarSrc: avatar || null
    });
    
    // ตรวจสอบว่าเป็นชื่อจริงหรือยังเป็น fallback
    if (author === 'ผู้ใช้งานทั่วไป') {
      console.log(`⚠️ Comment ${index + 1} still showing fallback name`);
    } else {
      console.log(`✅ Comment ${index + 1} showing real author name: ${author}`);
    }
  });
  
  // 2. ตรวจสอบว่ามีรูปโปรไฟล์จริงหรือไม่
  console.log('🖼️ Checking avatar images...');
  const avatarElements = document.querySelectorAll('[data-testid="comment-avatar"]');
  avatarElements.forEach((avatar, index) => {
    const imgSrc = avatar.src;
    const fallback = avatar.querySelector('svg') || avatar.querySelector('text');
    
    if (imgSrc && imgSrc !== 'null' && imgSrc !== '') {
      console.log(`✅ Avatar ${index + 1}: Real image - ${imgSrc}`);
    } else if (fallback) {
      console.log(`⚠️ Avatar ${index + 1}: Fallback avatar`);
    } else {
      console.log(`❌ Avatar ${index + 1}: No avatar found`);
    }
  });
  
  // 3. ทดสอบการเพิ่มคอมเมนต์ใหม่ (ถ้า login อยู่)
  const commentInput = document.querySelector('textarea[placeholder*="คอมเมนต์"]');
  if (commentInput) {
    console.log('🧪 Testing new comment with profile join...');
    
    // ตั้งค่าข้อความทดสอบ
    const testComment = 'ทดสอบการ join ข้อมูลโปรไฟล์ 🔗';
    commentInput.value = testComment;
    commentInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    console.log('📝 Test comment set:', testComment);
    
    // ตรวจสอบปุ่มส่ง
    const submitButton = document.querySelector('button:has([data-testid="submit-comment"])');
    if (submitButton) {
      console.log('🔘 Submit button found');
      console.log('🔘 Button disabled:', submitButton.disabled);
      
      if (!submitButton.disabled) {
        console.log('🖱️ Ready to submit comment with profile join');
        console.log('⚠️ Manual submission required to test real-time profile data');
      }
    } else {
      console.log('❌ Submit button not found');
    }
  }
  
  // 4. ตรวจสอบ query ที่ควรจะเกิดขึ้น
  console.log('🔍 Expected SQL queries:');
  console.log('📝 Fetch query:');
  console.log(`
    SELECT 
      profile_comments.*,
      profiles.full_name as author_full_name,
      profiles.avatar_url as author_avatar_url
    FROM profile_comments
    LEFT JOIN profiles ON profile_comments.author_id = profiles.id
    WHERE profile_comments.profile_id = '${document.querySelector('[data-profile-id]')?.dataset.profileId || 'unknown'}'
    ORDER BY profile_comments.created_at DESC
  `);
  
  console.log('📝 Insert query:');
  console.log(`
    INSERT INTO profile_comments (profile_id, author_id, content)
    VALUES ('${document.querySelector('[data-profile-id]')?.dataset.profileId || 'unknown'}', 'user_id', 'comment_content')
    
    -- และ return ข้อมูลพร้อม profile:
    SELECT 
      profile_comments.*,
      profiles.full_name as author_full_name,
      profiles.avatar_url as author_avatar_url
    FROM profile_comments
    LEFT JOIN profiles ON profile_comments.author_id = profiles.id
    WHERE profile_comments.id = LAST_INSERT_ID()
  `);
  
  // 5. ตรวจสอบ Foreign Key relationship
  console.log('🔗 Checking Foreign Key relationship...');
  console.log('✅ Expected: profile_comments.author_id -> profiles.id');
  console.log('✅ Expected: profile_comments.profile_id -> profiles.id');
  
  // 6. ตรวจสอบ UI ที่ควรจะแสดง
  console.log('🎨 Expected UI behavior:');
  console.log('  - Real author names instead of "ผู้ใช้งานทั่วไป"');
  console.log('  - Real avatar images instead of fallback');
  console.log('  - Proper Facebook-style comments with real user data');
  
  console.log('🔗 Comments join test completed!');
}

// รันการทดสอบ
testCommentsJoin();

// Export สำหรับใช้งาน
if (typeof window !== 'undefined') {
  window.testCommentsJoin = testCommentsJoin;
}
