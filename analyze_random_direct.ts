/**
 * Script d'analyse complète du projet Random via API Supabase
 * Utilise le client Supabase du projet
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xhrievvdnajvylyrowwu.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocmlldnZkbmFqdnlseXJvd3d1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTg5NDUzNSwiZXhwIjoyMDY1NDcwNTM1fQ.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocmlldnZkbmFqdnlseXJvd3d1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTg5NDUzNSwiZXhwIjoyMDY1NDcwNTM1fQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function analyzeDatabase() {
  console.log('🔍 ANALYSE COMPLÈTE DU PROJET RANDOM\n');
  console.log('='.repeat(80));

  try {
    // 1. Compter les profils
    console.log('\n👥 UTILISATEURS\n');
    const { count: profilesCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    console.log(`Total profils: ${profilesCount || 0}`);

    // 2. Analyser les groupes
    console.log('\n🎯 GROUPES\n');
    const { data: groups } = await supabase
      .from('groups')
      .select('status')
      .limit(1000);
    
    if (groups) {
      const groupsByStatus = groups.reduce((acc: any, g: any) => {
        acc[g.status] = (acc[g.status] || 0) + 1;
        return acc;
      }, {});
      
      console.log('Groupes par statut:');
      Object.entries(groupsByStatus).forEach(([status, count]) => {
        console.log(`  - ${status}: ${count}`);
      });
      console.log(`Total: ${groups.length}`);
    }

    // 3. Compter les bar owners
    console.log('\n🍺 BAR OWNERS\n');
    const { count: barOwnersCount } = await supabase
      .from('bar_owners')
      .select('*', { count: 'exact', head: true });
    console.log(`Total bar owners: ${barOwnersCount || 0}`);

    // 4. Compter les messages
    console.log('\n💬 MESSAGES\n');
    const { count: messagesCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true });
    console.log(`Total messages: ${messagesCount || 0}`);

    // 5. Analyser les scheduled groups
    console.log('\n📅 SCHEDULED GROUPS\n');
    const { count: scheduledCount } = await supabase
      .from('scheduled_groups')
      .select('*', { count: 'exact', head: true });
    console.log(`Total scheduled groups: ${scheduledCount || 0}`);

    // 6. CRM Campaigns
    console.log('\n📧 CRM CAMPAIGNS\n');
    const { count: campaignsCount } = await supabase
      .from('crm_campaigns')
      .select('*', { count: 'exact', head: true });
    console.log(`Total campagnes: ${campaignsCount || 0}`);

    // 7. Blog Articles
    console.log('\n📝 BLOG ARTICLES\n');
    const { count: articlesCount } = await supabase
      .from('blog_articles')
      .select('*', { count: 'exact', head: true });
    console.log(`Total articles: ${articlesCount || 0}`);

    // 8. Community Stories
    console.log('\n✨ COMMUNITY STORIES\n');
    const { count: storiesCount } = await supabase
      .from('community_stories')
      .select('*', { count: 'exact', head: true });
    console.log(`Total stories: ${storiesCount || 0}`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ Analyse terminée !');

  } catch (error) {
    console.error('\n❌ ERREUR:', error);
  }
}

analyzeDatabase();


