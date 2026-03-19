// Test API สำหรับ debug ปัญหาคอมเมนต์
// รันใน browser console หรือ Postman

// 1. Test แบบง่ายๆ ไม่มี IP
async function testSimpleComment() {
  try {
    console.log('🧪 Testing simple comment...');
    
    const response = await fetch('/api/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        profile_id: 'test-profile-id',
        content: 'ทดสอบภาษาไทย'
      })
    });
    
    const result = await response.json();
    console.log('Simple Comment Result:', result);
    console.log('Response status:', response.status);
    
    if (response.ok) {
      console.log('✅ Simple comment success!');
    } else {
      console.error('❌ Simple comment error:', result.error);
    }
  } catch (error) {
    console.error('❌ Network Error:', error);
  }
}

// 2. Test แบบมี IP
async function testCommentWithIP() {
  try {
    console.log('🧪 Testing comment with IP...');
    
    const response = await fetch('/api/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        profile_id: 'test-profile-id',
        content: 'ทดสอบภาษาไทย',
        author_ip: '127.0.0.1'
      })
    });
    
    const result = await response.json();
    console.log('Comment with IP Result:', result);
    console.log('Response status:', response.status);
    
    if (response.ok) {
      console.log('✅ Comment with IP success!');
    } else {
      console.error('❌ Comment with IP error:', result.error);
    }
  } catch (error) {
    console.error('❌ Network Error:', error);
  }
}

// 3. Test แบบมี Authorization
async function testCommentWithAuth() {
  try {
    console.log('🧪 Testing comment with auth...');
    
    // ดึง JWT token จาก localStorage หรือ sessionStorage
    const token = localStorage.getItem('supabase.auth.token') || 
                  sessionStorage.getItem('supabase.auth.token');
    
    if (!token) {
      console.log('❌ No auth token found');
      return;
    }
    
    const response = await fetch('/api/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JSON.parse(token).access_token}`
      },
      body: JSON.stringify({
        profile_id: 'test-profile-id',
        content: 'ทดสอบภาษาไทย'
      })
    });
    
    const result = await response.json();
    console.log('Comment with Auth Result:', result);
    console.log('Response status:', response.status);
    
    if (response.ok) {
      console.log('✅ Comment with auth success!');
    } else {
      console.error('❌ Comment with auth error:', result.error);
    }
  } catch (error) {
    console.error('❌ Network Error:', error);
  }
}

// 4. Test แบบมีทุกอย่าง
async function testFullComment() {
  try {
    console.log('🧪 Testing full comment...');
    
    const token = localStorage.getItem('supabase.auth.token') || 
                  sessionStorage.getItem('supabase.auth.token');
    
    const response = await fetch('/api/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${JSON.parse(token).access_token}` : ''
      },
      body: JSON.stringify({
        profile_id: 'test-profile-id',
        content: 'ทดสอบภาษาไทย สวัสดีครับ',
        author_ip: '127.0.0.1'
      })
    });
    
    const result = await response.json();
    console.log('Full Comment Result:', result);
    console.log('Response status:', response.status);
    
    if (response.ok) {
      console.log('✅ Full comment success!');
    } else {
      console.error('❌ Full comment error:', result.error);
    }
  } catch (error) {
    console.error('❌ Network Error:', error);
  }
}

// 5. Test แบบส่งข้อมูลผิดพลาด
async function testInvalidData() {
  try {
    console.log('🧪 Testing invalid data...');
    
    const response = await fetch('/api/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        profile_id: '',
        content: ''
      })
    });
    
    const result = await response.json();
    console.log('Invalid Data Result:', result);
    console.log('Response status:', response.status);
    
    if (response.ok) {
      console.log('✅ Invalid data success (unexpected)');
    } else {
      console.error('❌ Invalid data error (expected):', result.error);
    }
  } catch (error) {
    console.error('❌ Network Error:', error);
  }
}

// 6. Test แบบตรวจสอบ headers
async function testHeaders() {
  try {
    console.log('🧪 Testing headers...');
    
    const response = await fetch('/api/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '192.168.1.1',
        'X-Real-IP': '192.168.1.1',
        'CF-Connecting-IP': '192.168.1.1'
      },
      body: JSON.stringify({
        profile_id: 'test-profile-id',
        content: 'ทดสอบภาษาไทย'
      })
    });
    
    const result = await response.json();
    console.log('Headers Test Result:', result);
    console.log('Response status:', response.status);
    
    if (response.ok) {
      console.log('✅ Headers test success!');
    } else {
      console.error('❌ Headers test error:', result.error);
    }
  } catch (error) {
    console.error('❌ Network Error:', error);
  }
}

// 7. Test แบบตรวจสอบขนาดข้อความ
async function testLongComment() {
  try {
    console.log('🧪 Testing long comment...');
    
    const longText = 'ทดสอบข้อความยาวๆ '.repeat(100);
    
    const response = await fetch('/api/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        profile_id: 'test-profile-id',
        content: longText
      })
    });
    
    const result = await response.json();
    console.log('Long Comment Result:', result);
    console.log('Response status:', response.status);
    console.log('Content length:', longText.length);
    
    if (response.ok) {
      console.log('✅ Long comment success!');
    } else {
      console.error('❌ Long comment error:', result.error);
    }
  } catch (error) {
    console.error('❌ Network Error:', error);
  }
}

// 8. Test แบบตรวจสอบ special characters
async function testSpecialChars() {
  try {
    console.log('🧪 Testing special characters...');
    
    const specialText = '!@#$%^&*()_+-=[]{}|;":,./<>?🎵🎶💖';
    
    const response = await fetch('/api/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        profile_id: 'test-profile-id',
        content: specialText
      })
    });
    
    const result = await response.json();
    console.log('Special Chars Result:', result);
    console.log('Response status:', response.status);
    
    if (response.ok) {
      console.log('✅ Special chars success!');
    } else {
      console.error('❌ Special chars error:', result.error);
    }
  } catch (error) {
    console.error('❌ Network Error:', error);
  }
}

// รันทั้งหมด
async function runAllTests() {
  console.log('🚀 Starting all comment tests...');
  
  await testSimpleComment();
  await testCommentWithIP();
  await testCommentWithAuth();
  await testFullComment();
  await testInvalidData();
  await testHeaders();
  await testLongComment();
  await testSpecialChars();
  
  console.log('🏁 All tests completed!');
}

// วิธีใช้:
// 1. เปิด browser console ในหน้าเว็บ
// 2. รันฟังก์ชันที่ต้องการทดสอบ
// ตัวอย่าง: runAllTests();

// Export สำหรับใช้งาน
if (typeof window !== 'undefined') {
  window.testCommentAPI = {
    testSimpleComment,
    testCommentWithIP,
    testCommentWithAuth,
    testFullComment,
    testInvalidData,
    testHeaders,
    testLongComment,
    testSpecialChars,
    runAllTests
  };
}
