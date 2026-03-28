// Test script สำหรับทดสอบ Responsive Chat
function testResponsiveChat() {
  console.log('📱 Testing Responsive Chat...');
  
  // 1. ตรวจสอบ Layout และ Container
  const mainContainer = document.querySelector('.min-h-\\[100dvh\\]');
  const chatContainer = document.querySelector('.max-w-2xl');
  
  if (mainContainer) {
    console.log('✅ Main Container มีอยู่');
    const bgStyles = window.getComputedStyle(mainContainer);
    console.log(`  🎨 พื้นหลัง: ${bgStyles.backgroundColor}`);
    console.log(`  📐 ความสูง: ${bgStyles.minHeight}`);
  }
  
  if (chatContainer) {
    console.log('✅ Chat Container มีอยู่');
    const containerStyles = window.getComputedStyle(chatContainer);
    console.log(`  📏 ความกว้างสูงสุด: ${containerStyles.maxWidth}`);
    console.log(`  🎯 การจัดวาง: ${containerStyles.margin}`);
  }
  
  // 2. ตรวจสอบ Header
  const header = document.querySelector('.sticky.top-0');
  if (header) {
    console.log('✅ Header มีอยู่');
    const headerStyles = window.getComputedStyle(header);
    console.log(`  📌 ตำแหน่ง: ${headerStyles.position}`);
    console.log(`  🔝 z-index: ${headerStyles.zIndex}`);
    
    const backButton = header.querySelector('button');
    if (backButton) {
      const buttonStyles = window.getComputedStyle(backButton);
      console.log(`  🔙 ขนาดปุ่มย้อนกลับ: ${buttonStyles.minWidth} x ${buttonStyles.minHeight}`);
      
      // ตรวจสอบว่ามีค่า min-width และ min-height ตามมาตรฐาน
      const minWidth = parseInt(buttonStyles.minWidth);
      const minHeight = parseInt(buttonStyles.minHeight);
      
      if (minWidth >= 40 && minHeight >= 40) {
        console.log('✅ ปุ่มย้อนกลับมีขนาดเหมาะสม (Tap Target >= 40px)');
      } else {
        console.log('⚠️ ปุ่มย้อนกลับอาจเล็กเกินไป');
      }
    }
  }
  
  // 3. ตรวจสอบ Chat Area
  const chatArea = document.querySelector('.overflow-y-auto');
  if (chatArea) {
    console.log('✅ Chat Area มีอยู่');
    const chatStyles = window.getComputedStyle(chatArea);
    console.log(`  📜 การ scroll: ${chatStyles.overflowY}`);
    console.log(`  🎨 สีพื้นหลัง: ${chatStyles.backgroundColor}`);
    console.log(`  📏 ความสูง: ${chatStyles.flex}`);
  }
  
  // 4. ตรวจสอบ Message Bubbles
  const messageBubbles = document.querySelectorAll('.rounded-2xl');
  console.log(`  🫧 จำนวนกล่องข้อความ: ${messageBubbles.length}`);
  
  messageBubbles.forEach((bubble, index) => {
    const bubbleStyles = window.getComputedStyle(bubble);
    const parentFlex = bubble.parentElement?.parentElement;
    const parentStyles = parentFlex ? window.getComputedStyle(parentFlex) : null;
    
    if (parentStyles) {
      const maxWidth = parentStyles.maxWidth;
      console.log(`  📦 กล่องที่ ${index + 1}: ความกว้างสูงสุด ${maxWidth}`);
    }
    
    const padding = bubbleStyles.padding;
    console.log(`    📏 Padding: ${padding}`);
  });
  
  // 5. ตรวจสอบ Input Bar
  const inputBar = document.querySelector('.sticky.bottom-0');
  if (inputBar) {
    console.log('✅ Input Bar มีอยู่');
    const inputStyles = window.getComputedStyle(inputBar);
    console.log(`  📌 ตำแหน่ง: ${inputStyles.position}`);
    console.log(`  🔝 z-index: ${inputStyles.zIndex}`);
    
    // ตรวจสอบปุ่มใน Input Bar
    const buttons = inputBar.querySelectorAll('button');
    console.log(`  🔘 จำนวนปุ่ม: ${buttons.length}`);
    
    buttons.forEach((button, index) => {
      const btnStyles = window.getComputedStyle(button);
      const minWidth = parseInt(btnStyles.minWidth);
      const minHeight = parseInt(btnStyles.minHeight);
      
      console.log(`    ปุ่มที่ ${index + 1}: ${minWidth}x${minHeight}px`);
      
      if (minWidth >= 40 && minHeight >= 40) {
        console.log(`    ✅ ปุ่มที่ ${index + 1} มีขนาดเหมาะสม`);
      } else {
        console.log(`    ⚠️ ปุ่มที่ ${index + 1} อาจเล็กเกินไป`);
      }
    });
    
    // ตรวจสองช่อง Input
    const inputField = inputBar.querySelector('input');
    if (inputField) {
      const inputStyles = window.getComputedStyle(inputField);
      console.log(`  📝 ช่องพิมพ์: ${inputStyles.fontSize}`);
      console.log(`  📏 ความกว้าง: ${inputField.parentElement?.style.flex || 'flex-1'}`);
    }
  }
  
  // 6. ตรวจสอบ Responsive Breakpoints
  const checkResponsive = () => {
    const width = window.innerWidth;
    console.log(`\n📱 หน้าจอปัจจุบัน: ${width}px`);
    
    if (width < 640) {
      console.log('📱 Mobile View (< 640px)');
      console.log('  - ควรเห็นพื้นหลังสีเทาเข้ม');
      console.log('  - ควรเห็นปุ่มขนาด 44x44px');
      console.log('  - ควรเห็นกล่องข้อความ 75-80% ความกว้าง');
    } else {
      console.log('💻 Desktop View (>= 640px)');
      console.log('  - ควรเห็นพื้นหลังสีเทาอ่อน');
      console.log('  - ควรเห็น container จำกัดความกว้าง');
      console.log('  - ควรเห็นขอบมนและเงา');
    }
  };
  
  checkResponsive();
  
  // 7. ทดสอบการเปลี่ยนขนาดหน้าจอ
  window.addEventListener('resize', checkResponsive);
  
  console.log('\n💡 การทดสอบ Responsive:');
  console.log('  1. ลองปรับขนาดหน้าจอ browser');
  console.log('  2. ตรวจสอบว่า layout เปลี่ยนตาม breakpoint');
  console.log('  3. ทดสอบบนมือถือจริง (ถ้ามี)');
  console.log('  4. ตรวจสอบการทำงานของ keyboard บนมือถือ');
  
  console.log('\n📱 Responsive Chat test completed!');
}

window.testResponsiveChat = testResponsiveChat;
