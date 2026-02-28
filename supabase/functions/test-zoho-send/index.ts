import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get test user
    const { data: testUser } = await supabase
      .from('profiles')
      .select('email, first_name')
      .not('email', 'is', null)
      .limit(1)
      .single();

    if (!testUser?.email) {
      throw new Error('No test user found');
    }

    console.log('Sending test email to:', testUser.email);

    // Call send-zoho-email function
    const { data, error } = await supabase.functions.invoke('send-zoho-email', {
      body: {
        to: [testUser.email],
        subject: `🎲 Test Random - Ça marche ${testUser.first_name || 'toi'} !`,
        html_content: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #7C3AED; font-size: 24px;">Yo ${testUser.first_name || ''} ! 👋</h1>
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              C'est juste un test pour vérifier que les emails Zoho fonctionnent bien.
            </p>
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Si tu reçois ce message, ça veut dire que tout est OK ! 🚀
            </p>
            <div style="background: linear-gradient(135deg, #7C3AED 0%, #EC4899 100%); color: white; padding: 16px; border-radius: 12px; text-align: center; margin: 24px 0;">
              <strong style="font-size: 18px;">✅ Zoho Mail fonctionne parfaitement</strong>
            </div>
            <p style="color: #666; font-size: 14px;">
              — L'équipe Random
            </p>
          </div>
        `,
        from_name: 'Random',
        track_opens: false,
        track_clicks: false,
      },
    });

    if (error) {
      console.error('Error calling send-zoho-email:', error);
      throw error;
    }

    console.log('Email sent successfully:', data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Test email envoyé à ${testUser.email}`,
        result: data 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in test-zoho-send:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
