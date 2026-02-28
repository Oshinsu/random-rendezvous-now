import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-STRIPE-MRR] ${step}${detailsStr}`);
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Function started');

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    logStep('Stripe key verified');

    const stripe = new Stripe(stripeKey, { 
      apiVersion: '2025-08-27.basil' as any
    });

    // Fetch all active subscriptions
    logStep('Fetching active subscriptions from Stripe...');
    const subscriptions = await stripe.subscriptions.list({
      status: 'active',
      limit: 100 // Get up to 100 active subscriptions
    });

    logStep('Subscriptions fetched', { count: subscriptions.data.length });

    // Calculate MRR (Monthly Recurring Revenue)
    let totalMRR = 0;
    const subscriptionDetails: any[] = [];

    for (const subscription of subscriptions.data) {
      // Get the price from the subscription items
      for (const item of subscription.items.data) {
        const price = item.price;
        let monthlyAmount = 0;

        if (price.recurring) {
          // Convert to monthly amount based on interval
          const amount = price.unit_amount || 0;
          
          switch (price.recurring.interval) {
            case 'month':
              monthlyAmount = amount;
              break;
            case 'year':
              monthlyAmount = amount / 12;
              break;
            case 'week':
              monthlyAmount = amount * 4.33; // Average weeks per month
              break;
            case 'day':
              monthlyAmount = amount * 30;
              break;
            default:
              monthlyAmount = amount;
          }

          totalMRR += monthlyAmount * item.quantity;

          subscriptionDetails.push({
            subscription_id: subscription.id,
            customer_id: subscription.customer,
            product_id: price.product,
            amount: amount / 100, // Convert cents to euros
            interval: price.recurring.interval,
            monthly_contribution: (monthlyAmount * item.quantity) / 100,
            quantity: item.quantity,
            status: subscription.status
          });
        }
      }
    }

    // Convert from cents to euros
    const mrrInEuros = totalMRR / 100;

    logStep('MRR calculated', { 
      mrr: mrrInEuros,
      active_subscriptions: subscriptions.data.length 
    });

    return new Response(
      JSON.stringify({
        success: true,
        mrr: Math.round(mrrInEuros * 100) / 100, // Round to 2 decimals
        active_subscriptions: subscriptions.data.length,
        subscription_details: subscriptionDetails,
        currency: 'EUR',
        calculated_at: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep('ERROR in get-stripe-mrr', { message: errorMessage });
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage,
        mrr: 0,
        active_subscriptions: 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
