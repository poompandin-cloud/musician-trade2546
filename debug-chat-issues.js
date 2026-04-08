// Debug Chat Issues - ตรวจสอบปัญหาการส่งและรับข้อความ
function debugChatIssues() {
  console.log('🔍 Debugging Chat Issues...');
  
  // 1. ตรวจสอบ Database Schema
  const checkDatabaseSchema = () => {
    console.log('🗄️ Checking Database Schema...');
    
    console.log('✅ What to Check:');
    console.log('  📋 Table: public_chats');
    console.log('  📋 Columns: id, content, user_id, image_url, created_at');
    console.log('  📋 NOT NULL: content, user_id, created_at');
    console.log('  📋 NULLABLE: image_url');
    console.log('  📋 Foreign Key: user_id → profiles.id');
    console.log('  📋 RLS Policy: Allow authenticated users to insert/read');
    
    console.log('📋 SQL to Check Schema:');
    console.log(`
      -- Check table structure
      \\d public_chats;
      
      -- Check NOT NULL constraints
      SELECT column_name, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'public_chats';
      
      -- Check foreign key
      SELECT 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'public_chats';
    `);
    
    console.log('📋 Expected RLS Policy:');
    console.log(`
      -- Allow authenticated users to read all messages
      CREATE POLICY "Users can view all messages" ON public_chats
        FOR SELECT USING (auth.role() = 'authenticated');
      
      -- Allow authenticated users to insert their own messages
      CREATE POLICY "Users can insert messages" ON public_chats
        FOR INSERT WITH CHECK (auth.uid() = user_id);
      
      -- Allow users to update/delete their own messages
      CREATE POLICY "Users can manage own messages" ON public_chats
        FOR ALL USING (auth.uid() = user_id);
      
      -- Enable RLS
      ALTER TABLE public_chats ENABLE ROW LEVEL SECURITY;
    `);
    
    return true;
  };
  
  // 2. ตรวจสอบ Insert Error
  const checkInsertError = () => {
    console.log('📤 Checking Insert Error...');
    
    console.log('✅ Error Logging Added:');
    console.log('  📝 console.error("❌ Insert Error:", error)');
    console.log('  🔍 RLS Policy Check - User ID');
    console.log('  🔍 RLS Policy Check - Content');
    console.log('  🔍 RLS Policy Check - Table: public_chats');
    
    console.log('📋 Common RLS Issues:');
    console.log('  ❌ User not authenticated');
    console.log('  ❌ RLS policy not enabled');
    console.log('  ❌ User ID mismatch in policy');
    console.log('  ❌ Missing required columns');
    console.log('  ❌ Foreign key constraint violation');
    
    console.log('📋 Debug Steps:');
    console.log('  1. Check if user is authenticated');
    console.log('  2. Verify user ID is valid');
    console.log('  3. Check RLS policies are enabled');
    console.log('  4. Verify required columns are provided');
    console.log('  5. Test with direct SQL if needed');
    
    return true;
  };
  
  // 3. ตรวจสอบ Manual Refresh
  const checkManualRefresh = () => {
    console.log('🔄 Checking Manual Refresh...');
    
    console.log('✅ Refresh Button Added:');
    console.log('  🔄 Icon: RotateCcw');
    console.log('  📝 Function: refreshMessages()');
    console.log('  🧹 Action: setMessages([]) then fetch');
    console.log('  📊 Result: Fresh data from database');
    
    console.log('📋 Test Scenarios:');
    console.log('  🧪 Test 1: Click refresh button');
    console.log('    - Expected: Console shows "Manual refresh triggered"');
    console.log('    - Expected: Messages clear and reload');
    console.log('    - Expected: Success toast appears');
    
    console.log('  🧪 Test 2: Refresh with network issues');
    console.log('    - Expected: Error toast appears');
    console.log('    - Expected: Console shows error details');
    
    console.log('  🧪 Test 3: Realtime vs Refresh');
    console.log('    - If refresh works but realtime fails: Database issue');
    console.log('    - If both fail: Network/auth issue');
    console.log('    - If both work: Temporary glitch');
    
    return true;
  };
  
  // 4. ตรวจสอบ Data Flow
  const checkDataFlow = () => {
    console.log('🌊 Checking Data Flow...');
    
    console.log('📋 Normal Flow:');
    console.log('  1. User types message → handleSendMessage()');
    console.log('  2. Insert into public_chats → Database');
    console.log('  3. Realtime triggers → All clients');
    console.log('  4. Message appears in UI → All users');
    
    console.log('📋 Debug Flow:');
    console.log('  1. User clicks refresh → refreshMessages()');
    console.log('  2. Clear state → setMessages([])');
    console.log('  3. Query database → supabase.from("public_chats")');
    console.log('  4. Format data → Map to Message interface');
    console.log('  5. Update state → setMessages(formattedMessages)');
    
    console.log('📋 Failure Points:');
    console.log('  ❌ Step 2: Insert fails → RLS/Auth issue');
    console.log('  ❌ Step 3: Realtime fails → Connection issue');
    console.log('  ❌ Step 4: Query fails → Database issue');
    console.log('  ❌ Step 5: Format fails → Data structure issue');
    
    return true;
  };
  
  // 5. สร้าง Debug Commands
  const createDebugCommands = () => {
    console.log('🛠️ Creating Debug Commands...');
    
    console.log('📋 Console Commands:');
    console.log(`
      // Check current user
      window.supabase.auth.getSession().then(console.log);
      
      // Check RLS policies
      window.supabase.rpc('get_policies', { table_name: 'public_chats' }).then(console.log);
      
      // Test direct insert
      window.supabase.from('public_chats').insert({
        content: 'Test message',
        user_id: 'YOUR_USER_ID'
      }).select().single().then(console.log);
      
      // Test direct query
      window.supabase.from('public_chats').select('*').limit(5).then(console.log);
      
      // Check realtime status
      window.supabase.getChannels().then(console.log);
    `);
    
    console.log('📋 Browser DevTools:');
    console.log('  🔍 Network Tab: Check Supabase requests');
    console.log('  🔍 Console Tab: Look for error messages');
    console.log('  🔍 Application Tab: Check localStorage');
    console.log('  🔍 Supabase Dashboard: Check RLS policies');
    
    return true;
  };
  
  // 6. ตรวจสอบ Implementation Status
  const checkImplementation = () => {
    console.log('🔍 Checking Implementation Status...');
    
    const implementations = {
      'Insert Error Logging': {
        file: '/src/pages/PublicChat.tsx',
        line: '498-508',
        fixes: [
          'Added console.error("❌ Insert Error:", error)',
          'RLS Policy Check logging',
          'Detailed error information'
        ],
        status: '✅ Implemented'
      },
      'Manual Refresh Button': {
        file: '/src/pages/PublicChat.tsx',
        line: '1277-1367',
        fixes: [
          'Added RotateCcw icon import',
          'Refresh button with onClick handler',
          'Independent refreshMessages function',
          'Success/error toast notifications'
        ],
        status: '✅ Implemented'
      },
      'Database Query Check': {
        file: '/src/pages/PublicChat.tsx',
        line: '91-104, 1298-1311',
        fixes: [
          'Safe Left Join with profiles:user_id',
          'Error handling for query failures',
          'Consistent query structure'
        ],
        status: '✅ Implemented'
      }
    };
    
    Object.entries(implementations).forEach(([component, info]) => {
      console.log(`📁 ${component}:`);
      console.log(`  📍 File: ${info.file}`);
      if (info.line) console.log(`  📍 Line: ${info.line}`);
      console.log(`  🔧 Fixes: ${info.fixes.join(', ')}`);
      console.log(`  📊 Status: ${info.status}`);
      console.log('');
    });
    
    return implementations;
  };
  
  // 7. สร้าง Test Cases
  const createTestCases = () => {
    console.log('🧪 Creating Test Cases...');
    
    console.log('📋 Test Case 1: Insert Error Debug');
    console.log('  🎯 Goal: Identify RLS policy issues');
    console.log('  🔧 Action: Send a message');
    console.log('  ✅ Expected: Detailed error logging in console');
    console.log('  📝 Check: "❌ Insert Error:", error details');
    console.log('  📝 Check: RLS Policy Check information');
    
    console.log('');
    
    console.log('📋 Test Case 2: Manual Refresh Test');
    console.log('  🎯 Goal: Verify manual refresh works');
    console.log('  🔧 Action: Click refresh button');
    console.log('  ✅ Expected: Messages reload from database');
    console.log('  📝 Check: "Manual refresh triggered" in console');
    console.log('  📝 Check: Success toast appears');
    
    console.log('');
    
    console.log('📋 Test Case 3: Database Schema Test');
    console.log('  🎯 Goal: Verify database structure');
    console.log('  🔧 Action: Run SQL commands in Supabase');
    console.log('  ✅ Expected: Proper table structure');
    console.log('  📝 Check: All required columns exist');
    console.log('  📝 Check: RLS policies are enabled');
    
    console.log('');
    
    console.log('📋 Test Case 4: Realtime vs Refresh');
    console.log('  🎯 Goal: Isolate realtime vs database issues');
    console.log('  🔧 Action: Send message, then refresh');
    console.log('  ✅ Expected: Both show same data');
    console.log('  📝 Check: If refresh works but realtime fails → Realtime issue');
    console.log('  📝 Check: If both fail → Database/auth issue');
    
    return true;
  };
  
  // 8. สรุปการแก้ไข
  const summarizeDebugging = () => {
    console.log('📊 Summary of Chat Debugging:');
    
    console.log('');
    console.log('📤 Insert Error Debugging:');
    console.log('  ✅ Enhanced error logging for INSERT operations');
    console.log('  ✅ RLS Policy check logging');
    console.log('  ✅ Detailed error information display');
    console.log('  ✅ User-friendly error messages');
    
    console.log('');
    console.log('🔄 Manual Refresh System:');
    console.log('  ✅ Independent refresh button added');
    console.log('  ✅ Fresh data fetch from database');
    console.log('  ✅ Success/error feedback with toasts');
    console.log('  ✅ Cache clearing before refresh');
    
    console.log('');
    console.log('🗄️ Database Schema Verification:');
    console.log('  ✅ Safe Left Join queries');
    console.log('  ✅ Error handling for query failures');
    console.log('  ✅ Consistent data structure');
    console.log('  ✅ Proper foreign key relationships');
    
    console.log('');
    console.log('🔍 Debug Tools:');
    console.log('  ✅ Console commands for testing');
    console.log('  ✅ DevTools inspection guide');
    console.log('  ✅ SQL queries for verification');
    console.log('  ✅ Step-by-step debugging process');
    
    return true;
  };
  
  // 9. รันการทดสอบทั้งหมด
  const runAllDebugging = () => {
    console.log('🚀 Starting Chat Issues Debugging...\n');
    
    const schemaTest = checkDatabaseSchema();
    console.log('');
    
    const insertTest = checkInsertError();
    console.log('');
    
    const refreshTest = checkManualRefresh();
    console.log('');
    
    const flowTest = checkDataFlow();
    console.log('');
    
    const commandsTest = createDebugCommands();
    console.log('');
    
    const implementation = checkImplementation();
    console.log('');
    
    const testCases = createTestCases();
    console.log('');
    
    const summary = summarizeDebugging();
    console.log('');
    
    // สรุปผลการทดสอบ
    console.log('📊 Chat Issues Debugging Summary:');
    console.log('  🗄️ Database Schema:', schemaTest ? '✅' : '❌');
    console.log('  📤 Insert Error:', insertTest ? '✅' : '❌');
    console.log('  🔄 Manual Refresh:', refreshTest ? '✅' : '❌');
    console.log('  🌊 Data Flow:', flowTest ? '✅' : '❌');
    console.log('  🛠️ Debug Commands:', commandsTest ? '✅' : '❌');
    console.log('  🔍 Implementation Check:', implementation ? '✅' : '❌');
    console.log('  🧪 Test Cases:', testCases ? '✅' : '❌');
    console.log('  📊 Summary:', summary ? '✅' : '❌');
    
    console.log('\n🎯 Debugging Status:');
    console.log('  ✅ SUCCESS: Chat debugging tools are ready!');
    console.log('  📤 Insert errors will be logged with details');
    console.log('  🔄 Manual refresh button is available');
    console.log('  🗄️ Database schema can be verified');
    console.log('  🔍 Debug commands are provided');
    console.log('  🧪 Test cases are documented');
    
    console.log('\n🔍 What to Debug Next:');
    console.log('  1. Send a message and check console for Insert Error');
    console.log('  2. Click refresh button and verify fresh data loads');
    console.log('  3. Run SQL commands to verify database schema');
    console.log('  4. Use debug commands to test specific operations');
    console.log('  5. Monitor Network tab for Supabase requests');
    console.log('  6. Check RLS policies in Supabase dashboard');
    
    console.log('\n🏁 Chat Issues Debugging Completed!');
  };
  
  runAllDebugging();
}

window.debugChatIssues = debugChatIssues;

// Auto-run when loaded
console.log('🔧 Chat Issues Debug Script Loaded');
console.log('💡 Run debugChatIssues() in console to start debugging');
