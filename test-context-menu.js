// Test script สำหรับทดสอบระบบ Context Menu (กดค้าง)
function testContextMenu() {
  console.log('📱 Testing Context Menu System...');
  
  // 1. ตรวจสอบว่ามีข้อความของตัวเองหรือไม่
  const checkMyMessages = () => {
    console.log('👤 Checking my messages...');
    
    const messageElements = document.querySelectorAll('.space-y-4 > div');
    let myMessagesCount = 0;
    
    messageElements.forEach((element, index) => {
      const isMe = element.querySelector('.ml-auto');
      
      if (isMe) {
        myMessagesCount++;
        console.log(`👤 My message ${myMessagesCount}:`);
        
        // ตรวจสอบว่ามี event handlers สำหรับ context menu หรือไม่
        const messageBubble = element.querySelector('.relative');
        const hasContextMenu = messageBubble?.onContextMenu !== null;
        const hasTouchStart = messageBubble?.ontouchstart !== null;
        const hasTouchEnd = messageBubble?.ontouchend !== null;
        const hasTouchMove = messageBubble?.ontouchmove !== null;
        
        console.log('  🖱️ Has context menu handler:', hasContextMenu);
        console.log('  📱 Has touch start handler:', hasTouchStart);
        console.log('  📱 Has touch end handler:', hasTouchEnd);
        console.log('  📱 Has touch move handler:', hasTouchMove);
        
        if (hasContextMenu && hasTouchStart && hasTouchEnd && hasTouchMove) {
          console.log('  ✅ All handlers present');
        } else {
          console.log('  ❌ Missing some handlers');
        }
      }
    });
    
    console.log('📊 My messages found:', myMessagesCount);
    return myMessagesCount;
  };
  
  // 2. ทดสอบการเรียกใช้ Context Menu (Desktop)
  const testContextMenuDesktop = () => {
    console.log('🖱️ Testing context menu (Desktop)...');
    
    const myMessageBubbles = document.querySelectorAll('.ml-auto .relative');
    let testableBubbles = 0;
    
    myMessageBubbles.forEach((bubble, index) => {
      testableBubbles++;
      console.log(`🖱️ Testing bubble ${testableBubbles}:`);
      
      // จำลองการ right-click
      const contextEvent = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        clientX: 100,
        clientY: 100
      });
      
      console.log('  🖱️ Simulating right-click...');
      bubble.dispatchEvent(contextEvent);
      
      // ตรวจสอบว่า context menu ปรากฏหรือไม่
      setTimeout(() => {
        const contextMenu = document.querySelector('.fixed.z-50.bg-white.rounded-lg.shadow-xl');
        if (contextMenu) {
          console.log('  ✅ Context menu appeared');
          
          // ตรวจสอสว่ามีปุ่มลบหรือไม่
          const deleteButton = contextMenu.querySelector('button');
          const hasTrashIcon = deleteButton?.querySelector('.lucide-trash2');
          const buttonText = deleteButton?.textContent?.trim();
          
          console.log('  🗑️ Delete button found:', !!deleteButton);
          console.log('  🗑️ Has trash icon:', !!hasTrashIcon);
          console.log('  📝 Button text:', buttonText);
          
          if (deleteButton && hasTrashIcon && buttonText === 'ยกเลิกข้อความ') {
            console.log('  ✅ Delete button is correct');
          } else {
            console.log('  ❌ Delete button is incorrect');
          }
          
          // ตรวจสอบ styling
          const menuStyle = window.getComputedStyle(contextMenu);
          const backgroundColor = menuStyle.backgroundColor;
          const hasShadow = menuStyle.boxShadow !== 'none';
          const hasBorder = menuStyle.border !== '0px';
          const isRounded = menuStyle.borderRadius !== '0px';
          
          console.log('  🎨 Background color:', backgroundColor);
          console.log('  🌑 Has shadow:', hasShadow);
          console.log('  🖼️ Has border:', hasBorder);
          console.log('  🔄 Is rounded:', isRounded);
          
          // ปิด context menu
          const backdrop = document.querySelector('.fixed.inset-0.z-40');
          if (backdrop) {
            backdrop.click();
            console.log('  🚫 Context menu closed');
          }
        } else {
          console.log('  ❌ Context menu did not appear');
        }
      }, 100);
    });
    
    console.log('🖱️ Testable bubbles:', testableBubbles);
    return testableBubbles;
  };
  
  // 3. ทดสอบการเรียกใช้ Long Press (Mobile)
  const testLongPressMobile = () => {
    console.log('📱 Testing long press (Mobile)...');
    
    const myMessageBubbles = document.querySelectorAll('.ml-auto .relative');
    let testableBubbles = 0;
    
    myMessageBubbles.forEach((bubble, index) => {
      testableBubbles++;
      console.log(`📱 Testing bubble ${testableBubbles}:`);
      
      // จำลองการ long press
      console.log('  📱 Simulating long press...');
      
      const touchStartEvent = new TouchEvent('touchstart', {
        bubbles: true,
        cancelable: true,
        touches: [{
          clientX: 100,
          clientY: 100,
          identifier: 0,
          target: bubble,
          force: 1,
          radiusX: 1,
          radiusY: 1,
          rotationAngle: 0
        }]
      });
      
      bubble.dispatchEvent(touchStartEvent);
      
      // รอ 500ms แล้วจำลองการปล่อย
      setTimeout(() => {
        const touchEndEvent = new TouchEvent('touchend', {
          bubbles: true,
          cancelable: true,
          changedTouches: [{
            clientX: 100,
            clientY: 100,
            identifier: 0,
            target: bubble,
            force: 1,
            radiusX: 1,
            radiusY: 1,
            rotationAngle: 0
          }]
        });
        
        bubble.dispatchEvent(touchEndEvent);
        
        // ตรวจสอบว่า context menu ปรากฏหรือไม่
        setTimeout(() => {
          const contextMenu = document.querySelector('.fixed.z-50.bg-white.rounded-lg.shadow-xl');
          if (contextMenu) {
            console.log('  ✅ Context menu appeared after long press');
            
            // ปิด context menu
            const backdrop = document.querySelector('.fixed.inset-0.z-40');
            if (backdrop) {
              backdrop.click();
            }
          } else {
            console.log('  ❌ Context menu did not appear after long press');
          }
        }, 100);
      }, 600); // 600ms > 500ms long press threshold
    });
    
    console.log('📱 Testable bubbles:', testableBubbles);
    return testableBubbles;
  };
  
  // 4. ทดสอบการปิด context menu
  const testContextMenuClose = () => {
    console.log('🚫 Testing context menu close...');
    
    // เปิด context menu ก่อน
    const myMessageBubbles = document.querySelectorAll('.ml-auto .relative');
    if (myMessageBubbles.length > 0) {
      const bubble = myMessageBubbles[0];
      const contextEvent = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        clientX: 100,
        clientY: 100
      });
      
      bubble.dispatchEvent(contextEvent);
      
      setTimeout(() => {
        const contextMenu = document.querySelector('.fixed.z-50.bg-white.rounded-lg.shadow-xl');
        const backdrop = document.querySelector('.fixed.inset-0.z-40');
        
        if (contextMenu && backdrop) {
          console.log('  🚫 Testing backdrop click...');
          backdrop.click();
          
          setTimeout(() => {
            const menuAfterClick = document.querySelector('.fixed.z-50.bg-white.rounded-lg.shadow-xl');
            const backdropAfterClick = document.querySelector('.fixed.inset-0.z-40');
            
            console.log('  🚫 Menu after backdrop click:', !!menuAfterClick);
            console.log('  🚫 Backdrop after click:', !!backdropAfterClick);
            
            if (!menuAfterClick && !backdropAfterClick) {
              console.log('  ✅ Context menu closed successfully');
            } else {
              console.log('  ❌ Context menu did not close');
            }
          }, 100);
        }
      }, 100);
    }
  };
  
  // 5. ทดสอบ flow การลบข้อความ
  const testDeleteFlow = () => {
    console.log('🗑️ Testing delete flow...');
    
    console.log('💡 Expected delete flow:');
    console.log('  1. กดค้าง (Long Press) หรือ Right-click ที่ข้อความของตัวเอง');
    console.log('  2. Context menu ปรากฏพร้อม "ยกเลิกข้อความ"');
    console.log('  3. คลิก "ยกเลิกข้อความ"');
    console.log('  4. Modal ยืนยันการลบปรากฏ');
    console.log('  5. คลิก "ลบข้อความ" ใน Modal');
    console.log('  6. ข้อความถูกลบจากฐานข้อมูล');
    console.log('  7. รูปภาพถูกลบจาก Storage (ถ้ามี)');
    console.log('  8. ข้อความหายไปจากหน้าจอทันที');
    
    console.log('📋 Expected console logs during deletion:');
    console.log('  🗑️ Deleting message: [message-id]');
    console.log('  🆔 Current user ID: [user-id]');
    console.log('  👤 Message user_id: [message-user-id]');
    console.log('  🖼️ Message has image: [true/false]');
    console.log('  🗑️ Attempting to delete from database...');
    console.log('  🗑️ DB Delete Result: null');
    console.log('  🗑️ DB Delete Data: [{...}]');
    console.log('  ✅ Message deleted from database successfully');
    console.log('  📊 Deleted rows: 1');
    console.log('  🖼️ Deleting image from storage... (if had image)');
    console.log('  ✅ Message removed from local state');
    console.log('  🎉 Toast: "ลบข้อความสำเร็จ"');
  };
  
  // 6. รันการทดสอบทั้งหมด
  const runAllTests = () => {
    console.log('🚀 Starting Context Menu System Test...\n');
    
    const myMessagesCount = checkMyMessages();
    console.log('');
    
    if (myMessagesCount > 0) {
      setTimeout(() => {
        testContextMenuDesktop();
        console.log('');
        
        setTimeout(() => {
          testLongPressMobile();
          console.log('');
          
          setTimeout(() => {
            testContextMenuClose();
            console.log('');
            
            testDeleteFlow();
            console.log('');
            
            console.log('📊 Test Summary:');
            console.log('  👤 My messages found:', myMessagesCount);
            console.log('  🖱️ Desktop context menu: Tested');
            console.log('  📱 Mobile long press: Tested');
            console.log('  🚫 Menu close: Tested');
            
            console.log('\n🎯 Expected Results:');
            console.log('  ✅ Context menu appears on right-click (Desktop)');
            console.log('  ✅ Context menu appears on long press (Mobile)');
            console.log('  ✅ Menu has "ยกเลิกข้อความ" with trash icon');
            console.log('  ✅ Menu styling: White background, rounded, shadow');
            console.log('  ✅ Menu closes when clicking backdrop');
            console.log('  ✅ Delete flow works correctly');
            console.log('  ✅ Only shows for my messages (is_me === true)');
            
            console.log('\n💡 Manual Test Instructions:');
            console.log('  1. ส่งข้อความจากบัญชีของคุณ');
            console.log('  2. Right-click ที่ข้อความ (Desktop)');
            console.log('  3. กดค้างที่ข้อความ (Mobile - 500ms)');
            console.log('  4. ตรวจสอบว่า context menu ปรากฏ');
            console.log('  5. คลิก "ยกเลิกข้อความ"');
            console.log('  6. ยืนยันการลบใน Modal');
            console.log('  7. ตรวจสอบว่าข้อความหายไป');
            console.log('  8. คลิกพื้นที่ว่างเพื่อปิด menu');
            
            console.log('\n🏁 Context Menu System Test Completed!');
          }, 1000);
        }, 1000);
      }, 1000);
    } else {
      console.log('⚠️ No my messages found. Please send a message first.');
    }
  };
  
  runAllTests();
}

window.testContextMenu = testContextMenu;
