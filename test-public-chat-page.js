// Test script สำหรับทดสอบหน้า PublicChat
function testPublicChatPage() {
  console.log('🗨️ Testing PublicChat page...');
  
  // 1. ตรวจสอบ Header
  const header = document.querySelector('.sticky.top-0');
  if (header) {
    console.log('✅ Header มีอยู่');
    
    const backButton = header.querySelector('button');
    const title = header.querySelector('h1');
    const status = header.querySelector('.text-green-500');
    
    console.log(`  🔙 ปุ่มย้อนกลับ: ${!!backButton}`);
    console.log(`  📝 หัวข้อ: ${title?.textContent}`);
    console.log(`  🟢 สถานะ: ${status?.textContent}`);
  }
  
  // 2. ตรวจสอบพื้นที่แชท
  const chatArea = document.querySelector('.overflow-y-auto');
  if (chatArea) {
    console.log('✅ พื้นที่แชทมีอยู่');
    
    const bgColor = window.getComputedStyle(chatArea).backgroundColor;
    console.log(`  🎨 สีพื้นหลัง: ${bgColor}`);
    
    const messages = chatArea.querySelectorAll('.space-y-4 > div');
    console.log(`  💬 จำนวนข้อความ: ${messages.length}`);
  }
  
  // 3. ตรวจสอบกล่องข้อความ
  const messageBubbles = document.querySelectorAll('.rounded-2xl');
  console.log(`  🫧 จำนวนกล่องข้อความ: ${messageBubbles.length}`);
  
  // ตรวจสอบสีของกล่องข้อความ
  messageBubbles.forEach((bubble, index) => {
    const bgColor = window.getComputedStyle(bubble).backgroundColor;
    const isGreen = bgColor.includes('149, 236, 105') || bgColor.includes('95, 236, 105');
    const isWhite = bgColor.includes('255, 255, 255');
    
    if (isGreen) {
      console.log(`  🟢 กล่องที่ ${index + 1}: สีเขียว (เราส่ง)`);
    } else if (isWhite) {
      console.log(`  ⚪ กล่องที่ ${index + 1}: สีขาว (คนอื่นส่ง)`);
    } else {
      console.log(`  🎨 กล่องที่ ${index + 1}: สีอื่นๆ (${bgColor})`);
    }
  });
  
  // 4. ตรวจสอบรูปโปรไฟล์
  const avatars = document.querySelectorAll('.avatar');
  console.log(`  👤 จำนวนรูปโปรไฟล์: ${avatars.length}`);
  
  // 5. ตรวจสอบ Input Bar
  const inputBar = document.querySelector('.sticky.bottom-0');
  if (inputBar) {
    console.log('✅ Input Bar มีอยู่');
    
    const icons = inputBar.querySelectorAll('.text-gray-500');
    const inputField = inputBar.querySelector('input[type="text"]');
    const sendButton = inputBar.querySelector('.bg-blue-500');
    
    console.log(`  📸 ไอคอนซ้าย: ${icons.length} อัน`);
    console.log(`  📝 ช่องพิมพ์: ${!!inputField}`);
    console.log(`  📤 ปุ่มส่ง: ${!!sendButton}`);
    
    if (inputField) {
      console.log(`  💭 พรอมต์: ${inputField.placeholder}`);
    }
  }
  
  // 6. ตรวจสอบติ่งกล่อง (CSS triangles)
  const triangles = document.querySelectorAll('[class*="border-t-8"]');
  console.log(`  🔺 จำนวนติ่งกล่อง: ${triangles.length}`);
  
  // 7. ทดสอบการพิมพ์
  const input = document.querySelector('input[placeholder*="พิมพ์ข้อความ"]');
  if (input) {
    console.log('✅ พร้อมทดสอบการพิมพ์');
    console.log('💡 ลองพิมพ์ข้อความแล้วกด Enter เพื่อทดสอบ');
  }
  
  console.log('🗨️ PublicChat page test completed!');
  
  // 8. แนะนำการทดสอบเพิ่มเติม
  console.log('💡 Additional tests:');
  console.log('  1. คลิกปุ่มย้อนกลับ → ควรไปหน้าหลัก');
  console.log('  2. พิมพ์ข้อความ + Enter → ควรส่งข้อความ');
  console.log('  3. ตรวจสอบ scroll ลงล่างอัตโนมัติ');
  console.log('  4. ทดสอบ responsive บนมือถือ');
}

window.testPublicChatPage = testPublicChatPage;
