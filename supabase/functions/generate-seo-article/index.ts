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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Sélectionner le mot-clé à utiliser (priorité haute, jamais utilisé ou utilisé il y a >30 jours)
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
      console.log('No keywords available for article generation');
      return new Response(
        JSON.stringify({ error: 'No keywords available' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const keyword = keywords[0];
    console.log(`Generating article for keyword: ${keyword.keyword}`);

    // Prompt SOTA 2025 avec E-E-A-T
    const systemPrompt = `Tu es un expert SEO senior avec 10 ans d'expérience en content marketing, spécialisé dans la vie nocturne et les rencontres sociales à Paris.

**CONTEXTE APPLICATIF (OBLIGATOIRE À INTÉGRER)** :
- Random est une app mobile/web lancée en 2024 qui matche automatiquement 5 personnes inconnues dans un bar à Paris
- 3 500+ utilisateurs actifs, 450+ sorties réussies, 180+ bars partenaires
- USP : spontanéité, authenticité, sortir de sa zone de confort sans prise de tête
- Cible : 22-35 ans, jeunes actifs parisiens, sociables mais seuls le soir
- Ton de marque : fun, inclusif, Gen Z-friendly, pas de bullshit

**RÈGLES E-E-A-T GOOGLE 2025 (CRITIQUES)** :
1. **Experience** : Inclure des anecdotes réelles d'utilisateurs Random (inventer de manière crédible)
2. **Expertise** : Citer des stats, études (ex: "Selon une étude IFOP 2024, 68% des 25-34 ans...")
3. **Authoritativeness** : Mentionner des quartiers parisiens précis, bars réels (sans les nommer = publicité)
4. **Trustworthiness** : Ajouter des CTA subtils, pas de vente agressive

**STRUCTURE JSON OBLIGATOIRE** :
{
  "title": "Titre H1 accrocheur avec mot-clé (max 60 caractères)",
  "meta_title": "Meta title optimisé SEO (50-60 caractères)",
  "meta_description": "Meta description engageante (140-155 caractères)",
  "excerpt": "Résumé en 2-3 phrases (150 caractères max)",
  "content": "HTML sémantique complet"
}

**STRUCTURE HTML OBLIGATOIRE** :
<article>
  <header>
    <h1>[Titre avec mot-clé]</h1>
    <p class="intro">[Introduction 150-200 mots avec mot-clé dans les 100 premiers mots]</p>
  </header>

  <section>
    <h2>[Section principale 1]</h2>
    <p>[Paragraphe 100-150 mots]</p>
    <h3>[Sous-section]</h3>
    <ul>
      <li>[Point clé 1]</li>
      <li>[Point clé 2]</li>
    </ul>
  </section>

  <section>
    <h2>[Section principale 2]</h2>
    <p>[Intégrer une anecdote utilisateur Random ici]</p>
    <blockquote>"Citation réaliste d'un utilisateur Random"</blockquote>
  </section>

  <section>
    <h2>[Section principale 3]</h2>
    <p>[Paragraphe avec stat crédible]</p>
  </section>

  <footer>
    <h2>Conclusion</h2>
    <p>[Résumé + CTA subtil vers Random]</p>
    <p>Envie de tester ? <a href="https://random-app.fr">Découvre Random</a> et rejoins la communauté.</p>
  </footer>
</article>

**RÈGLES SEO STRICTES** :
1. Longueur : 1 500-2 000 mots (idéal pour 2025)
2. Densité mot-clé : 1-1.5% (naturelle, PAS de keyword stuffing)
3. Lisibilité : Score Flesch-Kincaid > 60 (phrases courtes, vocabulaire simple)
4. Headings : 1 H1, 3-5 H2, 2-3 H3 par section
5. Listes : Minimum 2 listes à puces
6. Paragraphes : 100-150 mots max par paragraphe
7. Émojis stratégiques : 2-3 max (pas plus, trop Gen Z = spam)

**TON À ADOPTER** :
- Conversationnel mais crédible
- Tutoiement naturel
- Pas de langue de bois
- Exemples concrets parisiens (Marais, Oberkampf, République, Canal Saint-Martin...)

**CE QU'IL FAUT ÉVITER** :
❌ Répétition excessive du mot-clé (bourrage)
❌ Phrases de plus de 25 mots
❌ Jargon technique SEO (backlinks, SERP...)
❌ Contenu générique applicable à toutes les villes
❌ Promesses exagérées ("Révolutionnez votre vie sociale !")
❌ Absence de données chiffrées ou sources`;

    const userPrompt = `Génère un article SEO sur le mot-clé: "${keyword.keyword}"

L'article doit positionner Random comme LA solution pour les personnes qui cherchent à ${keyword.keyword.toLowerCase()}. 
Mets en avant les avantages: spontanéité, authenticité, découverte de bars, rencontres sans prise de tête.

Important: 
- Renvoie UNIQUEMENT du JSON valide
- Le contenu HTML doit être bien formaté avec des balises sémantiques
- Intègre naturellement le mot-clé sans forcer
- Termine avec un CTA subtil vers Random`;

    // Appel à l'API Lovable AI
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
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const generatedContent = aiData.choices?.[0]?.message?.content;

    if (!generatedContent) {
      throw new Error('No content generated by AI');
    }

    console.log('AI generated content successfully');

    // Parser la réponse JSON
    let articleData;
    try {
      // Extraire le JSON si enrobé dans du texte
      const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : generatedContent;
      articleData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse AI response:', generatedContent);
      throw new Error('Invalid JSON response from AI');
    }

    // Générer un slug SEO-friendly
    const slug = keyword.keyword
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Date.now().toString(36);

    // Fonction de calcul du score Flesch-Kincaid (lisibilité)
    function calculateFleschKincaid(text: string): number {
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
      const words = text.split(/\s+/).filter(w => w.length > 0).length;
      const syllables = text.split(/[aeiouyAEIOUY]/).length - 1;
      
      if (sentences === 0 || words === 0) return 0;
      
      const avgWordsPerSentence = words / sentences;
      const avgSyllablesPerWord = syllables / words;
      
      const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
      return Math.max(0, Math.min(100, score));
    }

    // Calculer le score SEO avancé SOTA 2025
    const content = articleData.content || '';
    const plainText = content.replace(/<[^>]*>/g, ' ');
    const wordCount = plainText.split(/\s+/).filter(w => w.length > 0).length;
    const keywordCount = (content.match(new RegExp(keyword.keyword, 'gi')) || []).length;
    const keywordDensity = (keywordCount / wordCount) * 100;
    const fleschScore = calculateFleschKincaid(plainText);

    // Headings
    const h1Count = (content.match(/<h1>/g) || []).length;
    const h2Count = (content.match(/<h2>/g) || []).length;
    const h3Count = (content.match(/<h3>/g) || []).length;

    // Lists
    const hasLists = content.includes('<ul>') || content.includes('<ol>');
    const listCount = (content.match(/<ul>|<ol>/g) || []).length;

    // Meta tags
    const metaTitleLength = articleData.meta_title?.length || 0;
    const metaDescLength = articleData.meta_description?.length || 0;

    // CALCUL DU SCORE AVANCÉ (SOTA 2025)
    let seoScore = 0;

    // 1. Longueur (20pts)
    if (wordCount >= 1500 && wordCount <= 2000) seoScore += 20;
    else if (wordCount >= 1200 && wordCount < 1500) seoScore += 15;
    else if (wordCount >= 800 && wordCount < 1200) seoScore += 10;
    else if (wordCount < 800) seoScore += 5;

    // 2. Keyword density (15pts)
    if (keywordDensity >= 1 && keywordDensity <= 1.5) seoScore += 15;
    else if (keywordDensity >= 0.8 && keywordDensity < 2) seoScore += 10;
    else if (keywordDensity < 0.8 || keywordDensity > 2.5) seoScore += 5;

    // 3. Structure HTML (25pts)
    if (h1Count === 1) seoScore += 5;
    if (h2Count >= 3 && h2Count <= 5) seoScore += 10;
    else if (h2Count >= 2) seoScore += 7;
    if (h3Count >= 2) seoScore += 5;
    if (hasLists && listCount >= 2) seoScore += 5;

    // 4. Lisibilité (20pts)
    if (fleschScore >= 60) seoScore += 20;
    else if (fleschScore >= 50) seoScore += 15;
    else if (fleschScore >= 40) seoScore += 10;
    else seoScore += 5;

    // 5. Meta tags (10pts)
    if (metaTitleLength >= 50 && metaTitleLength <= 60) seoScore += 5;
    else if (metaTitleLength >= 40 && metaTitleLength <= 70) seoScore += 3;

    if (metaDescLength >= 140 && metaDescLength <= 160) seoScore += 5;
    else if (metaDescLength >= 120 && metaDescLength <= 170) seoScore += 3;

    // 6. Lisibilité bonus (10pts) - check internal links would be here but we skip for now
    seoScore += 5; // Base bonus

    // MAX = 100pts
    seoScore = Math.min(100, Math.max(0, seoScore));

    console.log(`Advanced SEO Score: ${seoScore}/100 (Words: ${wordCount}, Flesch: ${fleschScore.toFixed(1)}, Density: ${keywordDensity.toFixed(2)}%)`);


    // Insérer l'article dans la base de données
    const { data: article, error: insertError } = await supabase
      .from('blog_articles')
      .insert({
        keyword_id: keyword.id,
        slug,
        title: articleData.title,
        meta_title: articleData.meta_title,
        meta_description: articleData.meta_description,
        content: articleData.content,
        excerpt: articleData.excerpt,
        seo_score: Math.min(100, seoScore),
        status: 'published',
        published_at: new Date().toISOString(),
        generated_by_ai: true,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Mettre à jour les statistiques du mot-clé
    await supabase
      .from('blog_keywords')
      .update({
        last_used_at: new Date().toISOString(),
        times_used: keyword.times_used + 1,
      })
      .eq('id', keyword.id);

    // Mettre à jour le schedule
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

    console.log(`Article created successfully: ${article.slug} (Score SEO: ${seoScore})`);

    return new Response(
      JSON.stringify({
        success: true,
        article: {
          id: article.id,
          slug: article.slug,
          title: article.title,
          seo_score: seoScore,
        },
        keyword: keyword.keyword,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-seo-article:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
