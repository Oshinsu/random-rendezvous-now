-- Create materialized view for cohort analysis
CREATE MATERIALIZED VIEW IF NOT EXISTS crm_cohort_analysis AS
SELECT 
  DATE_TRUNC('month', au.created_at) as cohort_month,
  COUNT(DISTINCT au.id) as total_signups,
  COUNT(DISTINCT CASE WHEN uoh.id IS NOT NULL THEN au.id END) as activated_users,
  COUNT(DISTINCT CASE WHEN uoh.id IS NOT NULL AND uoh.created_at <= au.created_at + INTERVAL '7 days' THEN au.id END) as first_outing_users,
  COUNT(DISTINCT CASE WHEN user_stats.total_outings >= 3 THEN au.id END) as regular_users,
  COALESCE(AVG(user_stats.total_outings * 10), 0) as avg_ltv,
  CASE 
    WHEN COUNT(DISTINCT au.id) > 0 
    THEN ROUND((COUNT(DISTINCT CASE WHEN user_stats.total_outings >= 2 THEN au.id END)::numeric / COUNT(DISTINCT au.id)::numeric) * 100, 1)
    ELSE 0 
  END as retention_rate
FROM auth.users au
LEFT JOIN user_outings_history uoh ON au.id = uoh.user_id
LEFT JOIN (
  SELECT user_id, COUNT(*) as total_outings
  FROM user_outings_history
  GROUP BY user_id
) user_stats ON au.id = user_stats.user_id
WHERE au.created_at >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', au.created_at)
ORDER BY cohort_month DESC;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_crm_cohort_month ON crm_cohort_analysis(cohort_month);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_crm_cohort_analysis()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW crm_cohort_analysis;
END;
$$;

-- Schedule daily refresh at 2 AM UTC (via cron if enabled)
-- This comment serves as documentation for manual setup if needed