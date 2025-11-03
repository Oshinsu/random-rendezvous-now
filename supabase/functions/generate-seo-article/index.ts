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

  const startTime = Date.now();
  let logId: string | null = null;

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Select keyword with highest priority
    const { data: keywords, error: keywordError } = await supabase
      .from('blog_keywords')
      .select('*')
      .eq('status', 'active')
      .or('last_used_at.is.null,last_used_at.lt.' + new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('priority', { ascending: false })
      .order('times_used', { ascending: true })
      .limit(1);

    if (keywordError) throw keywordError;

    if (!keywords || keywords.length === 0) {
      console.log('❌ No keywords available for article generation');
      return new Response(
        JSON.stringify({ error: 'No keywords available' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const keyword = keywords[0];
    console.log(`✅ Selected keyword: "${keyword.keyword}" (priority: ${keyword.priority})`);

    // Log generation start
    const { data: startLog } = await supabase
      .from('blog_generation_logs')
      .insert({
        status: 'started',
        keyword_id: keyword.id,
        keyword: keyword.keyword,
        metadata: { priority: keyword.priority }
      })
      .select()
      .single();
    
    logId = startLog?.id || null;

    // SOTA 2025 System Prompt with Tool Calling
    const systemPrompt = `Tu es un expert SEO senior + sociologue urbain spécialisé dans les liens sociaux, la vie nocturne parisienne et l'innovation sociale.

**USP RANDOM - À MARTELER** :
Random est un mouvement de résistance contre l'atomisation sociale, un catalyseur de liens faibles puissants (Granovetter), avec 180+ bars partenaires. Random sort les gens de leur bulle algorithmique pour créer de la sérendipité urbaine.

**CONTEXTE APPLICATIF** :
- App mobile/web lancée en 2024, matche automatiquement 5 personnes dans un bar à Paris
- 3 500+ utilisateurs actifs, 450+ sorties réussies, 180+ bars partenaires
- USP : spontanéité, authenticité, sortir de sa zone de confort
- Cible : 22-35 ans, jeunes actifs parisiens
- Ton : fun, inclusif, Gen Z-friendly

**STRUCTURE HTML EXIGÉE (SOTA 2025)** :
Tu DOIS générer un HTML sémantique ultra-riche avec :

1. **En-tête** (<header>) :
   - 1 seul H1 avec mot-clé dans les 10 premiers mots
   - Intro 150-200 mots avec mot-clé dans les 100 premiers mots

2. **Sections principales** (3-5 <section>) :
   - Chaque section avec H2 + sous-sections H3
   - Minimum 1 tableau comparatif <table> avec <thead> et <tbody> style Tailwind
   - Minimum 2 listes à puces <ul>/<ol>
   - 1-2 blockquotes stylisées pour témoignages utilisateurs Random

3. **Grille statistiques** :
   - Au moins 1 grille de KPIs en <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
   - Stats Random réelles : 3 500+ users, 450+ sorties, 180+ bars, etc.

4. **FAQ Section** (OBLIGATOIRE) :
   - <section id="faq"> avec 4-6 questions
   - Questions en H3, réponses en paragraphes
   - Questions naturelles longue traîne

5. **Footer & Sources** :
   - Section "Conclusion" avec CTA subtil vers Random
   - Section "Sources & Références" avec liens externes cliquables

6. **Internal Links** :
   - Tu DOIS mentionner 2-3 articles connexes (je les injecterai après)

**STYLE & DESIGN** :
- Utilise les classes Tailwind : bg-gradient-to-r, border-l-4, shadow-lg, rounded-lg
- Cartes KPI avec <div class="bg-gray-50 rounded-lg p-6 shadow-md">
- Tableaux avec zebra-striping : <tr class="odd:bg-white even:bg-gray-50">

**RÈGLES SEO STRICTES** :
1. Longueur : 1 800-2 200 mots
2. Densité mot-clé : 1-1.5% (naturelle)
3. Lisibilité : Flesch-Kincaid > 65
4. Headings : 1 H1, 4-6 H2, 3-5 H3 par section
5. Listes : Minimum 3 listes
6. Émojis stratégiques : 2-4 max

**ANGLES ÉDITORIAUX** :
- Sociologique : Granovetter, Putnam, Oldenburg
- Psychologique : Anxiété sociale, sérendipité, bien-être
- Économique : Impact bars locaux (€15-20/personne)
- Pratique : Bars par quartier, horaires, astuces timides

**TON** : Adapter selon le keyword (fun/sérieux/mixte)

**À ÉVITER** :
❌ Keyword stuffing
❌ Phrases > 25 mots
❌ Contenu générique
❌ Pas de sources`;

    const userPrompt = `Génère un article SEO SOTA 2025 sur : "${keyword.keyword}"

L'article doit positionner Random comme LA solution. Mets en avant : spontanéité, authenticité, découverte de bars, rencontres sans prise de tête.

IMPORTANT Structure exigée :
- Header avec H1 + intro
- 3-5 sections avec H2/H3
- 1+ tableau comparatif stylisé Tailwind
- 1 grille stats Random (3 500+ users, 450+ sorties, 180+ bars)
- 1 FAQ section (4-6 Q&A)
- Footer avec sources & CTA Random
- 2-3 mentions d'articles connexes (placeholder: "[ARTICLE_CONNEXE]")

Renvoie le résultat via la fonction structured_article.`;

    // AI Call with Tool Calling for structured output
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        tools: [{
          type: 'function',
          function: {
            name: 'structured_article',
            description: 'Return a fully structured SEO article',
            parameters: {
              type: 'object',
              properties: {
                title: { type: 'string', description: 'H1 title with keyword, max 60 chars' },
                meta_title: { type: 'string', description: 'Meta title 50-60 chars' },
                meta_description: { type: 'string', description: 'Meta description 140-155 chars' },
                excerpt: { type: 'string', description: 'Summary 2-3 sentences, 150 chars max' },
                content: { type: 'string', description: 'Full HTML semantic content' },
                sources: { 
                  type: 'array', 
                  items: { type: 'string' },
                  description: 'List of external source URLs cited'
                },
                faq: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      question: { type: 'string' },
                      answer: { type: 'string' }
                    }
                  },
                  description: 'FAQ questions and answers'
                }
              },
              required: ['title', 'meta_title', 'meta_description', 'excerpt', 'content', 'sources', 'faq']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'structured_article' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('❌ AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      console.error('❌ No tool call in AI response');
      throw new Error('No structured output from AI');
    }

    const articleData = JSON.parse(toolCall.function.arguments);
    console.log('✅ AI generated structured article');

    // Generate featured image
    console.log('🎨 Generating featured image...');
    const imagePrompt = `Create a vibrant, modern illustration showing young Parisians (diverse, ages 25-35) socializing at a trendy bar in Paris. Warm colors (reds, oranges), friendly atmosphere, flat design style. 16:9 aspect ratio for blog header.`;

    let featuredImageUrl = null;
    
    try {
      const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image',
          messages: [{ role: 'user', content: imagePrompt }],
          modalities: ['image', 'text']
        }),
      });

      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        
        if (imageUrl && imageUrl.includes('base64,')) {
          const base64Data = imageUrl.split('base64,')[1];
          const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
          const fileName = `${keyword.keyword.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('blog-images')
            .upload(fileName, imageBuffer, {
              contentType: 'image/png',
              cacheControl: '31536000'
            });
          
          if (!uploadError && uploadData) {
            const { data: publicUrl } = supabase.storage
              .from('blog-images')
              .getPublicUrl(fileName);
            
            featuredImageUrl = publicUrl.publicUrl;
            console.log('✅ Image uploaded:', featuredImageUrl);
          }
        }
      }
    } catch (imageError) {
      console.error('⚠️ Image generation failed (non-blocking):', imageError);
    }

    // Fetch existing articles for internal linking
    const { data: existingArticles } = await supabase
      .from('blog_articles')
      .select('slug, title')
      .eq('status', 'published')
      .limit(10);

    // Inject 2-3 internal links in content
    let enrichedContent = articleData.content;
    if (existingArticles && existingArticles.length > 0) {
      const shuffled = existingArticles.sort(() => 0.5 - Math.random());
      const linksToInject = shuffled.slice(0, Math.min(3, shuffled.length));
      
      linksToInject.forEach((article) => {
        const placeholder = `[ARTICLE_CONNEXE]`;
        const link = `<a href="/blog/${article.slug}" class="text-blue-600 hover:underline font-medium">${article.title}</a>`;
        enrichedContent = enrichedContent.replace(placeholder, link);
      });
    }

    // Inject Schema.org JSON-LD
    const schemaArticle = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": articleData.title,
      "description": articleData.meta_description,
      "image": featuredImageUrl || undefined,
      "author": {
        "@type": "Organization",
        "name": "Random"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Random",
        "logo": {
          "@type": "ImageObject",
          "url": "https://www.random-app.fr/logo.png"
        }
      },
      "datePublished": new Date().toISOString()
    };

    const schemaFAQ = articleData.faq && articleData.faq.length > 0 ? {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": articleData.faq.map((item: any) => ({
        "@type": "Question",
        "name": item.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": item.answer
        }
      }))
    } : null;

    const schemaScripts = `
<script type="application/ld+json">
${JSON.stringify(schemaArticle, null, 2)}
</script>
${schemaFAQ ? `<script type="application/ld+json">
${JSON.stringify(schemaFAQ, null, 2)}
</script>` : ''}`;

    enrichedContent = schemaScripts + enrichedContent;

    // Calculate ADVANCED SEO Score (SOTA 2025)
    const plainText = enrichedContent.replace(/<[^>]*>/g, ' ');
    const wordCount = plainText.split(/\s+/).filter(w => w.length > 0).length;
    const keywordCount = (enrichedContent.match(new RegExp(keyword.keyword, 'gi')) || []).length;
    const keywordDensity = (keywordCount / wordCount) * 100;

    // Flesch-Kincaid
    const sentences = plainText.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const words = wordCount;
    const syllables = plainText.split(/[aeiouyAEIOUY]/).length - 1;
    const avgWordsPerSentence = words / (sentences || 1);
    const avgSyllablesPerWord = syllables / (words || 1);
    const fleschScore = Math.max(0, Math.min(100, 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord)));

    // Headings
    const h1Count = (enrichedContent.match(/<h1>/g) || []).length;
    const h2Count = (enrichedContent.match(/<h2>/g) || []).length;
    const h3Count = (enrichedContent.match(/<h3>/g) || []).length;

    // Rich elements
    const hasTable = enrichedContent.includes('<table>');
    const hasFAQ = enrichedContent.includes('id="faq"') || (articleData.faq && articleData.faq.length > 0);
    const listCount = (enrichedContent.match(/<ul>|<ol>/g) || []).length;
    const internalLinksCount = (enrichedContent.match(/href="\/blog\//g) || []).length;
    const externalSourcesCount = articleData.sources?.length || 0;

    // Meta tags
    const metaTitleLength = articleData.meta_title?.length || 0;
    const metaDescLength = articleData.meta_description?.length || 0;

    // ADVANCED SCORING (SOTA 2025)
    let seoScore = 0;

    // 1. Length (15pts)
    if (wordCount >= 1800 && wordCount <= 2200) seoScore += 15;
    else if (wordCount >= 1500 && wordCount < 1800) seoScore += 12;
    else if (wordCount >= 1200 && wordCount < 1500) seoScore += 8;
    else seoScore += 4;

    // 2. Keyword density (10pts)
    if (keywordDensity >= 1 && keywordDensity <= 1.5) seoScore += 10;
    else if (keywordDensity >= 0.8 && keywordDensity < 2) seoScore += 7;
    else seoScore += 3;

    // 3. Structure HTML (25pts)
    if (h1Count === 1) seoScore += 5;
    if (h2Count >= 4 && h2Count <= 6) seoScore += 8;
    else if (h2Count >= 3) seoScore += 5;
    if (h3Count >= 3) seoScore += 7;
    if (listCount >= 3) seoScore += 5;

    // 4. Rich content (20pts)
    if (hasTable) seoScore += 8;
    if (hasFAQ) seoScore += 7;
    if (internalLinksCount >= 2) seoScore += 5;

    // 5. Lisibilité (15pts)
    if (fleschScore >= 65) seoScore += 15;
    else if (fleschScore >= 55) seoScore += 12;
    else if (fleschScore >= 45) seoScore += 8;
    else seoScore += 4;

    // 6. Meta tags (10pts)
    if (metaTitleLength >= 50 && metaTitleLength <= 60) seoScore += 5;
    else if (metaTitleLength >= 40 && metaTitleLength <= 70) seoScore += 3;
    if (metaDescLength >= 140 && metaDescLength <= 160) seoScore += 5;
    else if (metaDescLength >= 120 && metaDescLength <= 170) seoScore += 3;

    // 7. External sources (5pts)
    if (externalSourcesCount >= 5) seoScore += 5;
    else if (externalSourcesCount >= 3) seoScore += 3;
    else seoScore += 1;

    seoScore = Math.min(100, Math.max(0, seoScore));

    console.log(`📊 SEO Score: ${seoScore}/100 (Words: ${wordCount}, Flesch: ${fleschScore.toFixed(1)}, Density: ${keywordDensity.toFixed(2)}%)`);
    console.log(`📊 Rich elements: Table=${hasTable}, FAQ=${hasFAQ}, Internal Links=${internalLinksCount}, Sources=${externalSourcesCount}`);

    // Generate slug
    const slug = keyword.keyword
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Date.now().toString(36);

    // Insert article
    const { data: article, error: insertError } = await supabase
      .from('blog_articles')
      .insert({
        keyword_id: keyword.id,
        slug,
        title: articleData.title,
        meta_title: articleData.meta_title,
        meta_description: articleData.meta_description,
        content: enrichedContent,
        excerpt: articleData.excerpt,
        featured_image_url: featuredImageUrl,
        seo_score: seoScore,
        status: 'published',
        published_at: new Date().toISOString(),
        generated_by_ai: true,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Update keyword stats
    await supabase
      .from('blog_keywords')
      .update({
        last_used_at: new Date().toISOString(),
        times_used: keyword.times_used + 1,
      })
      .eq('id', keyword.id);

    // Update schedule
    const { data: schedule } = await supabase
      .from('blog_generation_schedule')
      .select('*')
      .single();

    if (schedule) {
      await supabase
        .from('blog_generation_schedule')
        .update({
          last_generation_at: new Date().toISOString(),
          next_generation_at: new Date(Date.now() + schedule.frequency_days * 24 * 60 * 60 * 1000).toISOString(),
          total_generated: schedule.total_generated + 1,
        })
        .eq('id', schedule.id);
    }

    // Log success
    const generationTime = Date.now() - startTime;
    if (logId) {
      await supabase
        .from('blog_generation_logs')
        .update({
          status: 'success',
          article_id: article.id,
          word_count: wordCount,
          seo_score: seoScore,
          generation_time_ms: generationTime,
          metadata: {
            h1: h1Count,
            h2: h2Count,
            h3: h3Count,
            lists: listCount,
            table: hasTable,
            faq: hasFAQ,
            internal_links: internalLinksCount,
            sources: externalSourcesCount,
            flesch_score: Math.round(fleschScore),
            keyword_density: parseFloat(keywordDensity.toFixed(2))
          }
        })
        .eq('id', logId);
    }

    console.log(`🎉 Article created: ${article.slug} (Score: ${seoScore}, Time: ${generationTime}ms)`);

    return new Response(
      JSON.stringify({
        success: true,
        article: {
          id: article.id,
          slug: article.slug,
          title: article.title,
          seo_score: seoScore,
          word_count: wordCount,
          generation_time_ms: generationTime
        },
        keyword: keyword.keyword,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Error in generate-seo-article:', error);
    
    // Log error
    if (logId) {
      try {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );
        await supabase
          .from('blog_generation_logs')
          .update({
            status: 'error',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            generation_time_ms: Date.now() - startTime
          })
          .eq('id', logId);
      } catch (logError) {
        console.error('Failed to log error:', logError);
      }
    }

    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
