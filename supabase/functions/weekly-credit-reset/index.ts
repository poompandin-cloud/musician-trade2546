import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify this is a cron job request (you can add authentication here)
    const authHeader = req.headers.get('authorization');
    if (!authHeader || authHeader !== `Bearer ${Deno.env.get('CRON_SECRET')}`) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting weekly credit reset...');

    // Get current date
    const today = new Date();
    const resetDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format

    // Check if reset already happened today (idempotent check)
    const { data: existingReset } = await supabase
      .from('credit_reset_logs')
      .select('id')
      .eq('reset_date', resetDate)
      .single();

    if (existingReset) {
      console.log('Credit reset already completed for today');
      return new Response(
        JSON.stringify({ 
          message: 'Credit reset already completed for today',
          date: resetDate
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Reset all users' credits to 15
    const { data: resetResult, error: resetError } = await supabase
      .from('profiles')
      .update({ 
        credit_balance: 15,
        last_credit_reset: today.toISOString()
      })
      .neq('credit_balance', 15); // Only update users who don't already have 15 credits

    if (resetError) {
      console.error('Error resetting credits:', resetError);
      throw resetError;
    }

    // Count total users reset
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Log the reset
    const { error: logError } = await supabase
      .from('credit_reset_logs')
      .insert({
        reset_date: resetDate,
        total_users_reset: count || 0,
        notes: `Weekly credit reset completed. ${resetResult?.length || 0} users updated.`
      });

    if (logError) {
      console.error('Error logging reset:', logError);
    }

    console.log(`Credit reset completed: ${resetResult?.length || 0} users updated`);

    return new Response(
      JSON.stringify({ 
        message: 'Weekly credit reset completed successfully',
        date: resetDate,
        usersUpdated: resetResult?.length || 0,
        totalUsers: count || 0
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in credit reset function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
