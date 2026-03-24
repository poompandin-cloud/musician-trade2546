// Test script สำหรับทดสอบลำดับการแสดงผลในหน้าโปรไฟล์
// รันใน browser console

function testLayoutOrder() {
  console.log('📋 Testing profile page layout order...');
  
  // 1. ตรวจสอบลำดับการแสดงผลของ sections ต่างๆ
  console.log('🔍 Checking section order...');
  
  const sections = [
    { name: 'Profile Info', selector: '[data-testid="profile-info"]' },
    { name: 'Contact Info', selector: '[data-testid="contact-info"]' },
    { name: 'About', selector: '[data-testid="about-section"]' },
    { name: 'Calendar', selector: '[data-testid="calendar-section"]' },
    { name: 'Comments', selector: '[data-testid="profile-comments"]' },
    { name: 'My Jobs', selector: '[data-testid="my-jobs-section"]' },
    { name: 'Confirmed Applications', selector: '[data-testid="confirmed-applications"]' },
    { name: 'Logout Button', selector: '[data-testid="logout-button"]' }
  ];
  
  const foundSections = [];
  
  sections.forEach((section, index) => {
    const element = document.querySelector(section.selector);
    if (element) {
      const rect = element.getBoundingClientRect();
      foundSections.push({
        name: section.name,
        element: element,
        top: rect.top,
        order: index,
        visible: rect.top > 0 && rect.top < window.innerHeight
      });
    }
  });
  
  // 2. เรียงลำดับตามตำแหน่งจริงบนหน้า
  foundSections.sort((a, b) => a.top - b.top);
  
  console.log('📊 Section order on page:');
  foundSections.forEach((section, index) => {
    console.log(`${index + 1}. ${section.name} (top: ${section.top}px)`);
  });
  
  // 3. ตรวจสอบว่า Comments อยู่ก่อน My Jobs หรือไม่
  const commentsSection = foundSections.find(s => s.name === 'Comments');
  const myJobsSection = foundSections.find(s => s.name === 'My Jobs');
  
  if (commentsSection && myJobsSection) {
    if (commentsSection.top < myJobsSection.top) {
      console.log('✅ Comments section is correctly positioned above My Jobs');
    } else {
      console.log('❌ Comments section is below My Jobs (incorrect order)');
    }
    
    const distance = Math.abs(commentsSection.top - myJobsSection.top);
    console.log(`📏 Distance between Comments and My Jobs: ${distance}px`);
    
    if (distance >= 24) { // 24px = 1.5rem ≈ mb-6
      console.log('✅ Adequate spacing between sections');
    } else {
      console.log('⚠️ Sections might be too close together');
    }
  } else {
    console.log('❌ Could not find Comments or My Jobs sections');
  }
  
  // 4. ตรวจสอบว่าทั้งสองส่วนอยู่ใน Container เดียวกันหรือไม่
  console.log('🏗️ Checking container structure...');
  
  const commentsCard = document.querySelector('[data-testid="profile-comments"]');
  const myJobsCard = document.querySelector('[data-testid="my-jobs-section"]');
  
  if (commentsCard && myJobsCard) {
    const commentsParent = commentsCard.parentElement;
    const myJobsParent = myJobsCard.parentElement;
    
    console.log('📦 Comments container:', commentsParent?.tagName, commentsParent?.className);
    console.log('📦 My Jobs container:', myJobsParent?.tagName, myJobsParent?.className);
    
    if (commentsParent === myJobsParent) {
      console.log('✅ Both sections are in the same container');
    } else {
      console.log('⚠️ Sections are in different containers');
    }
    
    // ตรวจสอบว่าเป็น Card หรือไม่
    const commentsIsCard = commentsCard.classList.contains('card') || 
                          commentsCard.tagName.toLowerCase() === 'div' && 
                          commentsCard.querySelector('.card-header');
    const myJobsIsCard = myJobsCard.classList.contains('card') || 
                       myJobsCard.tagName.toLowerCase() === 'div' && 
                       myJobsCard.querySelector('.card-header');
    
    console.log(`🎨 Comments is Card: ${commentsIsCard}`);
    console.log(`🎨 My Jobs is Card: ${myJobsIsCard}`);
    
    if (commentsIsCard && myJobsIsCard) {
      console.log('✅ Both sections use Card components');
    } else {
      console.log('⚠️ Inconsistent component usage');
    }
  }
  
  // 5. ตรวจสอบความกว้างของทั้งสองส่วน
  if (commentsCard && myJobsCard) {
    const commentsWidth = commentsCard.offsetWidth;
    const myJobsWidth = myJobsCard.offsetWidth;
    
    console.log(`📏 Comments width: ${commentsWidth}px`);
    console.log(`📏 My Jobs width: ${myJobsWidth}px`);
    
    if (Math.abs(commentsWidth - myJobsWidth) < 10) {
      console.log('✅ Both sections have consistent widths');
    } else {
      console.log('⚠️ Width difference between sections');
    }
  }
  
  // 6. ตรวจสอบ margin/padding ระหว่าง sections
  console.log('📐 Checking spacing between sections...');
  
  const allCards = document.querySelectorAll('.card, [class*="Card"]');
  const cardMargins = [];
  
  for (let i = 0; i < allCards.length - 1; i++) {
    const currentCard = allCards[i];
    const nextCard = allCards[i + 1];
    
    const currentBottom = currentCard.getBoundingClientRect().bottom;
    const nextTop = nextCard.getBoundingClientRect().top;
    const gap = nextTop - currentBottom;
    
    cardMargins.push({
      from: currentCard.querySelector('.card-header, h2, h3')?.textContent || 'Unknown',
      to: nextCard.querySelector('.card-header, h2, h3')?.textContent || 'Unknown',
      gap: gap
    });
  }
  
  console.log('📏 Gaps between sections:');
  cardMargins.forEach(margin => {
    console.log(`  "${margin.from}" → "${margin.to}": ${margin.gap}px`);
  });
  
  // 7. ตรวจสอบ responsive behavior
  console.log('📱 Checking responsive layout...');
  const isMobile = window.innerWidth < 768;
  console.log(`📱 Screen size: ${window.innerWidth}px (${isMobile ? 'Mobile' : 'Desktop'})`);
  
  // 8. สรุปผลการทดสอบ
  console.log('📋 Layout test summary:');
  console.log(`  📊 Sections found: ${foundSections.length}`);
  console.log(`  📏 Average spacing: ${cardMargins.reduce((sum, m) => sum + m.gap, 0) / cardMargins.length}px`);
  console.log(`  📱 Current view: ${isMobile ? 'Mobile' : 'Desktop'}`);
  
  const issuesFound = [];
  
  if (commentsSection && myJobsSection && commentsSection.top > myJobsSection.top) {
    issuesFound.push('Comments section is below My Jobs');
  }
  
  if (cardMargins.some(m => m.gap < 20)) {
    issuesFound.push('Some sections are too close together');
  }
  
  if (issuesFound.length === 0) {
    console.log('✅ Layout looks good!');
  } else {
    console.log('⚠️ Issues found:', issuesFound);
  }
  
  console.log('📋 Layout order test completed!');
}

// รันการทดสอบ
testLayoutOrder();

// Export สำหรับใช้งาน
if (typeof window !== 'undefined') {
  window.testLayoutOrder = testLayoutOrder;
}
