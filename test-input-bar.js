// Test script สำหรับทดสอบ Input Bar ที่หายไป
function testInputBar() {
  console.log('🔍 Testing Input Bar...');
  
  // 1. ตรวจสอบว่ามี Input Bar หรือไม่
  const checkInputBarExists = () => {
    console.log('🔍 Checking if Input Bar exists...');
    
    const inputBar = document.querySelector('.sticky.bottom-0');
    const inputField = document.querySelector('input[type="text"]');
    const sendButton = document.querySelector('button:has(.lucide-send)');
    const imageButton = document.querySelector('button:has(.lucide-image)');
    const plusButton = document.querySelector('button:has(.lucide-plus)');
    
    console.log('📊 Input Bar elements found:');
    console.log('  📝 Input Bar container:', !!inputBar);
    console.log('  ⌨️ Input field:', !!inputField);
    console.log('  📤 Send button:', !!sendButton);
    console.log('  🖼️ Image button:', !!imageButton);
    console.log('  ➕ Plus button:', !!plusButton);
    
    return {
      inputBar: !!inputBar,
      inputField: !!inputField,
      sendButton: !!sendButton,
      imageButton: !!imageButton,
      plusButton: !!plusButton
    };
  };
  
  // 2. ตรวจสอบ CSS positioning
  const checkInputBarStyling = () => {
    console.log('🎨 Checking Input Bar styling...');
    
    const inputBar = document.querySelector('.sticky.bottom-0');
    if (!inputBar) {
      console.log('❌ Input Bar not found');
      return false;
    }
    
    const computedStyle = window.getComputedStyle(inputBar);
    const position = computedStyle.position;
    const bottom = computedStyle.bottom;
    const zIndex = computedStyle.zIndex;
    const backgroundColor = computedStyle.backgroundColor;
    const hasBorder = computedStyle.border !== '0px';
    
    console.log('🎨 Input Bar styling:');
    console.log('  📍 Position:', position);
    console.log('  ⬇️ Bottom:', bottom);
    console.log('  🏗️ Z-index:', zIndex);
    console.log('  🎨 Background color:', backgroundColor);
    console.log('  🖼️ Has border:', hasBorder);
    
    // ตรวจสอบว่ามี sticky positioning และ z-index สูงพอ
    const isSticky = position === 'sticky';
    const isBottomZero = bottom === '0px';
    const hasHighZIndex = parseInt(zIndex) >= 30;
    const hasWhiteBackground = backgroundColor.includes('255, 255, 255') || backgroundColor === 'white';
    
    console.log('✅ Styling checks:');
    console.log('  📍 Is sticky:', isSticky);
    console.log('  ⬇️ Is bottom-0:', isBottomZero);
    console.log('  🏗️ Has high z-index:', hasHighZIndex);
    console.log('  🎨 Has white background:', hasWhiteBackground);
    
    return {
      isSticky,
      isBottomZero,
      hasHighZIndex,
      hasWhiteBackground
    };
  };
  
  // 3. ตรวจสอบ Chat Area container
  const checkChatAreaContainer = () => {
    console.log('📱 Checking Chat Area container...');
    
    const chatArea = document.querySelector('.flex-1.overflow-y-auto');
    if (!chatArea) {
      console.log('❌ Chat Area container not found');
      return false;
    }
    
    const computedStyle = window.getComputedStyle(chatArea);
    const display = computedStyle.display;
    const flexDirection = computedStyle.flexDirection;
    const flex = computedStyle.flex;
    const overflowY = computedStyle.overflowY;
    
    console.log('📱 Chat Area styling:');
    console.log('  📐 Display:', display);
    console.log('  🔄 Flex direction:', flexDirection);
    console.log('  📏 Flex:', flex);
    console.log('  📜 Overflow Y:', overflowY);
    
    // ตรวจสอบว่ามี flex-1 และ overflow-y-auto
    const isFlexOne = flex === '1 1 0%' || flex === '1';
    const hasOverflowYAuto = overflowY === 'auto';
    const isFlexColumn = flexDirection === 'column';
    
    console.log('✅ Container checks:');
    console.log('  📏 Is flex-1:', isFlexOne);
    console.log('  📜 Has overflow-y-auto:', hasOverflowYAuto);
    console.log('  🔄 Is flex column:', isFlexColumn);
    
    return {
      isFlexOne,
      hasOverflowYAuto,
      isFlexColumn
    };
  };
  
  // 4. ตรวจสอบว่า Input Bar ถูกซ่อนโดย context menu หรือไม่
  const checkContextMenuInteraction = () => {
    console.log('📱 Checking Context Menu interaction...');
    
    const contextMenu = document.querySelector('.fixed.z-50.bg-white.rounded-lg.shadow-xl');
    const backdrop = document.querySelector('.fixed.inset-0.z-40');
    const inputBar = document.querySelector('.sticky.bottom-0.z-30');
    
    console.log('📱 Context Menu elements:');
    console.log('  📋 Context menu:', !!contextMenu);
    console.log('  🌑 Backdrop:', !!backdrop);
    console.log('  ⌨️ Input bar:', !!inputBar);
    
    if (contextMenu && backdrop && inputBar) {
      const menuZIndex = parseInt(window.getComputedStyle(contextMenu).zIndex);
      const backdropZIndex = parseInt(window.getComputedStyle(backdrop).zIndex);
      const inputBarZIndex = parseInt(window.getComputedStyle(inputBar).zIndex);
      
      console.log('🏗️ Z-index hierarchy:');
      console.log('  📋 Context menu z-index:', menuZIndex);
      console.log('  🌑 Backdrop z-index:', backdropZIndex);
      console.log('  ⌨️ Input bar z-index:', inputBarZIndex);
      
      // ตรวจสอบว่า z-index ถูกตั้งถูกต้อง
      const correctZIndex = menuZIndex > backdropZIndex && backdropZIndex > inputBarZIndex;
      
      console.log('✅ Z-index hierarchy correct:', correctZIndex);
      
      return correctZIndex;
    }
    
    return false;
  };
  
  // 5. ทดสอบการทำงานของ Input Field
  const testInputFieldFunctionality = () => {
    console.log('⌨️ Testing Input Field functionality...');
    
    const inputField = document.querySelector('input[type="text"]');
    if (!inputField) {
      console.log('❌ Input field not found');
      return false;
    }
    
    // ตรวจสอบ placeholder
    const placeholder = inputField.placeholder;
    console.log('📝 Placeholder:', placeholder);
    
    // ตรวจสอบว่าสามารถพิมพ์ได้
    const isDisabled = inputField.disabled;
    console.log('🔒 Is disabled:', isDisabled);
    
    // ตรวจสอบว่าสามารถ focus ได้
    inputField.focus();
    const isActive = document.activeElement === inputField;
    console.log('🎯 Is active (focused):', isActive);
    
    // ตรวจสอบค่าปัจจุบัน
    const value = inputField.value;
    console.log('📝 Current value:', value);
    
    return {
      hasPlaceholder: !!placeholder,
      isDisabled,
      isActive,
      hasValue: !!value
    };
  };
  
  // 6. รันการทดสอบทั้งหมด
  const runAllTests = () => {
    console.log('🚀 Starting Input Bar Test...\n');
    
    const existsCheck = checkInputBarExists();
    console.log('');
    
    if (!existsCheck.inputBar) {
      console.log('❌ Input Bar is missing! This is the problem.');
      console.log('💡 The Input Bar section needs to be added back to the component.');
      return;
    }
    
    const stylingCheck = checkInputBarStyling();
    console.log('');
    
    const containerCheck = checkChatAreaContainer();
    console.log('');
    
    const contextMenuCheck = checkContextMenuInteraction();
    console.log('');
    
    const functionalityCheck = testInputFieldFunctionality();
    console.log('');
    
    // สรุปผลการทดสอบ
    console.log('📊 Test Summary:');
    console.log('  ✅ Input Bar exists:', existsCheck.inputBar);
    console.log('  🎨 Sticky positioning:', stylingCheck.isSticky && stylingCheck.isBottomZero);
    console.log('  🏗️ High z-index:', stylingCheck.hasHighZIndex);
    console.log('  📱 Chat Area flex-1:', containerCheck.isFlexOne);
    console.log('  📜 Chat Area overflow:', containerCheck.hasOverflowYAuto);
    console.log('  📱 Context Menu z-index:', contextMenuCheck);
    console.log('  ⌨️ Input field works:', existsCheck.inputField);
    
    console.log('\n🎯 Expected Results:');
    console.log('  ✅ Input Bar has sticky bottom-0');
    console.log('  ✅ Input Bar has z-index >= 30');
    console.log('  ✅ Chat Area has flex-1 overflow-y-auto');
    console.log('  ✅ Input Bar stays at bottom when scrolling');
    console.log('  ✅ Context Menu appears above Input Bar');
    console.log('  ✅ All buttons (Plus, Image, Send) are visible');
    console.log('  ✅ Input field is functional');
    
    console.log('\n💡 Manual Test Instructions:');
    console.log('  1. ส่งข้อความหลายๆเพื่อทดสอบ scrolling');
    console.log('  2. ตรวจสอบว่า Input Bar อยู่ด้านล่างตลอดเวลา');
    console.log('  3. คลิกปุ่มรูปภาพเพื่อทดสอบการอัปโหลด');
    console.log('  4. คลิกขวาค้างที่ข้อความเพื่อทดสอบ Context Menu');
    console.log('  5. ตรวจสอบว่า Context Menu อยู่เหนือ Input Bar');
    console.log('  6. คลิกพื้นที่ว่างเพื่อปิด Context Menu');
    
    console.log('\n🔧 If Input Bar is still missing:');
    console.log('  1. Check if the Input Bar JSX was accidentally removed');
    console.log('  2. Verify the file was saved correctly');
    console.log('  3. Check for any syntax errors in the component');
    console.log('  4. Restart the development server');
    
    console.log('\n🏁 Input Bar Test Completed!');
  };
  
  runAllTests();
}

window.testInputBar = testInputBar;
