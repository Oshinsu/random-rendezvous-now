import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface AutomationContext {
  user_id: string;
  trigger_type: 'signup' | 'first_outing' | 'inactive_7d' | 'inactive_14d' | 'inactive_30d' | 'post_outing_nps' | 'churn_risk';
  metadata?: Record<string, any>;
}

// Email templates
const EMAIL_TEMPLATES = {
  welcome: {
    subject: '🎉 Bienvenue sur Random !',
    html: (firstName: string) => `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #6366f1;">Bienvenue ${firstName} !</h1>
          <p>Nous sommes ravis de vous compter parmi nous. Random est votre application pour découvrir de nouveaux bars et rencontrer des gens intéressants.</p>
          <h2>Pour commencer :</h2>
          <ol>
            <li>Créez ou rejoignez un groupe</li>
            <li>Attendez qu'un bar soit assigné automatiquement</li>
            <li>Rencontrez 4 nouvelles personnes autour d'un verre !</li>
          </ol>
          <a href="https://randomapp.fr/dashboard" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">Commencer maintenant</a>
          <p style="margin-top: 30px; color: #666; font-size: 14px;">À bientôt,<br>L'équipe Random</p>
        </body>
      </html>
    `,
  },
  first_outing_congrats: {
    subject: '🎊 Félicitations pour votre première sortie !',
    html: (firstName: string, barName: string) => `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #6366f1;">Bravo ${firstName} !</h1>
          <p>Vous venez de terminer votre première sortie Random chez <strong>${barName}</strong> ! 🎉</p>
          <p>Comment s'est passée votre expérience ?</p>
          <a href="https://randomapp.fr/profile" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">Donnez votre avis</a>
          <p style="margin-top: 30px;">Prêt pour la prochaine aventure ? Créez un nouveau groupe !</p>
          <p style="margin-top: 30px; color: #666; font-size: 14px;">L'équipe Random</p>
        </body>
      </html>
    `,
  },
  inactive_7d: {
    subject: '😊 On ne vous oublie pas !',
    html: (firstName: string) => `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #6366f1;">Salut ${firstName},</h1>
          <p>Ça fait une semaine qu'on ne vous a pas vu ! Envie de retenter l'aventure Random ?</p>
          <p>De nouveaux bars ont rejoint notre plateforme et de nouvelles personnes n'attendent que vous.</p>
          <a href="https://randomapp.fr/dashboard" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">Rejoindre un groupe</a>
          <p style="margin-top: 30px; color: #666; font-size: 14px;">À très bientôt,<br>L'équipe Random</p>
        </body>
      </html>
    `,
  },
  inactive_14d: {
    subject: '🎁 Offre spéciale : revenez sur Random !',
    html: (firstName: string) => `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #6366f1;">Vous nous manquez ${firstName} !</h1>
          <p>Cela fait 2 semaines qu'on ne s'est pas vu... Pour fêter votre retour, nous avons une surprise pour vous !</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <p style="font-size: 18px; font-weight: bold; color: #6366f1; margin: 0;">Participez à votre prochaine sortie et recevez un code promo de 20% chez nos bars partenaires !</p>
          </div>
          <a href="https://randomapp.fr/dashboard" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">Revenir sur Random</a>
          <p style="margin-top: 30px; color: #666; font-size: 14px;">On vous attend avec impatience,<br>L'équipe Random</p>
        </body>
      </html>
    `,
  },
  inactive_30d: {
    subject: '💔 On vous a perdu ?',
    html: (firstName: string) => `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #6366f1;">${firstName}, vous nous manquez vraiment...</h1>
          <p>Un mois sans vous, c'est long ! Nous aimerions comprendre pourquoi vous ne revenez plus.</p>
          <p>Prenez 2 minutes pour nous dire ce qui ne va pas :</p>
          <a href="https://randomapp.fr/feedback" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">Donner mon avis</a>
          <p style="margin-top: 20px;">Votre feedback nous aide à nous améliorer pour mieux vous servir.</p>
          <p style="margin-top: 30px; color: #666; font-size: 14px;">Cordialement,<br>L'équipe Random</p>
        </body>
      </html>
    `,
  },
  post_outing_nps: {
    subject: '⭐ Comment était votre sortie ?',
    html: (firstName: string, barName: string) => `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #6366f1;">Salut ${firstName},</h1>
          <p>Merci d'avoir participé à votre sortie chez <strong>${barName}</strong> !</p>
          <p>Sur une échelle de 0 à 10, quelle est la probabilité que vous recommandiez Random à un ami ?</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://randomapp.fr/nps?score=0" style="display: inline-block; padding: 8px 12px; margin: 2px; background: #ef4444; color: white; text-decoration: none; border-radius: 4px;">0</a>
            <a href="https://randomapp.fr/nps?score=1" style="display: inline-block; padding: 8px 12px; margin: 2px; background: #f97316; color: white; text-decoration: none; border-radius: 4px;">1</a>
            <a href="https://randomapp.fr/nps?score=2" style="display: inline-block; padding: 8px 12px; margin: 2px; background: #f59e0b; color: white; text-decoration: none; border-radius: 4px;">2</a>
            <a href="https://randomapp.fr/nps?score=3" style="display: inline-block; padding: 8px 12px; margin: 2px; background: #fbbf24; color: white; text-decoration: none; border-radius: 4px;">3</a>
            <a href="https://randomapp.fr/nps?score=4" style="display: inline-block; padding: 8px 12px; margin: 2px; background: #facc15; color: white; text-decoration: none; border-radius: 4px;">4</a>
            <a href="https://randomapp.fr/nps?score=5" style="display: inline-block; padding: 8px 12px; margin: 2px; background: #eab308; color: white; text-decoration: none; border-radius: 4px;">5</a>
            <a href="https://randomapp.fr/nps?score=6" style="display: inline-block; padding: 8px 12px; margin: 2px; background: #a3e635; color: white; text-decoration: none; border-radius: 4px;">6</a>
            <a href="https://randomapp.fr/nps?score=7" style="display: inline-block; padding: 8px 12px; margin: 2px; background: #84cc16; color: white; text-decoration: none; border-radius: 4px;">7</a>
            <a href="https://randomapp.fr/nps?score=8" style="display: inline-block; padding: 8px 12px; margin: 2px; background: #65a30d; color: white; text-decoration: none; border-radius: 4px;">8</a>
            <a href="https://randomapp.fr/nps?score=9" style="display: inline-block; padding: 8px 12px; margin: 2px; background: #16a34a; color: white; text-decoration: none; border-radius: 4px;">9</a>
            <a href="https://randomapp.fr/nps?score=10" style="display: inline-block; padding: 8px 12px; margin: 2px; background: #059669; color: white; text-decoration: none; border-radius: 4px;">10</a>
          </div>
          <p style="margin-top: 30px; color: #666; font-size: 14px;">Merci pour votre retour !<br>L'équipe Random</p>
        </body>
      </html>
    `,
  },
  churn_alert: {
    subject: '🚨 ALERTE : Risque de churn élevé',
    html: (firstName: string, healthScore: number) => `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #ef4444;">⚠️ Utilisateur à risque</h1>
          <p><strong>Utilisateur :</strong> ${firstName}</p>
          <p><strong>Score de santé :</strong> ${healthScore}/100</p>
          <p><strong>Statut :</strong> Risque de churn élevé</p>
          <p>Action recommandée : Contact personnalisé ou offre de réengagement.</p>
        </body>
      </html>
    `,
  },
};

async function sendAutomatedEmail(
  supabase: any,
  context: AutomationContext,
  template: keyof typeof EMAIL_TEMPLATES,
  userProfile: any
) {
  const emailTemplate = EMAIL_TEMPLATES[template];
  
  let htmlContent = '';
  let subject = emailTemplate.subject;
  
  switch (template) {
    case 'welcome':
      htmlContent = emailTemplate.html(userProfile.first_name || 'ami');
      break;
    case 'first_outing_congrats':
      htmlContent = emailTemplate.html(
        userProfile.first_name || 'ami',
        context.metadata?.bar_name || 'un super bar'
      );
      break;
    case 'inactive_7d':
    case 'inactive_14d':
    case 'inactive_30d':
      htmlContent = emailTemplate.html(userProfile.first_name || 'ami');
      break;
    case 'post_outing_nps':
      htmlContent = emailTemplate.html(
        userProfile.first_name || 'ami',
        context.metadata?.bar_name || 'un super bar'
      );
      break;
    case 'churn_alert':
      htmlContent = emailTemplate.html(
        userProfile.first_name || 'ami',
        context.metadata?.health_score || 0
      );
      subject = `[ALERTE CRM] ${userProfile.first_name || 'Utilisateur'} - Risque de churn`;
      break;
  }

  // Send via Zoho Mail
  const emailResponse = await fetch(`${SUPABASE_URL}/functions/v1/send-zoho-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      to: [userProfile.email],
      subject,
      html_content: htmlContent,
      user_id: context.user_id,
      track_opens: true,
      track_clicks: true,
    }),
  });

  if (!emailResponse.ok) {
    throw new Error('Failed to send email via Zoho');
  }

  console.log(`Automated email sent: ${template} to ${userProfile.email}`);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const context: AutomationContext = await req.json();

    console.log('Processing lifecycle automation:', context);

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', context.user_id)
      .single();

    if (profileError || !profile) {
      throw new Error('User profile not found');
    }

    // Execute automation based on trigger type
    switch (context.trigger_type) {
      case 'signup':
        await sendAutomatedEmail(supabase, context, 'welcome', profile);
        break;

      case 'first_outing':
        await sendAutomatedEmail(supabase, context, 'first_outing_congrats', profile);
        break;

      case 'inactive_7d':
        await sendAutomatedEmail(supabase, context, 'inactive_7d', profile);
        break;

      case 'inactive_14d':
        await sendAutomatedEmail(supabase, context, 'inactive_14d', profile);
        break;

      case 'inactive_30d':
        await sendAutomatedEmail(supabase, context, 'inactive_30d', profile);
        break;

      case 'post_outing_nps':
        await sendAutomatedEmail(supabase, context, 'post_outing_nps', profile);
        break;

      case 'churn_risk':
        // Send alert to admin
        await sendAutomatedEmail(supabase, context, 'churn_alert', profile);
        break;

      default:
        throw new Error(`Unknown trigger type: ${context.trigger_type}`);
    }

    return new Response(
      JSON.stringify({ success: true, trigger: context.trigger_type }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in lifecycle-automations:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
