
-- ============================================
-- FONCTION SQL DE TEST AUTO-ASSIGNMENT
-- Test isolé avec rollback automatique
-- ============================================

CREATE OR REPLACE FUNCTION public.test_trigger_auto_bar_assignment()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    test_group_id uuid;
    trigger_message_count integer;
    result jsonb;
    test_user_id uuid := '00000000-0000-0000-0000-000000000001';
BEGIN
    -- Transaction isolée avec rollback
    BEGIN
        -- Créer groupe test
        INSERT INTO groups (
            status, 
            current_participants, 
            max_participants,
            latitude, 
            longitude, 
            location_name,
            created_by_user_id
        )
        VALUES (
            'waiting', 
            5,
            5,
            48.8566, 
            2.3522, 
            'Test Paris Location',
            test_user_id
        )
        RETURNING id INTO test_group_id;
        
        RAISE NOTICE 'Test group created: %', test_group_id;
        
        -- Ajouter 5 participants confirmés
        INSERT INTO group_participants (group_id, user_id, status)
        SELECT test_group_id, test_user_id, 'confirmed'
        FROM generate_series(1, 5);
        
        RAISE NOTICE 'Added 5 participants';
        
        -- Simuler passage en confirmed (DOIT DÉCLENCHER LE TRIGGER)
        UPDATE groups 
        SET status = 'confirmed' 
        WHERE id = test_group_id;
        
        RAISE NOTICE 'Group status updated to confirmed';
        
        -- Attendre un peu pour le trigger asynchrone
        PERFORM pg_sleep(0.5);
        
        -- Vérifier création du trigger message
        SELECT COUNT(*) INTO trigger_message_count
        FROM group_messages
        WHERE group_id = test_group_id
        AND message = 'AUTO_BAR_ASSIGNMENT_TRIGGER'
        AND is_system = true;
        
        RAISE NOTICE 'Trigger messages found: %', trigger_message_count;
        
        -- Forcer rollback pour cleanup
        RAISE EXCEPTION 'TEST_ROLLBACK';
        
    EXCEPTION 
        WHEN OTHERS THEN
            -- Construire le résultat même en cas d'erreur
            result := jsonb_build_object(
                'success', trigger_message_count > 0,
                'test_group_id', test_group_id,
                'trigger_messages_created', COALESCE(trigger_message_count, 0),
                'status', CASE 
                    WHEN trigger_message_count > 0 
                    THEN 'PASSED'
                    ELSE 'FAILED'
                END,
                'message', CASE 
                    WHEN trigger_message_count > 0 
                    THEN '✅ Trigger PostgreSQL fonctionne correctement'
                    ELSE '❌ ERREUR: Trigger ne se déclenche pas'
                END,
                'test_timestamp', NOW()
            );
    END;
    
    RETURN result;
END;
$$;

-- Donner les permissions
GRANT EXECUTE ON FUNCTION public.test_trigger_auto_bar_assignment() TO authenticated;
GRANT EXECUTE ON FUNCTION public.test_trigger_auto_bar_assignment() TO service_role;
