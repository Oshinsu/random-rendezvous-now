-- Nettoyage de la participation fantôme maintenant que les fonctions PPU sont corrigées

DELETE FROM public.group_participants 
WHERE id = 'c9cd306e-115d-407c-b55a-7361924797d2'
AND last_seen < NOW() - INTERVAL '24 hours';

UPDATE public.groups 
SET 
    current_participants = (
        SELECT COUNT(*) 
        FROM public.group_participants 
        WHERE group_id = 'a40ddfb4-4f18-4ab8-9e01-d43450eaaa5c' 
        AND status = 'confirmed'
    ),
    status = CASE 
        WHEN (SELECT COUNT(*) FROM public.group_participants 
              WHERE group_id = 'a40ddfb4-4f18-4ab8-9e01-d43450eaaa5c' 
              AND status = 'confirmed') = 0 
        THEN 'cancelled'
        ELSE status
    END
WHERE id = 'a40ddfb4-4f18-4ab8-9e01-d43450eaaa5c';

DO $$
BEGIN
    RAISE NOTICE '✅ Données nettoyées - vous pouvez maintenant créer un groupe';
END $$;