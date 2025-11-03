import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserInput {
  user_id: string;
  first_name: string;
  last_name: string;
}

interface GenderResult {
  user_id: string;
  gender: 'homme' | 'femme' | 'doute';
  confidence: number;
  reasoning?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { users } = await req.json() as { users: UserInput[] };

    if (!users || users.length === 0) {
      return new Response(JSON.stringify({ error: 'No users provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Initialize Supabase client for caching
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache first
    const userIds = users.map(u => u.user_id);
    const { data: cachedResults } = await supabase
      .from('gender_detection_cache')
      .select('*')
      .in('user_id', userIds)
      .gte('detected_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // 30 days cache

    const cachedMap = new Map(
      (cachedResults || []).map(r => [r.user_id, {
        user_id: r.user_id,
        gender: r.gender as 'homme' | 'femme' | 'doute',
        confidence: r.confidence,
        reasoning: 'Cached result'
      }])
    );

    // Filter users that need detection
    const usersToDetect = users.filter(u => !cachedMap.has(u.user_id));

    let newResults: GenderResult[] = [];

    if (usersToDetect.length > 0) {
      console.log(`Detecting gender for ${usersToDetect.length} users via Lovable AI`);

      // Call Lovable AI with tool calling
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: "Tu es un expert en onomastique (étude des prénoms). Détermine le genre le plus probable selon le prénom et nom. Si le prénom est mixte, ambigu, ou absent, retourne 'doute' avec une confiance < 0.6."
            },
            {
              role: "user",
              content: `Analyse ces utilisateurs et retourne leur genre probable (homme/femme/doute). Voici les utilisateurs : ${JSON.stringify(usersToDetect.map(u => ({ user_id: u.user_id, first_name: u.first_name || 'absent', last_name: u.last_name || 'absent' })))}`
            }
          ],
          tools: [{
            type: "function",
            function: {
              name: "detect_genders",
              description: "Retourne le genre probable pour chaque utilisateur",
              parameters: {
                type: "object",
                properties: {
                  results: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        user_id: { type: "string" },
                        gender: {
                          type: "string",
                          enum: ["homme", "femme", "doute"],
                          description: "homme si prénom masculin, femme si féminin, doute si ambigu/inconnu"
                        },
                        confidence: {
                          type: "number",
                          minimum: 0,
                          maximum: 1,
                          description: "Confiance de 0 à 1 (0.9+ = très sûr, <0.6 = doute)"
                        },
                        reasoning: {
                          type: "string",
                          description: "Courte justification (ex: 'Pierre = prénom masculin français')"
                        }
                      },
                      required: ["user_id", "gender", "confidence"]
                    }
                  }
                },
                required: ["results"]
              }
            }
          }],
          tool_choice: { type: "function", function: { name: "detect_genders" } }
        })
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('Lovable AI error:', aiResponse.status, errorText);
        
        // Fallback: all users as 'doute'
        newResults = usersToDetect.map(u => ({
          user_id: u.user_id,
          gender: 'doute',
          confidence: 0,
          reasoning: 'AI detection failed'
        }));
      } else {
        // Vérifier si la réponse contient du JSON valide
        const responseText = await aiResponse.text();
        
        if (!responseText || responseText.trim() === '') {
          console.error('Empty response from Lovable AI');
          newResults = usersToDetect.map(u => ({
            user_id: u.user_id,
            gender: 'doute',
            confidence: 0,
            reasoning: 'Empty AI response'
          }));
        } else {
          try {
            const aiData = JSON.parse(responseText);
            const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

            if (toolCall?.function?.arguments) {
              const parsed = JSON.parse(toolCall.function.arguments);
              newResults = parsed.results.map((r: any) => ({
                user_id: r.user_id,
                gender: r.confidence < 0.6 ? 'doute' : r.gender,
                confidence: r.confidence,
                reasoning: r.reasoning || 'No reasoning provided'
              }));

              // Cache results in database (only for valid results)
              const cacheData = newResults.map(r => ({
                user_id: r.user_id,
                gender: r.gender,
                confidence: r.confidence,
                detected_at: new Date().toISOString()
              }));

              await supabase
                .from('gender_detection_cache')
                .upsert(cacheData, { onConflict: 'user_id' });
            } else {
              console.error('No tool call in AI response');
              newResults = usersToDetect.map(u => ({
                user_id: u.user_id,
                gender: 'doute',
                confidence: 0,
                reasoning: 'No tool call in response'
              }));
            }
          } catch (parseError) {
            console.error('Failed to parse AI response:', parseError, 'Response:', responseText.substring(0, 200));
            newResults = usersToDetect.map(u => ({
              user_id: u.user_id,
              gender: 'doute',
              confidence: 0,
              reasoning: 'Failed to parse AI response'
            }));
          }
        }
      }
    }

    // Combine cached and new results
    const allResults = [
      ...Array.from(cachedMap.values()),
      ...newResults
    ];

    console.log(`Gender detection complete: ${allResults.length} results (${cachedMap.size} cached, ${newResults.length} new)`);

    return new Response(JSON.stringify({ results: allResults }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in detect-user-gender:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      results: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
