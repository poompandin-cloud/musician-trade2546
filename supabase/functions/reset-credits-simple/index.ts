import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    if (req.method === 'POST') {
      const { action } = await req.json();

      if (action === 'reset_monthly_credits') {
        // เชื่อมต่อ Supabase
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        
        // สร้าง SQL query สำหรับรีเซ็ตเครดิต
        const resetSQL = `
          UPDATE public.profiles 
          SET credits = 25, 
              updated_at = NOW()
          WHERE credits IS NOT NULL;
          
          INSERT INTO public.credit_reset_logs (reset_date, total_users_reset, credits_per_user)
          VALUES (
            NOW(),
            (SELECT COUNT(*) FROM public.profiles WHERE credits IS NOT NULL),
            25
          );
        `;

        // รัน SQL ผ่าน RPC
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/reset_credits`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
          },
          body: JSON.stringify({ sql: resetSQL })
        });

        if (!response.ok) {
          const error = await response.text();
          console.error('Error resetting credits:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to reset credits' }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        const result = await response.json();
        console.log('Monthly credit reset completed:', result);

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Monthly credit reset completed successfully',
            result
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
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
