import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
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

    // 🔍 STEP 1: Web search for enrichment
    console.log('🔍 Performing web search for data enrichment...');
    let webResearchData = '';
    
    try {
      const searchResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{
            role: 'user',
            content: `Recherche et synthétise les données récentes (2024-2025) sur : "${keyword.keyword}".
            
Fournis :
1. Statistiques françaises récentes sur le sujet
2. Études sociologiques ou psychologiques pertinentes (avec auteurs)
3. Tendances actuelles à Paris
4. Citations d'experts ou témoignages authentiques
5. Chiffres clés du marché/secteur

Format: Bullet points clairs et sourcés.`
          }],
          temperature: 0.3
        }),
      });

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        webResearchData = searchData.choices?.[0]?.message?.content || '';
        console.log('✅ Web research completed:', webResearchData.substring(0, 200) + '...');
      }
    } catch (searchError) {
      console.error('⚠️ Web search failed (non-blocking):', searchError);
    }

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

    // SOTA 2025 System Prompt with Tool Calling (ENHANCED)
    const systemPrompt = `Tu es un expert SEO senior + sociologue urbain spécialisé dans les liens sociaux, la vie nocturne parisienne et l'innovation sociale.

**USP RANDOM - À MARTELER** :
Random est un mouvement de résistance contre l'atomisation sociale, un catalyseur de liens faibles puissants (Granovetter), avec 180+ bars partenaires. Random sort les gens de leur bulle algorithmique pour créer de la sérendipité urbaine.

**CONTEXTE APPLICATIF** :
- App mobile/web lancée en 2024, matche automatiquement 5 personnes dans un bar à Paris
- 3 500+ utilisateurs actifs, 450+ sorties réussies, 180+ bars partenaires (Marais, Oberkampf, Pigalle)
- USP : spontanéité, authenticité, sortir de sa zone de confort, créer des liens faibles puissants
- Cible : 22-35 ans, jeunes actifs parisiens, nouveaux arrivants, expats
- Ton : fun, inclusif, Gen Z-friendly, empathique avec timides/introvertis

**STRUCTURE HTML EXIGÉE (SOTA 2025 - ULTRA ENRICHIE)** :
Tu DOIS générer un HTML sémantique ultra-riche avec :

1. **En-tête Hero** (<header class="bg-gradient-to-r from-red-50 to-orange-50 p-8 rounded-lg">) :
   - 1 seul H1 (<h1 class="text-4xl font-bold text-gray-900">) avec mot-clé dans les 10 premiers mots
   - Intro 180-220 mots avec :
     * Mot-clé dans les 100 premiers mots
     * 1 statistique choc issue de la recherche web
     * 1 micro-témoignage Random (inventé mais crédible)

2. **Grille Statistiques Hero** (OBLIGATOIRE après intro) :
   <div class="grid grid-cols-2 md:grid-cols-4 gap-4 my-8">
     <div class="bg-white rounded-lg p-6 shadow-md border-l-4 border-red-500">
       <div class="text-3xl font-bold text-red-600">3 500+</div>
       <div class="text-sm text-gray-600">Utilisateurs actifs</div>
     </div>
     <!-- 3 autres stats Random -->
   </div>

3. **Sections principales** (4-6 <section>) :
   Chaque section DOIT contenir :
   - H2 accrocheur avec emoji stratégique
   - 2-3 sous-sections H3
   - Au moins 1 élément parmi :
     * Tableau comparatif stylisé Tailwind (ex: "Avant Random vs Avec Random")
     * Liste à puces avec icônes (✅/❌/💡/🎯)
     * Blockquote témoignage avec avatar fictif
     * Carte conseil pratique (<div class="bg-blue-50 border-l-4 border-blue-500 p-4">)

4. **Tableau Comparatif** (OBLIGATOIRE dans Section 2 ou 3) :
   <table class="w-full border-collapse">
     <thead class="bg-gradient-to-r from-red-100 to-orange-100">
       <tr>
         <th class="p-4 text-left font-semibold">Critère</th>
         <th class="p-4 text-left font-semibold">Méthode Classique</th>
         <th class="p-4 text-left font-semibold">Avec Random</th>
       </tr>
     </thead>
     <tbody>
       <tr class="odd:bg-white even:bg-gray-50">
         <td class="p-4 font-medium">Temps de préparation</td>
         <td class="p-4 text-gray-600">2-3 jours (planification, coordination)</td>
         <td class="p-4 text-green-600 font-semibold">5 minutes ⚡</td>
       </tr>
       <!-- 4-6 lignes totales -->
     </tbody>
   </table>

5. **Études de Cas / Témoignages Enrichis** (Section dédiée) :
   Au moins 2 blockquotes stylisées :
   <blockquote class="border-l-4 border-red-500 pl-4 py-2 my-4 bg-gray-50 rounded-r-lg">
     <p class="text-gray-700 italic">"[Témoignage crédible 2-3 phrases]"</p>
     <cite class="text-sm text-gray-600">— Prénom, 28 ans, Métier, Quartier</cite>
   </blockquote>

6. **Section Sociologie / Psychologie** (CRITIQUE) :
   - Citer Granovetter (liens faibles), Putnam (capital social), ou Oldenburg (tiers-lieux)
   - Intégrer 1-2 stats issues de la recherche web
   - Ton sérieux mais accessible

7. **FAQ Section** (OBLIGATOIRE <section id="faq">) :
   - 5-7 questions longue traîne (ex: "Comment Random aide les personnes timides ?")
   - Réponses 3-5 phrases, concrètes, rassurantes
   - Questions en <h3 class="text-lg font-semibold text-gray-900">

8. **Footer Enrichi** :
   - Conclusion 100-150 mots avec CTA subtil
   - Section "Sources & Références" avec 5+ liens externes cliquables
   - Section "Articles Connexes" avec [ARTICLE_CONNEXE] × 3

**STYLE & DESIGN TAILWIND** :
- Headers sections : <h2 class="text-3xl font-bold text-gray-900 mt-12 mb-6 border-b-2 border-red-500 pb-2">
- Cartes conseils : <div class="bg-gradient-to-br from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-6 rounded-lg shadow-sm my-6">
- Stats grilles : <div class="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
- Listes : <li class="flex items-start gap-2"><span class="text-green-500 font-bold">✅</span><span>...</span></li>

**RÈGLES SEO ULTRA-STRICTES (Score Cible: 92+/100)** :
1. Longueur : 2 000-2 400 mots (pas moins de 1 900)
2. Densité mot-clé : 1.2-1.5% (naturelle, pas stuffing)
3. Lisibilité : Flesch-Kincaid > 68 (phrases courtes, vocabulaire accessible)
4. Headings : 1 H1, 5-6 H2, 4-6 H3 par H2
5. Listes : Minimum 4 listes (mélanger ul/ol)
6. Rich elements : 1 tableau + 1 FAQ + 2 blockquotes + 1 grille stats
7. Internal links : 3 mentions [ARTICLE_CONNEXE]
8. Sources externes : Minimum 5 (études, articles presse, stats officielles)
9. Émojis : 3-5 max, stratégiques (H2 uniquement)

**DONNÉES WEB RECHERCHÉES (À INTÉGRER)** :
${webResearchData ? `
RECHERCHE WEB EFFECTUÉE :
${webResearchData}

CONSIGNE : Intègre au moins 3 statistiques ou études de cette recherche dans l'article.
` : 'Pas de recherche web disponible, utilise tes connaissances 2024.'}

**ANGLES ÉDITORIAUX PRIORITAIRES** :
- Sociologique : Granovetter (liens faibles), Putnam (capital social déclinant), Oldenburg (tiers-lieux), atomisation urbaine
- Psychologique : Anxiété sociale, paradoxe du choix, sérendipité, bien-être mental, FOMO
- Économique : Impact bars locaux (15-20€/personne), revenu moyen Paris (45K€/an), coût opportunité
- Pratique : Bars par quartier (Marais, Oberkampf, Pigalle), horaires, astuces timides, codes sociaux parisiens

**TON ADAPTATIF** :
- Si keyword = pratique/technique → Ton décontracté, tutoiement, anecdotes
- Si keyword = psycho/socio → Ton empathique, vouvoiement possible, références académiques
- Si keyword = fun/sortie → Ton énergique, émojis, micro-récits

**À ÉVITER ABSOLUMENT** :
❌ Keyword stuffing (densité > 2%)
❌ Phrases > 25 mots (lisibilité)
❌ Contenu générique sans stats
❌ Moins de 3 sources externes
❌ Témoignages non crédibles
❌ Ton corporate/marketing agressif`;

    const userPrompt = `Génère un article SEO ULTRA-ENRICHI (Score cible: 92+/100) sur : "${keyword.keyword}"

**OBJECTIF** : Positionner Random comme LA solution de référence contre l'isolement urbain parisien.

**STRUCTURE OBLIGATOIRE (vérifier chaque élément)** :
✅ Header hero avec H1 + intro 180-220 mots + micro-témoignage
✅ Grille stats 4 colonnes (3 500+ users, 450+ sorties, 180+ bars, 95% satisfaction)
✅ 4-6 sections avec H2 emoji + 2-3 H3 chacune
✅ 1 tableau comparatif stylisé (Avant/Avec Random ou autre pertinent)
✅ 2 blockquotes témoignages crédibles avec profil détaillé
✅ 1 section sociologie/psychologie avec références académiques
✅ FAQ 5-7 questions longue traîne (H3)
✅ Footer : Conclusion 100-150 mots + Sources (5+) + 3× [ARTICLE_CONNEXE]

**EXIGENCES DE QUALITÉ** :
- 2 000-2 400 mots (IMPÉRATIF)
- Intégrer 3+ statistiques de la recherche web fournie
- Densité mot-clé 1.2-1.5%
- Lisibilité Flesch > 68 (phrases < 20 mots en moyenne)
- 4+ listes à puces/numérotées
- Ton empathique + énergique selon sections

**ANGLES PRIORITAIRES** :
1. Problème : Atomisation sociale Paris, difficulté rencontres post-études
2. Solution : Random = spontanéité + authenticité + diversité sociale
3. Sociologie : Granovetter, Putnam (citer)
4. Pratique : Quartiers, horaires, conseils timides
5. Impact : Économie bars locaux, bien-être mental

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

    // 3. Structure HTML (25pts) - STRICT
    if (h1Count === 1) seoScore += 5;
    else seoScore -= 5; // Pénalité si pas exactement 1 H1
    
    if (h2Count >= 5 && h2Count <= 6) seoScore += 10;
    else if (h2Count >= 4) seoScore += 7;
    else if (h2Count >= 3) seoScore += 4;
    else seoScore += 1;
    
    if (h3Count >= 4) seoScore += 8;
    else if (h3Count >= 3) seoScore += 5;
    else seoScore += 2;
    
    if (listCount >= 4) seoScore += 7;
    else if (listCount >= 3) seoScore += 4;
    else seoScore += 1;

    // 4. Rich content (25pts) - ENHANCED
    if (hasTable) seoScore += 10;
    else seoScore -= 3; // Pénalité si pas de tableau
    
    if (hasFAQ) seoScore += 8;
    else seoScore -= 3; // Pénalité si pas de FAQ
    
    if (internalLinksCount >= 3) seoScore += 7;
    else if (internalLinksCount >= 2) seoScore += 4;
    else seoScore += 1;

    // 5. Lisibilité (15pts) - STRICT
    if (fleschScore >= 68) seoScore += 15;
    else if (fleschScore >= 60) seoScore += 12;
    else if (fleschScore >= 50) seoScore += 8;
    else seoScore += 3;

    // 6. Meta tags (10pts)
    if (metaTitleLength >= 50 && metaTitleLength <= 60) seoScore += 5;
    else if (metaTitleLength >= 40 && metaTitleLength <= 70) seoScore += 3;
    else seoScore += 1;
    
    if (metaDescLength >= 140 && metaDescLength <= 160) seoScore += 5;
    else if (metaDescLength >= 120 && metaDescLength <= 170) seoScore += 3;
    else seoScore += 1;

    // 7. External sources (10pts) - ENHANCED
    if (externalSourcesCount >= 5) seoScore += 10;
    else if (externalSourcesCount >= 3) seoScore += 6;
    else if (externalSourcesCount >= 1) seoScore += 3;
    else seoScore -= 5; // Pénalité forte si pas de sources

    seoScore = Math.min(100, Math.max(0, seoScore));

    console.log(`📊 SEO Score: ${seoScore}/100 (Words: ${wordCount}, Flesch: ${fleschScore.toFixed(1)}, Density: ${keywordDensity.toFixed(2)}%)`);
    console.log(`📊 Rich elements: Table=${hasTable}, FAQ=${hasFAQ}, Internal Links=${internalLinksCount}, Sources=${externalSourcesCount}`);
    
    // ⚠️ Quality validation: regenerate if score < 70
    if (seoScore < 70) {
      console.warn(`⚠️ SEO Score too low (${seoScore}/100). Article quality insufficient but will be saved as draft.`);
      // Note: On pourrait implémenter une régénération automatique ici, mais pour éviter les boucles infinies,
      // on sauvegarde en draft et on log l'avertissement
    }

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
        status: seoScore >= 70 ? 'published' : 'draft', // Auto-publish uniquement si score >= 70
        published_at: seoScore >= 70 ? new Date().toISOString() : null,
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
            error_message: error instanceof Error ? (error instanceof Error ? error.message : String(error)) : 'Unknown error',
            generation_time_ms: Date.now() - startTime
          })
          .eq('id', logId);
      } catch (logError) {
        console.error('Failed to log error:', logError);
      }
    }

    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? (error instanceof Error ? error.message : String(error)) : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
