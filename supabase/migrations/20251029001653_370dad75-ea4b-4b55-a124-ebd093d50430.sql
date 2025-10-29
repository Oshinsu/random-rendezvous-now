-- Insert 5 SOTA Marketing Automation Rules with correct trigger_type values
INSERT INTO crm_automation_rules (
  rule_name,
  trigger_type,
  trigger_condition,
  campaign_id,
  delay_minutes,
  is_active,
  priority
) VALUES 
(
  'Golden 48h - Activation Critique',
  'inactivity',
  '{
    "hours_since_signup": 48,
    "never_created_group": true,
    "no_login_since_signup": true,
    "exclude_segments": ["active_users", "power_users"],
    "action": "send_lifecycle_campaign",
    "channels": ["email", "in_app"],
    "template": "activation_urgency",
    "personalization": {
      "include_peak_hours": true,
      "show_active_users_nearby": true,
      "urgency_level": "high"
    }
  }'::jsonb,
  NULL,
  0,
  true,
  10
),
(
  'Win-Back Intelligent J7',
  'inactivity',
  '{
    "days_inactive": 7,
    "had_previous_login": true,
    "segments": ["engaged_but_inactive", "off_peak_users"],
    "exclude_if_support_ticket": true,
    "action": "send_lifecycle_campaign",
    "channels": ["email"],
    "template": "win_back_dynamic",
    "ab_test": {
      "variant_a": "empathy_approach",
      "variant_b": "value_reminder"
    }
  }'::jsonb,
  NULL,
  0,
  true,
  8
),
(
  'First Success Celebration',
  'lifecycle_change',
  '{
    "lifecycle_event": "first_outing_completed",
    "within_hours": 24,
    "first_successful_group": true,
    "action": "send_lifecycle_campaign",
    "channels": ["email", "in_app"],
    "template": "milestone_celebration",
    "personalization": {
      "include_social_proof": true,
      "show_next_action_cta": true,
      "celebration_intensity": "high"
    }
  }'::jsonb,
  NULL,
  60,
  true,
  9
),
(
  'Peak Hours Smart Nudge',
  'inactivity',
  '{
    "trigger_schedule": {
      "days": ["thursday", "friday", "saturday"],
      "time_range": ["18:00", "20:30"]
    },
    "target_segments": ["dormant_users", "off_peak_users"],
    "weather_condition": "favorable",
    "action": "send_lifecycle_campaign",
    "channels": ["in_app", "push"],
    "template": "smart_nudge_realtime",
    "real_time_data": {
      "active_users_nearby": true,
      "popular_bars_now": true,
      "estimated_wait_time": true
    },
    "urgency_factor": "high"
  }'::jsonb,
  NULL,
  0,
  true,
  7
),
(
  'Churn Prevention - Last Chance',
  'health_threshold',
  '{
    "health_score_below": 30,
    "days_inactive": 14,
    "never_created_group": true,
    "login_count_less_than": 3,
    "segment": "at_risk_churn",
    "action": "send_lifecycle_campaign",
    "channels": ["email"],
    "template": "churn_prevention_sequence",
    "multi_touch": {
      "step_1": "empathy_survey",
      "step_2": "value_reminder",
      "step_3": "final_offer",
      "step_3_extra": "guided_experience"
    }
  }'::jsonb,
  NULL,
  0,
  true,
  10
);

-- Create index for faster rule execution
CREATE INDEX IF NOT EXISTS idx_automation_rules_active ON crm_automation_rules(is_active, priority DESC) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_automation_rules_trigger_type ON crm_automation_rules(trigger_type, is_active);