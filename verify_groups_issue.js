// Script de vérification des groupes - Random Rendezvous
// Analyse pourquoi seulement 1 participant pour 21 groupes

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://xhrievvdnajvylyrowwu.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocmlldnZkbmFqdnlseXJvd3d1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTg5NDUzNSwiZXhwIjoyMDY1NDcwNTM1fQ.AnCnMmWtb0bKPRIxwoXblVyCf9saSGm4PyiWPC7gUHQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function analyzeGroups() {
  console.log('🔍 Analyse des groupes Random Rendezvous...\n');

  // 1. Récupérer tous les groupes avec leurs participants
  const { data: groups, error: groupsError } = await supabase
    .from('groups')
    .select(`
      id,
      status,
      created_at,
      current_participants,
      max_participants,
      bar_name,
      is_scheduled,
      group_participants (
        id,
        user_id,
        status,
        joined_at
      )
    `)
    .order('created_at', { ascending: false })
    .limit(20);

  if (groupsError) {
    console.error('❌ Erreur lors de la récupération des groupes:', groupsError);
    return;
  }

  console.log(`📊 Total de groupes récupérés: ${groups.length}\n`);

  // 2. Analyser chaque groupe
  const analysis = {
    total: groups.length,
    withParticipants: 0,
    withoutParticipants: 0,
    mismatchCount: 0,
    byStatus: {},
  };

  groups.forEach(group => {
    const actualParticipants = group.group_participants?.length || 0;
    const declaredParticipants = group.current_participants || 0;

    // Compter par statut
    analysis.byStatus[group.status] = (analysis.byStatus[group.status] || 0) + 1;

    if (actualParticipants > 0) {
      analysis.withParticipants++;
    } else {
      analysis.withoutParticipants++;
    }

    if (actualParticipants !== declaredParticipants) {
      analysis.mismatchCount++;
      console.log(`⚠️  Groupe ${group.id.substring(0, 8)}...`);
      console.log(`   Statut: ${group.status}`);
      console.log(`   Déclaré: ${declaredParticipants} participants`);
      console.log(`   Réel: ${actualParticipants} participants`);
      console.log(`   Bar: ${group.bar_name || 'Non assigné'}`);
      console.log(`   Créé: ${new Date(group.created_at).toLocaleString('fr-FR')}`);
      console.log('');
    }
  });

  // 3. Afficher le résumé
  console.log('\n📈 RÉSUMÉ DE L\'ANALYSE:');
  console.log('========================');
  console.log(`Total de groupes: ${analysis.total}`);
  console.log(`Avec participants: ${analysis.withParticipants}`);
  console.log(`Sans participants: ${analysis.withoutParticipants}`);
  console.log(`Incohérences count: ${analysis.mismatchCount}`);
  console.log('\nPar statut:');
  Object.entries(analysis.byStatus).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`);
  });

  // 4. Vérifier les triggers et fonctions
  console.log('\n🔧 VÉRIFICATION DES TRIGGERS:');
  console.log('==============================');
  
  const { data: triggers, error: triggersError } = await supabase.rpc('exec_sql', {
    query: `
      SELECT 
        trigger_name,
        event_manipulation,
        event_object_table,
        action_statement
      FROM information_schema.triggers
      WHERE event_object_schema = 'public'
      AND event_object_table IN ('groups', 'group_participants')
      ORDER BY event_object_table, trigger_name;
    `
  });

  if (triggersError) {
    console.log('⚠️  Impossible de vérifier les triggers:', triggersError.message);
  } else if (triggers && triggers.length > 0) {
    triggers.forEach(trigger => {
      console.log(`\n📌 ${trigger.trigger_name}`);
      console.log(`   Table: ${trigger.event_object_table}`);
      console.log(`   Event: ${trigger.event_manipulation}`);
      console.log(`   Action: ${trigger.action_statement.substring(0, 100)}...`);
    });
  } else {
    console.log('ℹ️  Aucun trigger trouvé sur groups/group_participants');
  }

  // 5. Recommandations
  console.log('\n💡 RECOMMANDATIONS:');
  console.log('===================');
  
  if (analysis.mismatchCount > 0) {
    console.log('🔴 CRITIQUE: Incohérence entre current_participants et la réalité');
    console.log('   → Vérifier les triggers update_group_participant_count');
    console.log('   → Recalculer current_participants pour tous les groupes');
  }
  
  if (analysis.withoutParticipants > analysis.total / 2) {
    console.log('🟡 ATTENTION: Plus de 50% des groupes n\'ont aucun participant');
    console.log('   → Vérifier le processus de création de groupe');
    console.log('   → Vérifier que les utilisateurs rejoignent bien les groupes');
  }

  console.log('\n✅ Analyse terminée !');
}

analyzeGroups().catch(console.error);

