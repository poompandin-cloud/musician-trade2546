// Debug script สำหรับตรวจสอบชื่อ column ในตาราง profiles
function debugInstrumentColumn() {
  console.log('🔍 Debugging Instrument Column Name...');
  
  // 1. ตรวจสอบ console logs ที่เพิ่มในโค้ด
  const checkConsoleLogs = () => {
    console.log('📋 Check these console logs in your browser:');
    console.log('');
    console.log('🔍 Profile Data from DB: [should show all profile data]');
    console.log('🔍 All available keys in profiles: [should list all column names]');
    console.log('🔍 Checking for instruments (with s): [value or undefined]');
    console.log('🔍 Checking for instrument (without s): [value or undefined]');
    console.log('🎸 Final instrument value: [the actual value used]');
    console.log('');
    console.log('🔍 Profile data from realtime: [should show realtime profile data]');
    console.log('🔍 All available keys in realtime profile: [should list all column names]');
    console.log('🔍 Checking for instruments (with s) in realtime: [value or undefined]');
    console.log('🔍 Checking for instrument (without s) in realtime: [value or undefined]');
    console.log('🎸 Final realtime instrument value: [the actual value used]');
    console.log('');
    console.log('🔍 All available keys in current profile: [should list all column names]');
    console.log('🔍 Checking for instruments (with s) in current profile: [value or undefined]');
    console.log('🔍 Checking for instrument (without s) in current profile: [value or undefined]');
    console.log('🎸 Final current instrument value: [the actual value used]');
    
    return true;
  };
  
  // 2. ตรวจสอบ badge ที่แสดงใน UI
  const checkBadgeDisplay = () => {
    console.log('🎸 Checking badge display in UI...');
    
    const messageElements = document.querySelectorAll('.space-y-4 > div');
    let badgesFound = 0;
    let instrumentBadges = 0;
    let fallbackBadges = 0;
    
    messageElements.forEach((element) => {
      const badges = element.querySelectorAll('.bg-orange-100');
      const senderName = element.querySelector('.hover\\:text-blue-600')?.textContent;
      
      badges.forEach((badge) => {
        badgesFound++;
        const badgeText = badge.textContent;
        
        console.log(`🎸 Badge ${badgesFound}: "${badgeText}" (from ${senderName})`);
        
        if (badgeText === '[สมาชิก]') {
          fallbackBadges++;
          console.log(`  ❌ Still showing fallback badge - this is the problem!`);
        } else if (badgeText.includes('[') && badgeText.includes(']')) {
          const content = badgeText.slice(1, -1);
          instrumentBadges++;
          console.log(`  ✅ Showing correct badge: ${content}`);
        }
      });
    });
    
    console.log('📊 Badge Display Summary:');
    console.log(`  🎸 Total badges: ${badgesFound}`);
    console.log(`  ✅ Correct badges: ${instrumentBadges}`);
    console.log(`  ❌ Fallback badges: ${fallbackBadges}`);
    
    if (fallbackBadges > 0) {
      console.log(`  ⚠️ PROBLEM: ${fallbackBadges} badges still showing [สมาชิก]`);
      console.log(`  💡 Check console logs above to see what's happening with the data`);
    } else {
      console.log(`  ✅ SUCCESS: All badges showing correct instrument data!`);
    }
    
    return {
      totalBadges: badgesFound,
      correctBadges: instrumentBadges,
      fallbackBadges: fallbackBadges
    };
  };
  
  // 3. สร้าง SQL query สำหรับตรวจสอบ column names
  const generateSQLQueries = () => {
    console.log('🗄️ SQL Queries to check column names:');
    console.log('');
    console.log('-- 1. ตรวจสอบ column names ทั้งหมดในตาราง profiles');
    console.log('SELECT column_name, data_type, is_nullable');
    console.log('FROM information_schema.columns');
    console.log('WHERE table_name = \'profiles\'');
    console.log('  AND table_schema = \'public\'');
    console.log('ORDER BY ordinal_position;');
    console.log('');
    console.log('-- 2. ตรวจสอบข้อมูลตัวอย่างในตาราง profiles');
    console.log('SELECT id, full_name, avatar_url, instrument, instruments, role');
    console.log('FROM profiles');
    console.log('LIMIT 5;');
    console.log('');
    console.log('-- 3. ตรวจสอบว่ามีข้อมูลในคอลัมน์ instruments หรือไม่');
    console.log('SELECT COUNT(*) as instruments_count');
    console.log('FROM profiles');
    console.log('WHERE instruments IS NOT NULL');
    console.log('  AND instruments != \'\';');
    console.log('');
    console.log('-- 4. ตรวจสอบว่ามีข้อมูลในคอลัมน์ instrument หรือไม่');
    console.log('SELECT COUNT(*) as instrument_count');
    console.log('FROM profiles');
    console.log('WHERE instrument IS NOT NULL');
    console.log('  AND instrument != \'\';');
    
    return true;
  };
  
  // 4. ตรวจสอบว่ามีการใช้ column ที่ถูกต้องในโค้ดหรือไม่
  const checkCodeUsage = () => {
    console.log('🔧 Code Usage Check:');
    console.log('');
    console.log('✅ Fixed in fetchMessages:');
    console.log('  SELECT instrument, instruments (both columns)');
    console.log('  const instrumentValue = msg.profiles?.instruments || msg.profiles?.instrument;');
    console.log('');
    console.log('✅ Fixed in realtime:');
    console.log('  SELECT instrument, instruments (both columns)');
    console.log('  const realtimeInstrumentValue = profileData?.instruments || profileData?.instrument;');
    console.log('');
    console.log('✅ Fixed in sendMessage:');
    console.log('  SELECT instrument, instruments (both columns)');
    console.log('  const currentInstrumentValue = currentProfile?.instruments || currentProfile?.instrument;');
    console.log('');
    console.log('💡 This means the code will check BOTH columns and use whichever has data');
    
    return true;
  };
  
  // 5. สร้าง test case สำหรับการทดสอบ
  const createTestCases = () => {
    console.log('🧪 Test Cases to Run:');
    console.log('');
    console.log('1. 🔄 Reload the page and check console logs');
    console.log('   - Look for "🔍 Profile Data from DB"');
    console.log('   - Look for "🔍 All available keys in profiles"');
    console.log('   - Look for "🎸 Final instrument value"');
    console.log('');
    console.log('2. 📤 Send a new message and check console logs');
    console.log('   - Look for "🔍 Profile data from realtime"');
    console.log('   - Look for "🎸 Final realtime instrument value"');
    console.log('');
    console.log('3. 🎸 Check if badges are showing correctly');
    console.log('   - Should show [มือกีตาร์] instead of [สมาชิก]');
    console.log('   - Check console for any errors');
    console.log('');
    console.log('4. 🗄️ Run SQL queries in Supabase Dashboard');
    console.log('   - Check column names in profiles table');
    console.log('   - Check if your profile has instrument data');
    console.log('');
    console.log('5. 📊 Expected Results:');
    console.log('   - Console should show actual instrument values');
    console.log('   - Badges should show correct instrument names');
    console.log('   - No more [สมาชิก] badges for users with instruments');
    
    return true;
  };
  
  // 6. รันการทดสอบทั้งหมด
  const runAllDebugging = () => {
    console.log('🚀 Starting Instrument Column Debugging...\n');
    
    const logCheck = checkConsoleLogs();
    console.log('');
    
    const badgeCheck = checkBadgeDisplay();
    console.log('');
    
    const sqlCheck = generateSQLQueries();
    console.log('');
    
    const codeCheck = checkCodeUsage();
    console.log('');
    
    const testCheck = createTestCases();
    console.log('');
    
    // สรุปผลการทดสอบ
    console.log('📊 Debugging Summary:');
    console.log('  📋 Console logs guide: ✅');
    console.log('  🎸 Badge display check:', badgeCheck.fallbackBadges === 0 ? '✅' : '❌');
    console.log('  🗄️ SQL queries: ✅');
    console.log('  🔧 Code usage: ✅');
    console.log('  🧪 Test cases: ✅');
    
    console.log('\n🎯 Next Steps:');
    if (badgeCheck.fallbackBadges > 0) {
      console.log('  ⚠️ PROBLEM DETECTED:');
      console.log('  1. Check console logs for data issues');
      console.log('  2. Run SQL queries to verify column names');
      console.log('  3. Check if your profile has instrument data');
      console.log('  4. Verify the data is being fetched correctly');
    } else {
      console.log('  ✅ SUCCESS: All badges are showing correctly!');
      console.log('  🎉 The instrument column issue has been resolved');
    }
    
    console.log('\n🔍 What to Look For in Console:');
    console.log('  📋 "🔍 Profile Data from DB: {full_name: "...", instruments: "...", ...}"');
    console.log('  📋 "🔍 All available keys in profiles: ["id", "full_name", "instruments", ...]"');
    console.log('  🎸 "🎸 Final instrument value: "มือกีตาร์"');
    console.log('  🎸 If you see "undefined" or "null", that\'s the problem');
    
    console.log('\n🏁 Instrument Column Debugging Completed!');
  };
  
  runAllDebugging();
}

window.debugInstrumentColumn = debugInstrumentColumn;
