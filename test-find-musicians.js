// Test script สำหรับทดสอบการแยกหน้าหานักดนตรี
function testFindMusiciansSeparation() {
  console.log('🎵 Testing Find Musicians page separation...');
  
  const menuCards = document.querySelectorAll('button');
  const findCard = Array.from(menuCards).find(btn => btn.textContent.includes('หาคนแทนด่วน'));
  const searchCard = Array.from(menuCards).find(btn => btn.textContent.includes('ค้นหานักดนตรีใกล้คุณ'));
  
  console.log('📋 Menu Cards Analysis:');
  console.log(`  🔍 หาคนแทนด่วน: ${!!findCard}`);
  console.log(`  👥 ค้นหานักดนตรีใกล้คุณ: ${!!searchCard}`);
  
  if (findCard) {
    console.log('✅ หาคนแทนด่วน มีอยู่');
    const description = findCard.textContent;
    console.log(`📝 คำอธิบาย: ${description}`);
    
    if (description.includes('ค้นหานักดนตรีที่พร้อมรับงานทันที')) {
      console.log('✅ คำอธิบายถูกต้อง - สำหรับหานักดนตรีแทน');
    } else {
      console.log('⚠️ คำอธิบายอาจยังไม่ถูกต้อง');
    }
  }
  
  if (searchCard) {
    console.log('✅ ค้นหานักดนตรีใกล้คุณ มีอยู่');
    console.log('👤 สำหรับค้นหาโปรไฟล์นักดนตรี (ไม่เปลี่ยนแปลง)');
  }
  
  console.log('🎵 Find Musicians separation test completed!');
}

window.testFindMusiciansSeparation = testFindMusiciansSeparation;
