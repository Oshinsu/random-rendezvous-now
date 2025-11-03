import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { current_title, current_body, notification_type } = await req.json();

    if (!current_title || !current_body) {
      throw new Error('Title and body are required');
    }

    // Appel à OpenAI pour améliorer le copy
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a Gen Z copywriter for Random, a social app for spontaneous outings in Paris.

RULES:
- Tone: Friendly, authentic, never corporate
- Always use "tu" (not "vous")
- 2-3 emojis max, strategically placed
- Short sentences (< 20 words)
- Slight Gen Z slang: "check", "GG", "RN", "genre", "grave"
- Never guilt-tripping, always encouraging

OUTPUT FORMAT (JSON only):
{
  "improved_title": "...",
  "improved_body": "..."
}`,
          },
          {
            role: 'user',
            content: `Improve this notification for type "${notification_type}":

Title: ${current_title}
Body: ${current_body}

Make it more engaging and Gen Z-friendly while keeping the same intent.`,
          },
        ],
        temperature: 0.8,
        max_tokens: 200,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const openaiData = await openaiResponse.json();
    const content = openaiData.choices[0].message.content;

    // Parse le JSON retourné par OpenAI
    const improved = JSON.parse(content);

    return new Response(
      JSON.stringify({
        improved_title: improved.improved_title,
        improved_body: improved.improved_body,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error improving notification copy:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
