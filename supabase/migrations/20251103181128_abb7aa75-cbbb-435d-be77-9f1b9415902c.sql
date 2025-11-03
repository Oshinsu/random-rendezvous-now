-- Trigger to auto-calculate SEO scores when text content is updated
CREATE OR REPLACE FUNCTION public.trigger_seo_calculation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only calculate for text/html content types
  IF NEW.content_type IN ('text', 'html') AND (TG_OP = 'INSERT' OR OLD.content_value IS DISTINCT FROM NEW.content_value) THEN
    -- Call the edge function asynchronously using pg_net
    PERFORM net.http_post(
      url := 'https://xhrievvdnajvylyrowwu.supabase.co/functions/v1/calculate-cms-seo',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocmlldnZkbmFqdnlseXJvd3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4OTQ1MzUsImV4cCI6MjA2NTQ3MDUzNX0.RfwNUnsTFAzfRqxiqCOtunXBTMJj90MKWOm1iwzVBAs'
      ),
      body := jsonb_build_object('content_id', NEW.id)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Attach trigger to site_content table
DROP TRIGGER IF EXISTS auto_calculate_seo ON public.site_content;
CREATE TRIGGER auto_calculate_seo
  AFTER INSERT OR UPDATE ON public.site_content
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_seo_calculation();