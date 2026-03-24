// Test script สำหรับทดสอบการนำทางใหม่
function testNavigationFix() {
  console.log('🧭 Testing navigation fixes...');
  
  const menuCards = document.querySelectorAll('button');
  const findCard = (text) => Array.from(menuCards).find(btn => btn.textContent.includes(text));
  
  const findCardBtn = findCard('หาคนแทนด่วน');
  const jobsCardBtn = findCard('งานที่ประกาศ');
  const searchCardBtn = findCard('ค้นหานักดนตรีใกล้คุณ');
  const postJobCardBtn = findCard('โพสต์ประกาศงาน');
  
  console.log('📋 Menu Cards Found:');
  console.log(`  🔍 หาคนแทนด่วน: ${!!findCardBtn}`);
  console.log(`  📋 งานที่ประกาศ: ${!!jobsCardBtn}`);
  console.log(`  👥 ค้นหานักดนตรี: ${!!searchCardBtn}`);
  console.log(`  ➕ โพสต์ประกาศงาน: ${!!postJobCardBtn}`);
  
  if (postJobCardBtn) {
    console.log('⚠️ โพสต์ประกาศงาน ยังคงอยู่ (ควรถูกลบ)');
  } else {
    console.log('✅ โพสต์ประกาศงาน ถูกลบแล้ว');
  }
  
  console.log('🧭 Navigation test completed!');
}

window.testNavigationFix = testNavigationFix;
