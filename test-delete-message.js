// Test script สำหรับทดสอบระบบลบข้อความ (Unsend Message)
function testDeleteMessage() {
  console.log('🗑️ Testing Delete Message System...');
  
  // 1. ตรวจสอบว่ามีปุ่มลบสำหรับข้อความของตัวเองหรือไม่
  const checkDeleteButtons = () => {
    console.log('🔍 Checking delete buttons...');
    
    const messageElements = document.querySelectorAll('.space-y-4 > div');
    let myMessagesCount = 0;
    let deleteButtonsCount = 0;
    
    messageElements.forEach((element, index) => {
      const isMe = element.querySelector('.ml-auto');
      
      if (isMe) {
        myMessagesCount++;
        console.log(`👤 My message ${myMessagesCount}:`);
        
        // ตรวจสอบปุ่มลบ
        const deleteButtons = element.querySelectorAll('button');
        const hasDeleteButton = Array.from(deleteButtons).some(btn => 
          btn.disabled === false && 
          btn.innerHTML.includes('Trash2') || 
          btn.querySelector('.lucide-trash2')
        );
        
        if (hasDeleteButton) {
          deleteButtonsCount++;
          console.log('  ✅ Has delete button');
        } else {
          console.log('  ❌ No delete button found');
        }
        
        // ตรวจสอบว่าปุ่มลบอยู่ในตำแหน่งที่ถูกต้อง
        const deleteButton = element.querySelector('button[disabled]:has(.lucide-trash2), button:not([disabled]):has(.lucide-trash2)');
        if (deleteButton) {
          const parentRect = deleteButton.parentElement.getBoundingClientRect();
          const buttonRect = deleteButton.getBoundingClientRect();
          
          console.log('  📍 Delete button position:');
          console.log('    - Parent width:', parentRect.width);
          console.log('    - Button top:', buttonRect.top - parentRect.top);
          console.log('    - Button right:', parentRect.right - buttonRect.right);
          
          // ตรวจสอบว่าอยู่มุมขวาบนหรือไม่
          const isTopRight = (buttonRect.top - parentRect.top) < 20 && 
                           (parentRect.right - buttonRect.right) < 20;
          
          console.log('    - Is top-right positioned:', isTopRight);
        }
      }
    });
    
    console.log('📊 Delete buttons summary:');
    console.log('  👤 My messages found:', myMessagesCount);
    console.log('  🗑️ Delete buttons found:', deleteButtonsCount);
    console.log('  ✅ All my messages have delete buttons:', myMessagesCount === deleteButtonsCount);
    
    return { myMessagesCount, deleteButtonsCount };
  };
  
  // 2. ทดสอบการคลิกปุ่มลบ
  const testDeleteButtonClick = () => {
    console.log('🖱️ Testing delete button click...');
    
    const deleteButtons = document.querySelectorAll('button:not([disabled])');
    let clickableDeleteButtons = 0;
    
    deleteButtons.forEach((button, index) => {
      const hasTrashIcon = button.querySelector('.lucide-trash2') || 
                          button.innerHTML.includes('Trash2');
      
      if (hasTrashIcon) {
        clickableDeleteButtons++;
        console.log(`🗑️ Delete button ${clickableDeleteButtons}:`);
        
        // ตรวจสอบว่ามี onClick handler หรือไม่
        const hasClickHandler = button.onclick !== null;
        console.log('  🖱️ Has click handler:', hasClickHandler);
        
        // ตรวจสอบ disabled state
        const isDisabled = button.disabled;
        console.log('  🔒 Is disabled:', isDisabled);
        
        // ตรวจสอบ styling
        const computedStyle = window.getComputedStyle(button);
        const backgroundColor = computedStyle.backgroundColor;
        const isRedButton = backgroundColor.includes('220') || backgroundColor.includes('239') || backgroundColor.includes('244');
        
        console.log('  🎨 Is red button:', isRedButton);
        console.log('  🎨 Background color:', backgroundColor);
      }
    });
    
    console.log('🖱️ Clickable delete buttons found:', clickableDeleteButtons);
    return clickableDeleteButtons;
  };
  
  // 3. ทดสอบ Modal การยืนยันการลบ
  const testDeleteModal = () => {
    console.log('📋 Testing delete confirmation modal...');
    
    // ตรวจสอบว่ามี modal หรือไม่
    const modal = document.querySelector('.fixed.inset-0');
    
    if (modal) {
      console.log('✅ Delete modal found');
      
      // ตรวจสอบเนื้อหาใน modal
      const modalTitle = modal.querySelector('h3');
      const modalText = modal.querySelector('p');
      const cancelButton = modal.querySelector('button[variant="outline"]');
      const deleteButton = modal.querySelector('button[variant="destructive"]');
      
      console.log('📋 Modal content:');
      console.log('  📝 Title:', modalTitle?.textContent);
      console.log('  📄 Text:', modalText?.textContent);
      console.log('  ❌ Cancel button:', !!cancelButton);
      console.log('  🗑️ Delete button:', !!deleteButton);
      
      // ตรวจสอบว่า modal อยู่ด้านบนสุด (z-index)
      const modalStyle = window.getComputedStyle(modal);
      const zIndex = modalStyle.zIndex;
      console.log('  🏗️ Modal z-index:', zIndex);
      
      return true;
    } else {
      console.log('⚠️ No delete modal found (may need to click delete button first)');
      return false;
    }
  };
  
  // 4. ทดสอบการลบข้อความจริง
  const testMessageDeletion = () => {
    console.log('🗑️ Testing actual message deletion...');
    
    // นับจำนวนข้อความก่อนลบ
    const messagesBefore = document.querySelectorAll('.space-y-4 > div').length;
    console.log('📊 Messages before deletion:', messagesBefore);
    
    // หาปุ่มลบของข้อความแรก
    const firstDeleteButton = document.querySelector('button:not([disabled]):has(.lucide-trash2)');
    
    if (firstDeleteButton) {
      console.log('🗑️ Found first delete button, simulating click...');
      
      // จำลองการคลิกปุ่มลบ
      firstDeleteButton.click();
      
      // รอสักครู่แล้วตรวจสอบ modal
      setTimeout(() => {
        const modal = document.querySelector('.fixed.inset-0');
        if (modal) {
          console.log('✅ Modal opened after delete button click');
          
          // หาปุ่มลบใน modal
          const modalDeleteButton = modal.querySelector('button[variant="destructive"]');
          if (modalDeleteButton) {
            console.log('🗑️ Found modal delete button, simulating confirmation...');
            
            // จำลองการคลิกปุ่มยืนยันลบ
            modalDeleteButton.click();
            
            // รอสักครู่แล้วตรวจสอบผลลัพธ์
            setTimeout(() => {
              const messagesAfter = document.querySelectorAll('.space-y-4 > div').length;
              console.log('📊 Messages after deletion:', messagesAfter);
              
              if (messagesAfter < messagesBefore) {
                console.log('✅ Message deletion successful');
                console.log('📉 Messages reduced by:', messagesBefore - messagesAfter);
              } else {
                console.log('⚠️ Message count unchanged (may need Realtime update)');
              }
            }, 2000);
          }
        }
      }, 500);
      
      return true;
    } else {
      console.log('❌ No delete button found to test');
      return false;
    }
  };
  
  // 5. ทดสอบ Realtime update
  const testRealtimeUpdate = () => {
    console.log('🔄 Testing Realtime update after deletion...');
    
    console.log('💡 Expected behavior after deletion:');
    console.log('  🗑️ Message should disappear from all users screens');
    console.log('  🔄 No page refresh required');
    console.log('  📊 Message count should update automatically');
    console.log('  🖼️ If message had image, image should be deleted from storage');
    
    console.log('📋 Expected console logs:');
    console.log('  🗑️ Deleting message: [message-id]');
    console.log('  🖼️ Message has image: [true/false]');
    console.log('  ✅ Message deleted from database successfully');
    console.log('  🖼️ Deleting image from storage... (if had image)');
    console.log('  ✅ Image deleted from storage successfully (if had image)');
    console.log('  ✅ Message removed from local state');
    console.log('  🎉 Toast: "ลบข้อความสำเร็จ"');
  };
  
  // 6. รันการทดสอบทั้งหมด
  const runAllTests = () => {
    console.log('🚀 Starting Delete Message System Test...\n');
    
    const buttonTest = checkDeleteButtons();
    console.log('');
    
    const clickTest = testDeleteButtonClick();
    console.log('');
    
    const modalTest = testDeleteModal();
    console.log('');
    
    testRealtimeUpdate();
    console.log('');
    
    // สรุปผล
    console.log('📊 Test Summary:');
    console.log('  👤 My messages:', buttonTest.myMessagesCount);
    console.log('  🗑️ Delete buttons:', buttonTest.deleteButtonsCount);
    console.log('  🖱️ Clickable buttons:', clickTest);
    console.log('  📋 Modal found:', modalTest);
    
    console.log('\n🎯 Expected Results:');
    console.log('  ✅ Delete buttons only on my messages');
    console.log('  ✅ Delete buttons in top-right corner');
    console.log('  ✅ Red delete buttons with trash icon');
    console.log('  ✅ Click opens confirmation modal');
    console.log('  ✅ Modal has cancel and delete buttons');
    console.log('  ✅ Delete removes message from database');
    console.log('  ✅ Images deleted from storage (if present)');
    console.log('  ✅ Realtime update removes message from all screens');
    
    console.log('\n💡 Manual Test Instructions:');
    console.log('  1. ส่งข้อความจากบัญชีของคุณ');
    console.log('  2. ตรวจสอบว่ามีปุ่มถังขยะที่มุมขวาบน');
    console.log('  3. คลิกปุ่มถังขยะ');
    console.log('  4. ตรวจสอบว่า Modal แสดงขึ้น');
    console.log('  5. คลิก "ลบข้อความ" เพื่อยืนยัน');
    console.log('  6. ตรวจสอบว่าข้อความหายไปทันที');
    console.log('  7. ทดสอบกับข้อความที่มีรูปภาพ');
    console.log('  8. ตรวจสอบว่ารูปภาพถูกลบจาก Storage');
    
    console.log('\n🏁 Delete Message System Test Completed!');
    
    // เสนอให้ทดสอบการลบจริง
    setTimeout(() => {
      console.log('\n💡 Would you like to test actual deletion?');
      console.log('👉 Run: testMessageDeletion()');
    }, 1000);
  };
  
  runAllTests();
}

window.testDeleteMessage = testDeleteMessage;
window.testMessageDeletion = testMessageDeletion;
