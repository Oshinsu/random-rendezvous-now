import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, text, section_context, goal } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Construire le system prompt selon le contexte
    const getSystemPrompt = (context: string) => {
      const basePrompt = `Tu es le copywriter expert de Random, l'app 100% gratuite de sorties bar spontanées.

📊 DONNÉES RANDOM :
- **Cible** : Gen Z/Millennials urbains (18-35 ans)
- **USP** : Sorties gratuites, spontanées, rencontres IRL authentiques
- **Problème résolu** : Solitude en ville + difficulté à sortir spontanément
- **Valeur** : Communauté, fun, zéro prise de tête
- **Tone** : Fun, direct, tutoiement, 1-3 emojis stratégiques

🎯 CONTEXTE SECTION : ${context}

${context === 'hero' ? `
OBJECTIF HERO :
- Capter l'attention en < 3 secondes
- Communiquer l'USP (gratuit + spontané)
- CTA clair (télécharger ou découvrir)
- Max 15 mots pour le titre
- Max 25 mots pour la baseline
` : ''}

${context === 'benefits' ? `
OBJECTIF BENEFITS :
- 3-4 bénéfices concrets (pas de fluff)
- Émotions positives (FOMO intelligent)
- Preuve sociale subtile (ex: "Déjà 10k+ Random")
- Chaque bénéfice = 1 phrase courte
` : ''}

${context === 'how_it_works' ? `
OBJECTIF HOW IT WORKS :
- Process en 3 étapes max
- Chaque étape = titre + description courte
- Émojis pour illustrer chaque step
- Finir par CTA clair
` : ''}

✅ EXEMPLES GOOD :
- "Des apéros spontanés avec des gens vrais 🍻"
- "Random, c'est ton pote qui organise tes sorties"
- "Zéro prise de tête, 100% gratuité, juste du fun"

❌ EXEMPLES BAD :
- "Profitez de notre offre exceptionnelle" (trop corporate)
- "Ne manquez pas cette opportunité unique!!!" (fausse urgence)
- "Téléchargez l'application dès maintenant" (impersonnel)

TONE OF VOICE :
- Tutoiement TOUJOURS
- Fun, spontané, authentique (Gen Z/Millennial)
- 1-3 emojis stratégiques par texte
- Phrases courtes (< 20 mots)
- Zéro jargon marketing
- Jamais culpabilisant

INTERDICTIONS :
- Vouvoiement
- Fausses urgences ("DERNIÈRE CHANCE!!!")
- Spam emojis
- Culpabilisation`;

      return basePrompt;
    };

    if (action === 'improve') {
      const systemPrompt = getSystemPrompt(section_context);
      
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { 
              role: "user", 
              content: `Améliore ce texte selon les guidelines Random :\n\n"${text}"\n\nObjectif : ${goal}`
            }
          ],
          tools: [{
            type: "function",
            function: {
              name: "improve_copy",
              description: "Améliore un texte marketing selon le tone Random",
              parameters: {
                type: "object",
                properties: {
                  improved_text: { 
                    type: "string",
                    description: "Version améliorée du texte"
                  },
                  reasoning: { 
                    type: "string",
                    description: "Explication des changements"
                  },
                  seo_score: { 
                    type: "number",
                    description: "Score SEO/engagement estimé sur 100"
                  },
                  tone_match: { 
                    type: "string", 
                    enum: ["perfect", "good", "needs_work"],
                    description: "Qualité du match avec le tone Random"
                  }
                },
                required: ["improved_text", "reasoning", "seo_score"]
              }
            }
          }],
          tool_choice: { type: "function", function: { name: "improve_copy" } }
        })
      });

      if (!response.ok) {
        throw new Error(`Lovable AI API error: ${response.status}`);
      }

      const aiData = await response.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

      if (!toolCall?.function?.arguments) {
        throw new Error("No tool call in AI response");
      }

      const result = JSON.parse(toolCall.function.arguments);

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (action === 'ab_test') {
      const systemPrompt = `Tu es le copywriter expert de Random.
Génère 3 variations d'un texte marketing pour faire de l'A/B testing.

CONTRAINTES :
- Variation A : Version "Fun & Direct"
- Variation B : Version "Éducative & Engageante"
- Variation C : Version "FOMO Intelligent"

Chaque variation doit :
- Respecter le tone Random (tutoiement, fun, spontané)
- Avoir une approche différente
- Rester court et impactant`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Texte original : "${text}"\n\nGénère 3 variations pour A/B testing.` }
          ],
          tools: [{
            type: "function",
            function: {
              name: "generate_variants",
              description: "Génère 3 variants pour A/B testing",
              parameters: {
                type: "object",
                properties: {
                  variants: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        text: { type: "string" },
                        approach: { type: "string" }
                      }
                    }
                  }
                },
                required: ["variants"]
              }
            }
          }],
          tool_choice: { type: "function", function: { name: "generate_variants" } }
        })
      });

      if (!response.ok) {
        throw new Error(`Lovable AI API error: ${response.status}`);
      }

      const aiData = await response.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

      if (!toolCall?.function?.arguments) {
        throw new Error("No tool call in AI response");
      }

      const result = JSON.parse(toolCall.function.arguments);

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    throw new Error("Invalid action");

  } catch (error) {
    console.error('Error in cms-ai-copywriter:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
