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
    console.log('[VERIFY-GROUP-PAYMENTS] Function started');
    
    // Parse request body
    const { groupId } = await req.json();
    if (!groupId) throw new Error("Group ID is required");
    
    console.log('[VERIFY-GROUP-PAYMENTS] Verifying payments for group:', groupId);

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Get all member payments for this group
    const { data: memberPayments, error: memberPaymentsError } = await supabaseClient
      .from('member_payments')
      .select(`
        *,
        group_payments!inner (
          group_id,
          status as group_status
        )
      `)
      .eq('group_payments.group_id', groupId)
      .order('created_at', { ascending: false });

    if (memberPaymentsError) {
      throw new Error(`Error fetching payments: ${memberPaymentsError.message}`);
    }

    console.log('[VERIFY-GROUP-PAYMENTS] Found member payments:', memberPayments?.length || 0);

    // Verify each payment with Stripe
    let verifiedCount = 0;
    const paymentUpdates = [];

    for (const payment of memberPayments || []) {
      if (payment.status === 'paid') {
        verifiedCount++;
        continue;
      }

      if (payment.stripe_payment_intent_id) {
        try {
          // Check if it's a checkout session or payment intent
          let stripeObject;
          if (payment.stripe_payment_intent_id.startsWith('cs_')) {
            // It's a checkout session
            stripeObject = await stripe.checkout.sessions.retrieve(payment.stripe_payment_intent_id);
            
            if (stripeObject.payment_status === 'paid') {
              paymentUpdates.push({
                id: payment.id,
                status: 'paid',
                paid_at: new Date().toISOString(),
                metadata: {
                  ...payment.metadata,
                  stripe_verification: stripeObject.payment_status
                }
              });
              verifiedCount++;
            }
          } else {
            // It's a payment intent
            stripeObject = await stripe.paymentIntents.retrieve(payment.stripe_payment_intent_id);
            
            if (stripeObject.status === 'succeeded') {
              paymentUpdates.push({
                id: payment.id,
                status: 'paid',
                paid_at: new Date().toISOString(),
                metadata: {
                  ...payment.metadata,
                  stripe_verification: stripeObject.status
                }
              });
              verifiedCount++;
            }
          }
        } catch (stripeError) {
          console.warn('[VERIFY-GROUP-PAYMENTS] Stripe verification failed for payment:', payment.id, stripeError.message);
        }
      }
    }

    // Update verified payments in database
    if (paymentUpdates.length > 0) {
      for (const update of paymentUpdates) {
        const { error } = await supabaseClient
          .from('member_payments')
          .update({
            status: update.status,
            paid_at: update.paid_at,
            metadata: update.metadata
          })
          .eq('id', update.id);
          
        if (error) {
          console.error('[VERIFY-GROUP-PAYMENTS] Failed to update payment:', update.id, error.message);
        }
      }
    }

    const totalMembers = memberPayments?.length || 0;
    const allPaid = verifiedCount === totalMembers && totalMembers === 5;

    console.log('[VERIFY-GROUP-PAYMENTS] Payment status:', {
      totalMembers,
      verifiedCount,
      allPaid
    });

    // If all members have paid, proceed with bar assignment
    if (allPaid) {
      // Update group payment status
      const { error: groupPaymentError } = await supabaseClient
        .from('group_payments')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('group_id', groupId);

      if (groupPaymentError) {
        console.error('[VERIFY-GROUP-PAYMENTS] Failed to update group payment:', groupPaymentError.message);
      }

      // Trigger bar assignment by inserting system message
      const { error: messageError } = await supabaseClient
        .from('group_messages')
        .insert({
          group_id: groupId,
          user_id: '00000000-0000-0000-0000-000000000000',
          message: 'AUTO_BAR_ASSIGNMENT_TRIGGER',
          is_system: true
        });

      if (messageError) {
        console.error('[VERIFY-GROUP-PAYMENTS] Failed to trigger bar assignment:', messageError.message);
      } else {
        console.log('[VERIFY-GROUP-PAYMENTS] Bar assignment triggered for fully paid group');
      }
    }

    return new Response(JSON.stringify({
      totalMembers,
      verifiedCount,
      allPaid,
      updatedPayments: paymentUpdates.length
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('[VERIFY-GROUP-PAYMENTS] Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});