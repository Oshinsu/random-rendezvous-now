-- ✅ PHASE 4: Automatic Audit Logs via Database Triggers (Fixed)

-- Create the audit logging function if not exists
CREATE OR REPLACE FUNCTION log_admin_audit()
RETURNS TRIGGER AS $$
DECLARE
  admin_id UUID;
BEGIN
  -- Get the current user ID (admin who made the change)
  admin_id := auth.uid();
  
  -- Only log if we have a valid admin user
  IF admin_id IS NOT NULL THEN
    INSERT INTO admin_audit_logs (
      admin_user_id,
      action_type,
      table_name,
      record_id,
      old_values,
      new_values,
      metadata,
      created_at
    ) VALUES (
      admin_id,
      TG_OP::text, -- INSERT, UPDATE, or DELETE (cast to text)
      TG_TABLE_NAME::text,
      COALESCE(NEW.id, OLD.id),
      CASE 
        WHEN TG_OP::text = 'DELETE' THEN to_jsonb(OLD)
        WHEN TG_OP::text = 'UPDATE' THEN to_jsonb(OLD)
        ELSE NULL 
      END,
      CASE 
        WHEN TG_OP::text = 'DELETE' THEN NULL
        ELSE to_jsonb(NEW)
      END,
      jsonb_build_object(
        'timestamp', NOW(),
        'operation', TG_OP::text,
        'table', TG_TABLE_NAME::text
      ),
      NOW()
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for bar_owners table (sensitive business data)
DROP TRIGGER IF EXISTS audit_bar_owners_changes ON bar_owners;
CREATE TRIGGER audit_bar_owners_changes
AFTER INSERT OR UPDATE OR DELETE ON bar_owners
FOR EACH ROW
EXECUTE FUNCTION log_admin_audit();

-- Create trigger for group_messages (for message moderation/deletion)
DROP TRIGGER IF EXISTS audit_group_messages_moderation ON group_messages;
CREATE TRIGGER audit_group_messages_moderation
AFTER DELETE ON group_messages
FOR EACH ROW
EXECUTE FUNCTION log_admin_audit();

-- Add comment for documentation
COMMENT ON FUNCTION log_admin_audit() IS 'Automatically logs all admin actions on sensitive tables (bar_owners, group_messages) for compliance and security auditing. Triggered on INSERT, UPDATE, and DELETE operations.';