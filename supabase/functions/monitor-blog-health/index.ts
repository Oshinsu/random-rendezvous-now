import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const alerts = [];

    // 1. Vérifier les articles avec 0 vues après 7 jours
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: zeroViewArticles } = await supabase
      .from('blog_articles')
      .select('id, title, slug, published_at, views_count')
      .eq('status', 'published')
      .eq('views_count', 0)
      .lt('published_at', sevenDaysAgo);

    if (zeroViewArticles && zeroViewArticles.length > 0) {
      console.warn(`⚠️ ${zeroViewArticles.length} articles avec 0 vues après 7 jours`);
      
      alerts.push({
        type: 'zero_views',
        severity: 'warning',
        count: zeroViewArticles.length,
        articles: zeroViewArticles.map(a => ({ slug: a.slug, title: a.title }))
      });

      await supabase.from('admin_audit_log').insert({
        admin_user_id: '00000000-0000-0000-0000-000000000000',
        action_type: 'blog_health_alert',
        table_name: 'blog_articles',
        metadata: {
          alert_type: 'zero_views',
          count: zeroViewArticles.length,
          articles: zeroViewArticles.map(a => ({ slug: a.slug, title: a.title })),
          recommendation: 'Review SEO, consider unpublishing or updating content'
        }
      });
    }

    // 2. Calculer score SEO moyen des 30 derniers jours
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentArticles } = await supabase
      .from('blog_articles')
      .select('seo_score')
      .eq('status', 'published')
      .gte('published_at', thirtyDaysAgo);

    const avgSeoScore = recentArticles && recentArticles.length > 0
      ? recentArticles.reduce((sum, a) => sum + (a.seo_score || 0), 0) / recentArticles.length
      : 0;

    if (avgSeoScore > 0 && avgSeoScore < 70) {
      console.warn(`⚠️ Score SEO moyen faible: ${avgSeoScore.toFixed(1)}/100`);
      
      alerts.push({
        type: 'low_seo_score',
        severity: 'error',
        avg_score: avgSeoScore,
        article_count: recentArticles?.length || 0
      });

      await supabase.from('admin_audit_log').insert({
        admin_user_id: '00000000-0000-0000-0000-000000000000',
        action_type: 'blog_health_alert',
        table_name: 'blog_articles',
        metadata: {
          alert_type: 'low_seo_score',
          avg_score: avgSeoScore,
          article_count: recentArticles?.length || 0,
          recommendation: 'Improve AI prompt or review generated content manually'
        }
      });
    }

    // 3. Vérifier keywords épuisés
    const thirtyDaysAgoKeyword = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: activeKeywords } = await supabase
      .from('blog_keywords')
      .select('id, keyword')
      .eq('status', 'active')
      .or(`last_used_at.is.null,last_used_at.lt.${thirtyDaysAgoKeyword}`);

    if (activeKeywords && activeKeywords.length < 5) {
      console.warn(`⚠️ Seulement ${activeKeywords.length} mots-clés disponibles`);
      
      alerts.push({
        type: 'keywords_exhausted',
        severity: 'error',
        available_count: activeKeywords.length
      });

      await supabase.from('admin_audit_log').insert({
        admin_user_id: '00000000-0000-0000-0000-000000000000',
        action_type: 'blog_health_alert',
        table_name: 'blog_keywords',
        metadata: {
          alert_type: 'keywords_exhausted',
          available_keywords: activeKeywords.length,
          recommendation: 'Add more keywords or reset last_used_at for old keywords'
        }
      });
    }

    // 4. Vérifier articles en draft trop nombreux
    const { count: draftCount } = await supabase
      .from('blog_articles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'draft');

    if (draftCount && draftCount > 5) {
      console.warn(`⚠️ ${draftCount} articles en brouillon`);
      
      alerts.push({
        type: 'too_many_drafts',
        severity: 'warning',
        count: draftCount
      });

      await supabase.from('admin_audit_log').insert({
        admin_user_id: '00000000-0000-0000-0000-000000000000',
        action_type: 'blog_health_alert',
        table_name: 'blog_articles',
        metadata: {
          alert_type: 'too_many_drafts',
          draft_count: draftCount,
          recommendation: 'Review and publish or delete draft articles'
        }
      });
    }

    // 5. Vérifier si l'automatisation est active
    const { data: schedule } = await supabase
      .from('blog_generation_schedule')
      .select('*')
      .limit(1)
      .single();

    const health_status = {
      automation_active: schedule?.is_active || false,
      zero_view_articles: zeroViewArticles?.length || 0,
      avg_seo_score: avgSeoScore > 0 ? avgSeoScore.toFixed(1) : 'N/A',
      available_keywords: activeKeywords?.length || 0,
      draft_articles: draftCount || 0,
      alerts_count: alerts.length,
      next_generation: schedule?.next_generation_at || null
    };

    console.log('Blog health check completed:', health_status);

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        health: health_status,
        alerts: alerts
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in monitor-blog-health:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
