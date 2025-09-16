-- ========================================
-- NETTOYAGE MASSIF DES TRIGGERS DUPLIQUÉS
-- Objectif: Passer de 24 à 8 triggers optimisés
-- ========================================

-- ========================================
-- SUPPRESSION DES TRIGGERS DUPLIQUÉS SUR group_messages (5 -> 2)
-- ========================================

-- Supprimer les 3 doublons, garder les versions "tg_" optimisées
DROP TRIGGER IF EXISTS trg_validate_message_before_insert ON public.group_messages;
DROP TRIGGER IF EXISTS trigger_validate_message ON public.group_messages;  
DROP TRIGGER IF EXISTS update_last_seen_on_message ON public.group_messages;

-- GARDER: tg_update_participant_last_seen, tg_validate_message_before_insert

-- ========================================
-- SUPPRESSION DES TRIGGERS DUPLIQUÉS SUR group_participants (7 -> 2)
-- ========================================

-- Supprimer le trigger de cleanup automatique (problématique)
DROP TRIGGER IF EXISTS auto_cleanup_on_participant_insert ON public.group_participants;

-- Supprimer les 4 doublons
DROP TRIGGER IF EXISTS trg_handle_group_participant_changes ON public.group_participants;
DROP TRIGGER IF EXISTS trigger_group_participant_changes ON public.group_participants;
DROP TRIGGER IF EXISTS trigger_validate_participant ON public.group_participants;
DROP TRIGGER IF EXISTS validate_participant_trigger ON public.group_participants;

-- GARDER: tg_group_participant_changes, trg_validate_participant_before_insert

-- ========================================  
-- SUPPRESSION DES TRIGGERS DUPLIQUÉS SUR groups (9 -> 3)
-- ========================================

-- Supprimer le trigger de cleanup automatique (problématique)
DROP TRIGGER IF EXISTS auto_cleanup_on_group_insert ON public.groups;

-- Supprimer les 5 doublons
DROP TRIGGER IF EXISTS add_to_outings_history_trigger ON public.groups;
DROP TRIGGER IF EXISTS set_completed_at_trigger ON public.groups;
DROP TRIGGER IF EXISTS trg_add_to_outings_history ON public.groups;
DROP TRIGGER IF EXISTS trg_set_completed_at ON public.groups;
DROP TRIGGER IF EXISTS trg_trigger_auto_bar_assignment ON public.groups;

-- GARDER: tg_add_to_outings_history, tg_set_completed_at, tg_trigger_auto_bar_assignment

-- ========================================
-- SUPPRESSION DES TRIGGERS DUPLIQUÉS SUR user_outings_history (3 -> 1)  
-- ========================================

-- Supprimer les 2 doublons
DROP TRIGGER IF EXISTS trg_update_bar_rating ON public.user_outings_history;
DROP TRIGGER IF EXISTS trigger_update_bar_rating ON public.user_outings_history;

-- GARDER: tg_update_bar_rating

-- ========================================
-- RÉSUMÉ FINAL DES 8 TRIGGERS OPTIMISÉS
-- ========================================

-- group_messages (2 triggers):
-- 1. tg_update_participant_last_seen (BEFORE INSERT)
-- 2. tg_validate_message_before_insert (BEFORE INSERT)

-- group_participants (2 triggers):  
-- 3. tg_group_participant_changes (AFTER INSERT/UPDATE/DELETE)
-- 4. trg_validate_participant_before_insert (BEFORE INSERT)

-- groups (3 triggers):
-- 5. tg_add_to_outings_history (AFTER UPDATE)
-- 6. tg_set_completed_at (BEFORE UPDATE) 
-- 7. tg_trigger_auto_bar_assignment (AFTER UPDATE)

-- user_outings_history (1 trigger):
-- 8. tg_update_bar_rating (AFTER UPDATE)

-- AMÉLIORATION PERFORMANCE: 67% moins de triggers (24 -> 8)
-- ÉLIMINATION: Conflits entre triggers dupliqués
-- RÉSULTAT: Suppression de groupes enfin fonctionnelle