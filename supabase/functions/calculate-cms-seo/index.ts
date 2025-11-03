import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SEOMetrics {
  readability_score: number;
  keyword_density: number;
  length_score: number;
  cta_score: number;
  emoji_score: number;
  total_score: number;
  suggestions: string[];
}

const calculateSEOMetrics = (text: string, context: string): SEOMetrics => {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceCount = sentences.length || 1;

  // 1. Readability Score (Flesch-Kincaid simplified for French)
  const avgWordsPerSentence = wordCount / sentenceCount;
  const avgSyllablesPerWord = 1.5; // French average
  const readability = Math.max(0, Math.min(100,
    206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord)
  ));
  const readability_score = Math.round(readability);

  // 2. Keyword Density (Random-specific keywords)
  const keywords = ['random', 'bar', 'sortie', 'spontané', 'fun', 'gratuit', 'rencontre', 'apéro'];
  const lowerText = text.toLowerCase();
  const keywordMatches = keywords.filter(k => lowerText.includes(k)).length;
  const keyword_density = Math.round((keywordMatches / keywords.length) * 100);

  // 3. Length Score (optimal ranges by context)
  let optimalMin = 30;
  let optimalMax = 80;
  
  if (context === 'hero') {
    optimalMin = 10;
    optimalMax = 30;
  } else if (context === 'benefits') {
    optimalMin = 50;
    optimalMax = 150;
  } else if (context === 'cta') {
    optimalMin = 5;
    optimalMax = 15;
  }

  const length_score = wordCount >= optimalMin && wordCount <= optimalMax
    ? 100
    : Math.max(0, 100 - Math.abs(wordCount - optimalMax) * 2);

  // 4. CTA Score (call-to-action presence)
  const ctaRegex = /\b(rejoins|découvre|essaie|inscris|clique|télécharge|commence|participe)\b/i;
  const cta_score = ctaRegex.test(text) ? 100 : 0;

  // 5. Emoji Score (1-3 emojis is optimal)
  const emojiMatches = text.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu) || [];
  const emojiCount = emojiMatches.length;
  const emoji_score = emojiCount >= 1 && emojiCount <= 3 ? 100 : emojiCount === 0 ? 50 : Math.max(0, 100 - (emojiCount - 3) * 20);

  // Total score (weighted average)
  const total_score = Math.round(
    (readability_score * 0.25) +
    (keyword_density * 0.25) +
    (length_score * 0.2) +
    (cta_score * 0.15) +
    (emoji_score * 0.15)
  );

  // Generate suggestions
  const suggestions: string[] = [];
  if (readability_score < 60) suggestions.push("Simplifier les phrases pour améliorer la lisibilité");
  if (keyword_density < 30) suggestions.push("Ajouter plus de mots-clés Random (spontané, fun, gratuit, etc.)");
  if (length_score < 80) suggestions.push(`Ajuster la longueur (optimal: ${optimalMin}-${optimalMax} mots, actuel: ${wordCount})`);
  if (cta_score === 0) suggestions.push("Ajouter un appel à l'action clair (Rejoins, Découvre, Essaie...)");
  if (emoji_score < 80) suggestions.push(emojiCount === 0 ? "Ajouter 1-3 emojis stratégiques" : "Réduire le nombre d'emojis (max 3)");

  return {
    readability_score,
    keyword_density,
    length_score,
    cta_score,
    emoji_score,
    total_score,
    suggestions,
  };
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { content_id } = await req.json();

    if (!content_id) {
      throw new Error('content_id is required');
    }

    // Fetch content
    const { data: content, error: fetchError } = await supabase
      .from('site_content')
      .select('content_value, page_section, content_type')
      .eq('id', content_id)
      .single();

    if (fetchError || !content) {
      throw new Error('Content not found');
    }

    // Only calculate for text content
    if (content.content_type !== 'text') {
      return new Response(
        JSON.stringify({ error: 'Only text content can be scored' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const text = String(content.content_value);
    const context = content.page_section || 'general';

    // Calculate metrics
    const metrics = calculateSEOMetrics(text, context);

    // Store in database
    const { data: score, error: insertError } = await supabase
      .from('cms_seo_scores')
      .insert({
        content_id,
        ...metrics,
        metadata: { context, word_count: text.split(/\s+/).length },
      })
      .select()
      .single();

    if (insertError) throw insertError;

    console.log(`SEO score calculated for content ${content_id}: ${metrics.total_score}/100`);

    return new Response(
      JSON.stringify({ success: true, score }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error calculating SEO:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
