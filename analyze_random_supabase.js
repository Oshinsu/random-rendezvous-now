#!/usr/bin/env node

/**
 * Script d'analyse complète du projet Random via API Supabase
 * Date: 2025-11-19
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xhrievvdnajvylyrowwu.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocmlldnZkbmFqdnlseXJvd3d1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTg5NDUzNSwiZXhwIjoyMDY1NDcwNTM1fQ.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocmlldnZkbmFqdnlseXJvd3d1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTg5NDUzNSwiZXhwIjoyMDY1NDcwNTM1fQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log('🔍 ANALYSE COMPLÈTE DU PROJET RANDOM\n');
console.log('=' .repeat(80));

async function analyzeDatabase() {
  try {
    // 1. Lister toutes les tables
    console.log('\n📁 LISTE DES TABLES\n');
    const { data: tables, error: tablesError } = await supabase
      .rpc('exec_sql', {
        query: `
          SELECT 
            table_name,
            (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
          FROM information_schema.tables t
          WHERE table_schema = 'public'
          ORDER BY table_name;
        `
      });

    if (tablesError) {
      console.error('❌ Erreur tables:', tablesError);
    } else {
      console.log(`Total tables: ${tables.length}\n`);
      tables.forEach((table, i) => {
        console.log(`${i + 1}. ${table.table_name} (${table.column_count} colonnes)`);
      });
    }

    // 2. Compter les utilisateurs
    console.log('\n\n👥 UTILISATEURS\n');
    const { count: usersCount, error: usersError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (usersError) {
      console.error('❌ Erreur users:', usersError);
    } else {
      console.log(`Total utilisateurs: ${usersCount || 0}`);
    }

    // 3. Compter les groupes
    console.log('\n\n🎯 GROUPES\n');
    const { data: groupsStats, error: groupsError } = await supabase
      .rpc('exec_sql', {
        query: `
          SELECT 
            status,
            COUNT(*) as count
          FROM groups
          GROUP BY status
          ORDER BY count DESC;
        `
      });

    if (groupsError) {
      console.error('❌ Erreur groups:', groupsError);
    } else {
      console.log('Groupes par statut:');
      groupsStats.forEach(stat => {
        console.log(`  - ${stat.status}: ${stat.count}`);
      });
    }

    // 4. Compter les bars
    console.log('\n\n🍺 BARS\n');
    const { count: barsCount, error: barsError } = await supabase
      .from('bar_owners')
      .select('*', { count: 'exact', head: true });

    if (barsError) {
      console.error('❌ Erreur bars:', barsError);
    } else {
      console.log(`Total bar owners: ${barsCount || 0}`);
    }

    // 5. Lister les fonctions PostgreSQL
    console.log('\n\n⚙️ FONCTIONS POSTGRESQL\n');
    const { data: functions, error: functionsError } = await supabase
      .rpc('exec_sql', {
        query: `
          SELECT 
            routine_name,
            routine_type
          FROM information_schema.routines
          WHERE routine_schema = 'public'
          ORDER BY routine_name;
        `
      });

    if (functionsError) {
      console.error('❌ Erreur functions:', functionsError);
    } else {
      console.log(`Total fonctions: ${functions.length}\n`);
      functions.forEach((func, i) => {
        console.log(`${i + 1}. ${func.routine_name} (${func.routine_type})`);
      });
    }

    // 6. Vérifier les migrations
    console.log('\n\n📦 MIGRATIONS\n');
    const { data: migrations, error: migrationsError } = await supabase
      .rpc('exec_sql', {
        query: `
          SELECT 
            version,
            name,
            executed_at
          FROM supabase_migrations.schema_migrations
          ORDER BY version DESC
          LIMIT 10;
        `
      });

    if (migrationsError) {
      console.error('❌ Erreur migrations:', migrationsError);
    } else {
      console.log(`Dernières migrations (${migrations.length}):\n`);
      migrations.forEach((mig, i) => {
        console.log(`${i + 1}. [${mig.version}] ${mig.name}`);
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ Analyse terminée !');

  } catch (error) {
    console.error('\n❌ ERREUR GLOBALE:', error);
  }
}

analyzeDatabase();


