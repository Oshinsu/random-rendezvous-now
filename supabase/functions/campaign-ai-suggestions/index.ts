import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { segment_key } = await req.json();

    // Fetch segment info
    const { data: segment } = await supabaseClient
      .from('crm_user_segments')
      .select('*')
      .eq('segment_key', segment_key)
      .single();

    if (!segment) {
      throw new Error('Segment not found');
    }

    // Fetch existing campaigns for this segment
    const { data: existingCampaigns } = await supabaseClient
      .from('crm_campaigns')
      .select('campaign_name, subject, status')
      .eq('target_segment_id', segment.id)
      .limit(10);

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const aiPrompt = `Tu es un expert en marketing CRM. Génère 3 idées de campagnes email innovantes pour le segment "${segment.segment_name}" (${segment.description}).

Campagnes existantes : ${existingCampaigns?.map(c => c.campaign_name).join(', ') || 'Aucune'}

Pour chaque campagne, fournis :
1. Nom de la campagne (court, accrocheur)
2. Subject line (max 50 caractères, engageant)
3. Objectif principal (conversion, engagement, rétention)
4. Moment idéal d'envoi
5. Une phrase d'accroche pour le contenu

Retourne UNIQUEMENT un JSON valide (pas de texte avant/après) au format :
{
  "suggestions": [
    {
      "name": "string",
      "subject": "string",
      "objective": "string",
      "timing": "string",
      "hook": "string"
    }
  ]
}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Tu es un expert marketing CRM. Réponds toujours avec du JSON valide, sans markdown." },
          { role: "user", content: aiPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;

    // Parse AI response (handle potential markdown wrapper)
    let suggestions;
    try {
      const cleanContent = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      suggestions = JSON.parse(cleanContent).suggestions;
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      throw new Error('Invalid AI response format');
    }

    return new Response(
      JSON.stringify({ suggestions, segment_name: segment.segment_name }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating AI suggestions:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});