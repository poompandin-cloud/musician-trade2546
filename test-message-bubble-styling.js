// Test script สำหรับทดสอบการแสดงผลกล่องข้อความ (Message Bubble) ตามเงื่อนไข
function testMessageBubbleStyling() {
  console.log('🎨 Testing Message Bubble Styling...');
  
  // 1. ตรวจสอบ DOM elements สำหรับข้อความที่มีรูปภาพ
  const checkImageOnlyMessages = () => {
    console.log('🖼️ Checking image-only messages...');
    
    const messageElements = document.querySelectorAll('.space-y-4 > div');
    let imageOnlyMessages = 0;
    
    messageElements.forEach((element, index) => {
      const images = element.querySelectorAll('img[alt="รูปภาพในแชท"]');
      const textParagraphs = element.querySelectorAll('p.text-sm');
      
      if (images.length > 0 && textParagraphs.length === 0) {
        imageOnlyMessages++;
        console.log(`🖼️ Image-only message ${imageOnlyMessages}:`);
        
        // ตรวจสอบว่ารูปภาพอยู่ใน container ที่ถูกต้อง
        const imageContainer = images[0].parentElement;
        console.log('  📦 Image container classes:', imageContainer.className);
        
        // ตรวจสอบว่ามีพื้นหลังหรือไม่
        const computedStyle = window.getComputedStyle(imageContainer);
        const backgroundColor = computedStyle.backgroundColor;
        const padding = computedStyle.padding;
        
        console.log('  🎨 Background color:', backgroundColor);
        console.log('  📏 Padding:', padding);
        
        // ตรวจสอบว่ามีติ่งกล่องหรือไม่
        const parentRelative = imageContainer.closest('.relative');
        const tailElements = parentRelative.querySelectorAll('.absolute');
        console.log('  📍 Tail elements count:', tailElements.length);
        
        if (backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
          console.log('  ✅ Background is transparent');
        } else {
          console.log('  ❌ Background is not transparent:', backgroundColor);
        }
        
        if (padding === '0px' || padding === '0px 0px') {
          console.log('  ✅ No padding');
        } else {
          console.log('  ❌ Has padding:', padding);
        }
        
        if (tailElements.length === 0) {
          console.log('  ✅ No tail elements');
        } else {
          console.log('  ❌ Has tail elements:', tailElements.length);
        }
      }
    });
    
    console.log('🖼️ Total image-only messages found:', imageOnlyMessages);
    return imageOnlyMessages;
  };
  
  // 2. ตรวจสอบ DOM elements สำหรับข้อความที่มีทั้งข้อความและรูปภาพ
  const checkTextAndImageMessages = () => {
    console.log('📝+🖼️ Checking text+image messages...');
    
    const messageElements = document.querySelectorAll('.space-y-4 > div');
    let textAndImageMessages = 0;
    
    messageElements.forEach((element, index) => {
      const images = element.querySelectorAll('img[alt="รูปภาพในแชท"]');
      const textParagraphs = element.querySelectorAll('p.text-sm');
      
      if (images.length > 0 && textParagraphs.length > 0) {
        textAndImageMessages++;
        console.log(`📝+🖼️ Text+image message ${textAndImageMessages}:`);
        
        // ตรวจสอบว่าข้อความอยู่ในกล่องที่ถูกต้อง
        const textContainer = textParagraphs[0].parentElement;
        console.log('  📦 Text container classes:', textContainer.className);
        
        // ตรวจสอบพื้นหลังและ padding
        const computedStyle = window.getComputedStyle(textContainer);
        const backgroundColor = computedStyle.backgroundColor;
        const padding = computedStyle.padding;
        
        console.log('  🎨 Background color:', backgroundColor);
        console.log('  📏 Padding:', padding);
        
        // ตรวจสอบว่ามีติ่งกล่องหรือไม่
        const parentRelative = textContainer.closest('.relative');
        const tailElements = parentRelative.querySelectorAll('.absolute');
        console.log('  📍 Tail elements count:', tailElements.length);
        
        // ตรวจสอบว่าเป็นข้อความของตัวเองหรือคนอื่น
        const isMe = element.querySelector('.ml-auto');
        console.log('  👤 Message type:', isMe ? 'My message' : 'Other message');
        
        if (isMe) {
          // ตรวจสอบสีเขียวสำหรับข้อความของตัวเอง
          if (backgroundColor.includes('149') || backgroundColor.includes('236') || backgroundColor.includes('105')) {
            console.log('  ✅ Green background for my message');
          } else {
            console.log('  ❌ Not green background for my message:', backgroundColor);
          }
        } else {
          // ตรวจสอบสีขาวสำหรับข้อความของคนอื่น
          if (backgroundColor === 'rgb(255, 255, 255)' || backgroundColor === 'white') {
            console.log('  ✅ White background for other message');
          } else {
            console.log('  ❌ Not white background for other message:', backgroundColor);
          }
        }
      }
    });
    
    console.log('📝+🖼️ Total text+image messages found:', textAndImageMessages);
    return textAndImageMessages;
  };
  
  // 3. ตรวจสอบ DOM elements สำหรับข้อความที่มีแต่ตัวหนังสือ
  const checkTextOnlyMessages = () => {
    console.log('📝 Checking text-only messages...');
    
    const messageElements = document.querySelectorAll('.space-y-4 > div');
    let textOnlyMessages = 0;
    
    messageElements.forEach((element, index) => {
      const images = element.querySelectorAll('img[alt="รูปภาพในแชท"]');
      const textParagraphs = element.querySelectorAll('p.text-sm');
      
      if (images.length === 0 && textParagraphs.length > 0) {
        textOnlyMessages++;
        console.log(`📝 Text-only message ${textOnlyMessages}:`);
        
        // ตรวจสอบว่าข้อความอยู่ในกล่องที่ถูกต้อง
        const textContainer = textParagraphs[0].parentElement;
        console.log('  📦 Text container classes:', textContainer.className);
        
        // ตรวจสอบพื้นหลังและ padding
        const computedStyle = window.getComputedStyle(textContainer);
        const backgroundColor = computedStyle.backgroundColor;
        const padding = computedStyle.padding;
        
        console.log('  🎨 Background color:', backgroundColor);
        console.log('  📏 Padding:', padding);
        
        // ตรวจสอบว่ามีติ่งกล่องหรือไม่
        const parentRelative = textContainer.closest('.relative');
        const tailElements = parentRelative.querySelectorAll('.absolute');
        console.log('  📍 Tail elements count:', tailElements.length);
        
        // ตรวจสอบว่าเป็นข้อความของตัวเองหรือคนอื่น
        const isMe = element.querySelector('.ml-auto');
        console.log('  👤 Message type:', isMe ? 'My message' : 'Other message');
        
        if (isMe) {
          // ตรวจสอบสีเขียวสำหรับข้อความของตัวเอง
          if (backgroundColor.includes('149') || backgroundColor.includes('236') || backgroundColor.includes('105')) {
            console.log('  ✅ Green background for my message');
          } else {
            console.log('  ❌ Not green background for my message:', backgroundColor);
          }
        } else {
          // ตรวจสอบสีขาวสำหรับข้อความของคนอื่น
          if (backgroundColor === 'rgb(255, 255, 255)' || backgroundColor === 'white') {
            console.log('  ✅ White background for other message');
          } else {
            console.log('  ❌ Not white background for other message:', backgroundColor);
          }
        }
      }
    });
    
    console.log('📝 Total text-only messages found:', textOnlyMessages);
    return textOnlyMessages;
  };
  
  // 4. ทดสอบการ hover บนรูปภาพ
  const testImageHover = () => {
    console.log('🖱️ Testing image hover effects...');
    
    const images = document.querySelectorAll('img[alt="รูปภาพในแชท"]');
    let hoverableImages = 0;
    
    images.forEach((img, index) => {
      const hasCursorPointer = img.style.cursor === 'pointer' || 
                            img.classList.contains('cursor-pointer');
      const hasHoverOpacity = img.classList.contains('hover:opacity-90');
      const hasTransition = img.classList.contains('transition-opacity');
      const hasClickHandler = img.onclick !== null;
      
      console.log(`🖼️ Image ${index + 1}:`);
      console.log('  👆 Has cursor pointer:', hasCursorPointer);
      console.log('  🎨 Has hover opacity:', hasHoverOpacity);
      console.log('  ⚡ Has transition:', hasTransition);
      console.log('  🖱️ Has click handler:', hasClickHandler);
      
      if (hasCursorPointer && hasHoverOpacity && hasTransition && hasClickHandler) {
        hoverableImages++;
        console.log('  ✅ Image is fully interactive');
      } else {
        console.log('  ❌ Image missing some interactions');
      }
    });
    
    console.log('🖼️ Total interactive images:', hoverableImages, '/', images.length);
    return hoverableImages;
  };
  
  // 5. รันการทดสอบทั้งหมด
  const runAllTests = () => {
    console.log('🚀 Starting Message Bubble Styling Test...\n');
    
    const imageOnlyCount = checkImageOnlyMessages();
    console.log('');
    
    const textAndImageCount = checkTextAndImageMessages();
    console.log('');
    
    const textOnlyCount = checkTextOnlyMessages();
    console.log('');
    
    const hoverableCount = testImageHover();
    console.log('');
    
    // สรุปผล
    console.log('📊 Test Summary:');
    console.log('  🖼️ Image-only messages:', imageOnlyCount);
    console.log('  📝+🖼️ Text+image messages:', textAndImageCount);
    console.log('  📝 Text-only messages:', textOnlyCount);
    console.log('  🖱️ Interactive images:', hoverableCount);
    
    console.log('\n🎯 Expected Results:');
    console.log('  🖼️ Image-only: Transparent background, no padding, no tail');
    console.log('  📝+🖼️ Text+image: Colored background, with padding, with tail');
    console.log('  📝 Text-only: Colored background, with padding, with tail');
    console.log('  🖱️ All images: Clickable, hover effect, transition');
    
    console.log('\n💡 Manual Test Instructions:');
    console.log('  1. ส่งข้อความแบบมีแต่ตัวหนังสือ');
    console.log('  2. ส่งข้อความแบบมีแต่รูปภาพ');
    console.log('  3. ส่งข้อความแบบมีทั้งตัวหนังสือและรูปภาพ');
    console.log('  4. ตรวจสอบว่ารูปภาพแสดงผลถูกต้องตามเงื่อนไข');
    console.log('  5. ทดสอบการคลิกรูปภาพเพื่อดูขนาดใหญ่');
    
    console.log('\n🏁 Message Bubble Styling Test Completed!');
  };
  
  runAllTests();
}

window.testMessageBubbleStyling = testMessageBubbleStyling;
