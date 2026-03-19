// Test script สำหรับทดสอบการส่งคอมเมนต์
// รันใน browser console หรือ Postman

// 1. Test คอมเมนต์ภาษาไทย
async function testThaiComment() {
  try {
    const response = await fetch('/api/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_JWT_TOKEN', // ใส่ JWT token ของคุณ
      },
      body: JSON.stringify({
        profile_id: 'PROFILE_ID_HERE', // ใส่ profile ID ที่ต้องการคอมเมนต์
        content: 'ทดสอบภาษาไทย สวัสดีครับ ผมชอบเพลงนี้มาก'
      })
    });
    
    const result = await response.json();
    console.log('Thai Comment Result:', result);
    
    if (response.ok) {
      console.log('✅ คอมเมนต์ภาษาไทยสำเร็จ!');
    } else {
      console.error('❌ Error:', result.error);
    }
  } catch (error) {
    console.error('❌ Network Error:', error);
  }
}

// 2. Test คอมเมนต์ภาษาอังกฤษ
async function testEnglishComment() {
  try {
    const response = await fetch('/api/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_JWT_TOKEN',
      },
      body: JSON.stringify({
        profile_id: 'PROFILE_ID_HERE',
        content: 'Hello! I love this song very much! Great performance!'
      })
    });
    
    const result = await response.json();
    console.log('English Comment Result:', result);
    
    if (response.ok) {
      console.log('✅ คอมเมนต์ภาษาอังกฤษสำเร็จ!');
    } else {
      console.error('❌ Error:', result.error);
    }
  } catch (error) {
    console.error('❌ Network Error:', error);
  }
}

// 3. Test คอมเมนต์ผสมภาษา
async function testMixedComment() {
  try {
    const response = await fetch('/api/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_JWT_TOKEN',
      },
      body: JSON.stringify({
        profile_id: 'PROFILE_ID_HERE',
        content: 'สวัสดี! Hello! 🎵 ดนตรีดีมากครับ Great music!'
      })
    });
    
    const result = await response.json();
    console.log('Mixed Comment Result:', result);
    
    if (response.ok) {
      console.log('✅ คอมเมนต์ผสมภาษาสำเร็จ!');
    } else {
      console.error('❌ Error:', result.error);
    }
  } catch (error) {
    console.error('❌ Network Error:', error);
  }
}

// 4. Test คอมเมนต์พิเศษ
async function testSpecialComment() {
  try {
    const response = await fetch('/api/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_JWT_TOKEN',
      },
      body: JSON.stringify({
        profile_id: 'PROFILE_ID_HERE',
        content: '!@#$%^&*()_+-=[]{}|;":,./<>? 🎵🎶💖'
      })
    });
    
    const result = await response.json();
    console.log('Special Comment Result:', result);
    
    if (response.ok) {
      console.log('✅ คอมเมนต์พิเศษสำเร็จ!');
    } else {
      console.error('❌ Error:', result.error);
    }
  } catch (error) {
    console.error('❌ Network Error:', error);
  }
}

// วิธีใช้:
// 1. เปิด browser console ในหน้าเว็บ
// 2. แทนที่ YOUR_JWT_TOKEN และ PROFILE_ID_HERE
// 3. รันฟังก์ชันที่ต้องการทดสอบ
// ตัวอย่าง: testThaiComment();

// รันทั้งหมด
async function runAllTests() {
  console.log('🧪 เริ่มทดสอบคอมเมนต์ทั้งหมด...');
  
  await testThaiComment();
  await testEnglishComment();
  await testMixedComment();
  await testSpecialComment();
  
  console.log('🏁 ทดสอบเสร็จสิ้น!');
}

// รันทดสอบทั้งหมด
// runAllTests();
