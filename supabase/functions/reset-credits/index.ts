// ใช้ Deno types ที่ถูกต้องสำหรับ Supabase Edge Functions
/// <reference types="https://deno.land/x/deno@v1.34.1/lib/deno.ns.d.ts" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface CreditResetLog {
  id: number;
  reset_date: string;
  total_users_reset: number;
  credits_per_user: number;
  created_at: string;
}

interface Profile {
  id: string;
  credits: number;
  updated_at: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // สร้าง Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (req.method === 'POST') {
      const { action } = await req.json();

      if (action === 'reset_monthly_credits') {
        // รีเซ็ตเครดิตทุกคนเป็น 25
        const { data, error } = await supabase
          .from('profiles')
          .update({ 
            credits: 25,
            updated_at: new Date().toISOString()
          })
          .neq('credits', null)
          .select('id, credits');

        if (error) {
          console.error('Error resetting credits:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to reset credits' }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        // บันทึก log การรีเซ็ต
        const { error: logError } = await supabase
          .from('credit_reset_logs')
          .insert({
            reset_date: new Date().toISOString(),
            total_users_reset: data?.length || 0,
            credits_per_user: 25
          });

        if (logError) {
          console.error('Error logging credit reset:', logError);
        }

        console.log(`Monthly credit reset completed: ${data?.length || 0} users reset to 25 credits`);

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: `Reset credits for ${data?.length || 0} users to 25 credits`,
            users_reset: data?.length || 0
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    if (req.method === 'GET') {
      // ตรวจสอบสถานะการรีเซ็ตล่าสุด
      const { data, error } = await supabase
        .from('credit_reset_logs')
        .select('*')
        .order('reset_date', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching reset logs:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch reset logs' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(
        JSON.stringify({ 
          last_reset: data?.[0] || null,
          message: 'Credit reset status retrieved successfully'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
