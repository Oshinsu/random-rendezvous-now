import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    console.log('[CREATE-GROUP-PAYMENT] Function started');
    
    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");
    
    console.log('[CREATE-GROUP-PAYMENT] User authenticated:', user.id);

    // Parse request body
    const { groupId } = await req.json();
    if (!groupId) throw new Error("Group ID is required");
    
    console.log('[CREATE-GROUP-PAYMENT] Processing payment for group:', groupId);

    // Verify user is in the group
    const { data: participation, error: participationError } = await supabaseClient
      .from('group_participants')
      .select('*')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .eq('status', 'confirmed')
      .single();
      
    if (participationError || !participation) {
      throw new Error("User is not a confirmed member of this group");
    }

    // Check if PPU mode is enabled
    const { data: ppuEnabled, error: ppuError } = await supabaseClient
      .rpc('is_ppu_mode_enabled');
    
    if (ppuError || !ppuEnabled) {
      throw new Error("PPU mode is not enabled");
    }

    // Get PPU price
    const { data: ppuPrice, error: priceError } = await supabaseClient
      .rpc('get_ppu_price_cents');
      
    if (priceError) throw new Error("Could not get PPU price");

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Find or create Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id }
      });
      customerId = customer.id;
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Validation de groupe Random',
              description: `Participation au groupe pour accéder au bar assigné`,
            },
            unit_amount: ppuPrice,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/groups?payment=success&group=${groupId}`,
      cancel_url: `${req.headers.get("origin")}/groups?payment=cancelled&group=${groupId}`,
      metadata: {
        group_id: groupId,
        user_id: user.id,
        payment_type: 'group_ppu'
      },
      expires_at: Math.floor((Date.now() + 15 * 60 * 1000) / 1000), // 15 minutes
    });

    // Record payment session in database
    const { error: updateError } = await supabaseClient
      .from('member_payments')
      .update({
        stripe_payment_intent_id: session.id,
        metadata: { stripe_session_id: session.id, checkout_url: session.url }
      })
      .eq('user_id', user.id)
      .match({ 
        group_payment_id: (await supabaseClient
          .from('group_payments')
          .select('id')
          .eq('group_id', groupId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()).data?.id
      });

    if (updateError) {
      console.warn('[CREATE-GROUP-PAYMENT] Could not update member payment:', updateError.message);
    }

    console.log('[CREATE-GROUP-PAYMENT] Payment session created:', session.id);

    return new Response(JSON.stringify({ 
      url: session.url,
      sessionId: session.id,
      expiresAt: session.expires_at
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('[CREATE-GROUP-PAYMENT] Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});