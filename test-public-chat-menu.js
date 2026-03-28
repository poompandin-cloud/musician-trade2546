// Test script สำหรับทดสอบเมนูแชทสาธารณะ
function testPublicChatMenu() {
  console.log('🗨️ Testing Public Chat menu...');
  
  const menuCards = document.querySelectorAll('button');
  const chatCard = Array.from(menuCards).find(btn => btn.textContent.includes('แชทสาธารณะ'));
  const searchCard = Array.from(menuCards).find(btn => btn.textContent.includes('ค้นหานักดนตรีใกล้คุณ'));
  const contactCard = Array.from(menuCards).find(btn => btn.textContent.includes('ติดต่อเรา'));
  
  console.log('📋 Menu Cards Analysis:');
  console.log(`  🔍 ค้นหานักดนตรีใกล้คุณ: ${!!searchCard}`);
  console.log(`  🗨️ แชทสาธารณะ: ${!!chatCard}`);
  console.log(`  ℹ️ ติดต่อเรา: ${!!contactCard}`);
  
  if (chatCard) {
    console.log('✅ แชทสาธารณะ มีอยู่');
    const description = chatCard.textContent;
    console.log(`📝 คำอธิบาย: ${description}`);
    
    if (description.includes('ห้องพูดคุย แลกเปลี่ยนประสบการณ์ดนตรี')) {
      console.log('✅ คำอธิบายถูกต้อง');
    } else {
      console.log('⚠️ คำอธิบายอาจไม่ถูกต้อง');
    }
    
    // ตรวจสอบไอคอน
    const icon = chatCard.querySelector('svg');
    if (icon) {
      console.log('✅ มีไอคอน MessageSquare');
    } else {
      console.log('❌ ไม่พบไอคอน');
    }
    
    // ตรวจสอบสีและสไตล์
    const iconContainer = chatCard.querySelector('.bg-orange-100');
    if (iconContainer) {
      console.log('✅ ไอคอนอยู่ในวงกลมสีส้ม');
    } else {
      console.log('⚠️ ไอคอนอาจไม่มีวงกลมสีส้ม');
    }
  }
  
  // ตรวจสอบลำดับ (แชทควรอยู่ก่อนติดต่อเรา)
  if (chatCard && contactCard) {
    const chatIndex = Array.from(menuCards).indexOf(chatCard);
    const contactIndex = Array.from(menuCards).indexOf(contactCard);
    
    if (chatIndex < contactIndex) {
      console.log('✅ แชทสาธารณะอยู่ก่อนติดต่อเรา (ลำดับถูกต้อง)');
    } else {
      console.log('⚠️ ลำดับอาจไม่ถูกต้อง');
    }
  }
  
  console.log('🗨️ Public Chat menu test completed!');
}

window.testPublicChatMenu = testPublicChatMenu;
