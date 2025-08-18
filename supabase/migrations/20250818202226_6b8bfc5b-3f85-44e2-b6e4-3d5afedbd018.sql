-- RÉPARATION SYSTÉMIQUE: Nettoyage des participants zombies et correction des compteurs

-- 1. Supprimer les participants inactifs depuis plus de 24 heures
DELETE FROM public.group_participants 
WHERE last_seen < NOW() - INTERVAL '24 hours'
AND status = 'confirmed';

-- 2. Supprimer les groupes vides en attente depuis plus de 30 minutes
DELETE FROM public.groups 
WHERE status = 'waiting'
AND current_participants = 0
AND created_at < NOW() - INTERVAL '30 minutes';

-- 3. Corriger les compteurs de participants pour tous les groupes actifs
UPDATE public.groups 
SET current_participants = (
    SELECT COUNT(*) 
    FROM public.group_participants 
    WHERE group_id = groups.id 
    AND status = 'confirmed'
)
WHERE status IN ('waiting', 'confirmed');

-- 4. Nettoyer les messages de déclenchement anciens
DELETE FROM public.group_messages 
WHERE is_system = true 
AND message = 'AUTO_BAR_ASSIGNMENT_TRIGGER'
AND created_at < NOW() - INTERVAL '5 minutes';

-- 5. Forcer le cleanup des groupes terminés très anciens (plus de 6 heures)
DELETE FROM public.groups 
WHERE status = 'completed'
AND completed_at < NOW() - INTERVAL '6 hours'
AND (is_scheduled = false OR is_scheduled IS NULL);