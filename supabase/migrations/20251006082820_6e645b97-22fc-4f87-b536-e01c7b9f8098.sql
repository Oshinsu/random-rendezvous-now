-- ============================================
-- RANDOM B2C CRM - COMPLETE DATA STRUCTURE
-- ============================================

-- 1. USER SEGMENTS TABLE
CREATE TABLE IF NOT EXISTS public.crm_user_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    segment_key TEXT UNIQUE NOT NULL,
    segment_name TEXT NOT NULL,
    description TEXT,
    criteria JSONB NOT NULL DEFAULT '{}',
    color TEXT DEFAULT '#6366f1',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. USER SEGMENT MEMBERSHIPS
CREATE TABLE IF NOT EXISTS public.crm_user_segment_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    segment_id UUID NOT NULL REFERENCES public.crm_user_segments(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, segment_id)
);

-- 3. USER HEALTH SCORES
CREATE TABLE IF NOT EXISTS public.crm_user_health (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL,
    health_score INTEGER NOT NULL DEFAULT 50 CHECK (health_score >= 0 AND health_score <= 100),
    churn_risk TEXT NOT NULL DEFAULT 'medium' CHECK (churn_risk IN ('low', 'medium', 'high', 'critical')),
    last_activity_at TIMESTAMPTZ,
    total_groups INTEGER NOT NULL DEFAULT 0,
    total_outings INTEGER NOT NULL DEFAULT 0,
    days_since_signup INTEGER NOT NULL DEFAULT 0,
    days_since_last_activity INTEGER,
    avg_days_between_outings NUMERIC,
    metadata JSONB DEFAULT '{}',
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. LIFECYCLE STAGES
CREATE TABLE IF NOT EXISTS public.crm_lifecycle_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stage_key TEXT UNIQUE NOT NULL,
    stage_name TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    trigger_conditions JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. USER LIFECYCLE TRACKING
CREATE TABLE IF NOT EXISTS public.crm_user_lifecycle (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    stage_id UUID NOT NULL REFERENCES public.crm_lifecycle_stages(id) ON DELETE CASCADE,
    entered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    exited_at TIMESTAMPTZ,
    is_current BOOLEAN NOT NULL DEFAULT true,
    UNIQUE(user_id, stage_id, entered_at)
);

-- 6. CAMPAIGNS
CREATE TABLE IF NOT EXISTS public.crm_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_name TEXT NOT NULL,
    campaign_type TEXT NOT NULL CHECK (campaign_type IN ('email', 'push', 'sms', 'in_app')),
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('manual', 'lifecycle', 'segment', 'behavior')),
    target_segment_id UUID REFERENCES public.crm_user_segments(id) ON DELETE SET NULL,
    target_lifecycle_stage_id UUID REFERENCES public.crm_lifecycle_stages(id) ON DELETE SET NULL,
    subject TEXT,
    content TEXT NOT NULL,
    template_data JSONB DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
    send_at TIMESTAMPTZ,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. CAMPAIGN SENDS (Tracking)
CREATE TABLE IF NOT EXISTS public.crm_campaign_sends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.crm_campaigns(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    converted_at TIMESTAMPTZ,
    bounced BOOLEAN DEFAULT false,
    unsubscribed BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    UNIQUE(campaign_id, user_id)
);

-- 8. USER FEEDBACK & NPS
CREATE TABLE IF NOT EXISTS public.crm_user_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('nps', 'survey', 'review', 'complaint')),
    rating INTEGER CHECK (rating >= 0 AND rating <= 10),
    feedback_text TEXT,
    context JSONB DEFAULT '{}',
    group_id UUID,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. REFERRAL TRACKING
CREATE TABLE IF NOT EXISTS public.crm_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_user_id UUID NOT NULL,
    referred_user_id UUID,
    referral_code TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'converted', 'rewarded')),
    converted_at TIMESTAMPTZ,
    reward_amount INTEGER DEFAULT 0,
    reward_given_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_segment_memberships_user_id ON public.crm_user_segment_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_segment_memberships_segment_id ON public.crm_user_segment_memberships(segment_id);
CREATE INDEX IF NOT EXISTS idx_user_health_user_id ON public.crm_user_health(user_id);
CREATE INDEX IF NOT EXISTS idx_user_health_churn_risk ON public.crm_user_health(churn_risk);
CREATE INDEX IF NOT EXISTS idx_user_health_score ON public.crm_user_health(health_score);
CREATE INDEX IF NOT EXISTS idx_user_lifecycle_user_id ON public.crm_user_lifecycle(user_id);
CREATE INDEX IF NOT EXISTS idx_user_lifecycle_current ON public.crm_user_lifecycle(is_current);
CREATE INDEX IF NOT EXISTS idx_campaign_sends_user_id ON public.crm_campaign_sends(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_sends_campaign_id ON public.crm_campaign_sends(campaign_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.crm_user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.crm_referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON public.crm_referrals(referral_code);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE public.crm_user_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_user_segment_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_user_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_lifecycle_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_user_lifecycle ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_campaign_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_referrals ENABLE ROW LEVEL SECURITY;

-- Admins can manage everything
CREATE POLICY "Admins can manage segments" ON public.crm_user_segments FOR ALL USING (is_admin_user());
CREATE POLICY "Admins can manage memberships" ON public.crm_user_segment_memberships FOR ALL USING (is_admin_user());
CREATE POLICY "Admins can view health scores" ON public.crm_user_health FOR SELECT USING (is_admin_user());
CREATE POLICY "Admins can manage lifecycle stages" ON public.crm_lifecycle_stages FOR ALL USING (is_admin_user());
CREATE POLICY "Admins can view user lifecycle" ON public.crm_user_lifecycle FOR SELECT USING (is_admin_user());
CREATE POLICY "Admins can manage campaigns" ON public.crm_campaigns FOR ALL USING (is_admin_user());
CREATE POLICY "Admins can view campaign sends" ON public.crm_campaign_sends FOR SELECT USING (is_admin_user());
CREATE POLICY "Admins can manage feedback" ON public.crm_user_feedback FOR ALL USING (is_admin_user());
CREATE POLICY "Admins can view referrals" ON public.crm_referrals FOR SELECT USING (is_admin_user());

-- Users can view their own data
CREATE POLICY "Users can view own health score" ON public.crm_user_health FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can submit feedback" ON public.crm_user_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own feedback" ON public.crm_user_feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own referrals" ON public.crm_referrals FOR SELECT USING (auth.uid() = referrer_user_id);

-- System can manage everything
CREATE POLICY "System can manage segments" ON public.crm_user_segments FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);
CREATE POLICY "System can manage memberships" ON public.crm_user_segment_memberships FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);
CREATE POLICY "System can manage health" ON public.crm_user_health FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);
CREATE POLICY "System can manage lifecycle" ON public.crm_user_lifecycle FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);
CREATE POLICY "System can manage campaign sends" ON public.crm_campaign_sends FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);
CREATE POLICY "System can manage referrals" ON public.crm_referrals FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- ============================================
-- FUNCTIONS FOR AUTOMATION
-- ============================================

-- Function to calculate user health score
CREATE OR REPLACE FUNCTION public.calculate_user_health_score(target_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    days_since_signup INTEGER;
    days_since_last_activity INTEGER;
    total_groups INTEGER;
    total_outings INTEGER;
    avg_days_between NUMERIC;
    health_score INTEGER := 50;
BEGIN
    -- Get user creation date
    SELECT EXTRACT(DAY FROM NOW() - created_at)::INTEGER
    INTO days_since_signup
    FROM auth.users
    WHERE id = target_user_id;
    
    -- Get last activity
    SELECT EXTRACT(DAY FROM NOW() - MAX(last_seen))::INTEGER
    INTO days_since_last_activity
    FROM public.group_participants
    WHERE user_id = target_user_id;
    
    -- Get total groups and outings
    SELECT COUNT(DISTINCT group_id)
    INTO total_groups
    FROM public.group_participants
    WHERE user_id = target_user_id AND status = 'confirmed';
    
    SELECT COUNT(*)
    INTO total_outings
    FROM public.user_outings_history
    WHERE user_id = target_user_id;
    
    -- Calculate average days between outings
    SELECT AVG(diff_days)
    INTO avg_days_between
    FROM (
        SELECT EXTRACT(DAY FROM completed_at - LAG(completed_at) OVER (ORDER BY completed_at))::NUMERIC as diff_days
        FROM public.user_outings_history
        WHERE user_id = target_user_id
    ) t
    WHERE diff_days IS NOT NULL;
    
    -- Calculate health score (0-100)
    health_score := 50; -- Base score
    
    -- Bonus for activity
    IF total_outings > 0 THEN
        health_score := health_score + LEAST(total_outings * 5, 30);
    END IF;
    
    -- Penalty for inactivity
    IF days_since_last_activity > 30 THEN
        health_score := health_score - 40;
    ELSIF days_since_last_activity > 14 THEN
        health_score := health_score - 20;
    ELSIF days_since_last_activity > 7 THEN
        health_score := health_score - 10;
    END IF;
    
    -- Bonus for regular activity
    IF avg_days_between IS NOT NULL AND avg_days_between < 14 THEN
        health_score := health_score + 15;
    END IF;
    
    -- Clamp between 0-100
    health_score := GREATEST(0, LEAST(100, health_score));
    
    -- Update or insert health record
    INSERT INTO public.crm_user_health (
        user_id, health_score, churn_risk, last_activity_at,
        total_groups, total_outings, days_since_signup,
        days_since_last_activity, avg_days_between_outings,
        calculated_at, updated_at
    )
    VALUES (
        target_user_id,
        health_score,
        CASE
            WHEN health_score >= 70 THEN 'low'
            WHEN health_score >= 50 THEN 'medium'
            WHEN health_score >= 30 THEN 'high'
            ELSE 'critical'
        END,
        NOW() - (COALESCE(days_since_last_activity, 0) || ' days')::INTERVAL,
        total_groups,
        total_outings,
        days_since_signup,
        days_since_last_activity,
        avg_days_between,
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        health_score = EXCLUDED.health_score,
        churn_risk = EXCLUDED.churn_risk,
        last_activity_at = EXCLUDED.last_activity_at,
        total_groups = EXCLUDED.total_groups,
        total_outings = EXCLUDED.total_outings,
        days_since_signup = EXCLUDED.days_since_signup,
        days_since_last_activity = EXCLUDED.days_since_last_activity,
        avg_days_between_outings = EXCLUDED.avg_days_between_outings,
        calculated_at = NOW(),
        updated_at = NOW();
    
    RETURN health_score;
END;
$$;

-- Function to assign user to segments
CREATE OR REPLACE FUNCTION public.assign_user_segments(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_health RECORD;
    segment_rec RECORD;
BEGIN
    -- Get user health data
    SELECT * INTO user_health FROM public.crm_user_health WHERE user_id = target_user_id;
    
    IF user_health IS NULL THEN
        RETURN;
    END IF;
    
    -- Clear existing segment memberships
    DELETE FROM public.crm_user_segment_memberships WHERE user_id = target_user_id;
    
    -- Assign to appropriate segments based on behavior
    FOR segment_rec IN SELECT * FROM public.crm_user_segments LOOP
        -- Super Users: >5 outings, health >80
        IF segment_rec.segment_key = 'super_users' AND 
           user_health.total_outings >= 5 AND 
           user_health.health_score >= 80 THEN
            INSERT INTO public.crm_user_segment_memberships (user_id, segment_id)
            VALUES (target_user_id, segment_rec.id);
        END IF;
        
        -- Active: 2-4 outings, recent activity
        IF segment_rec.segment_key = 'active' AND 
           user_health.total_outings BETWEEN 2 AND 4 AND
           user_health.days_since_last_activity <= 14 THEN
            INSERT INTO public.crm_user_segment_memberships (user_id, segment_id)
            VALUES (target_user_id, segment_rec.id);
        END IF;
        
        -- Dormant: 1+ outing but inactive 14+ days
        IF segment_rec.segment_key = 'dormant' AND 
           user_health.total_outings >= 1 AND
           user_health.days_since_last_activity > 14 THEN
            INSERT INTO public.crm_user_segment_memberships (user_id, segment_id)
            VALUES (target_user_id, segment_rec.id);
        END IF;
        
        -- Churn Risk: health score < 30
        IF segment_rec.segment_key = 'churn_risk' AND 
           user_health.health_score < 30 THEN
            INSERT INTO public.crm_user_segment_memberships (user_id, segment_id)
            VALUES (target_user_id, segment_rec.id);
        END IF;
        
        -- New Users: <7 days, 0 outings
        IF segment_rec.segment_key = 'new_users' AND 
           user_health.days_since_signup <= 7 AND
           user_health.total_outings = 0 THEN
            INSERT INTO public.crm_user_segment_memberships (user_id, segment_id)
            VALUES (target_user_id, segment_rec.id);
        END IF;
    END LOOP;
END;
$$;

-- ============================================
-- INITIAL SEGMENTS SETUP
-- ============================================

INSERT INTO public.crm_user_segments (segment_key, segment_name, description, color) VALUES
('super_users', 'Super Users', 'Users avec 5+ sorties et haute activité', '#10b981'),
('active', 'Actifs', 'Users réguliers avec 2-4 sorties', '#3b82f6'),
('dormant', 'Dormants', 'Users inactifs depuis 14+ jours', '#f59e0b'),
('churn_risk', 'Risque de Churn', 'Users avec health score < 30', '#ef4444'),
('new_users', 'Nouveaux', 'Users inscrits depuis moins de 7 jours', '#8b5cf6'),
('one_timer', 'One-Timer', 'Users avec 1 seule sortie', '#6366f1')
ON CONFLICT (segment_key) DO NOTHING;

-- ============================================
-- LIFECYCLE STAGES SETUP
-- ============================================

INSERT INTO public.crm_lifecycle_stages (stage_key, stage_name, description, order_index) VALUES
('signup', 'Inscription', 'Vient de créer un compte', 1),
('activated', 'Activé', 'A rejoint son premier groupe', 2),
('first_outing', 'Première Sortie', 'A complété sa première sortie', 3),
('regular', 'Régulier', '3+ sorties en 30 jours', 4),
('at_risk', 'À Risque', 'Inactif depuis 14+ jours', 5),
('churned', 'Churned', 'Inactif depuis 60+ jours', 6)
ON CONFLICT (stage_key) DO NOTHING;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update health score when user completes outing
CREATE OR REPLACE FUNCTION public.trigger_update_health_on_outing()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    PERFORM public.calculate_user_health_score(NEW.user_id);
    PERFORM public.assign_user_segments(NEW.user_id);
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_health_on_outing
AFTER INSERT ON public.user_outings_history
FOR EACH ROW
EXECUTE FUNCTION public.trigger_update_health_on_outing();

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION public.update_crm_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_crm_user_health_updated_at
BEFORE UPDATE ON public.crm_user_health
FOR EACH ROW
EXECUTE FUNCTION public.update_crm_updated_at();

CREATE TRIGGER update_crm_campaigns_updated_at
BEFORE UPDATE ON public.crm_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_crm_updated_at();