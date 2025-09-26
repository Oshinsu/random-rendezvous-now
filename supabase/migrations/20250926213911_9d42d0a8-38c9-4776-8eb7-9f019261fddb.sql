-- Create bar owners table for B2B backend
CREATE TABLE public.bar_owners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  bar_place_id TEXT, -- Link to Google Places bar
  bar_name TEXT NOT NULL,
  bar_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  verification_documents JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id)
);

-- Create bar subscriptions table
CREATE TABLE public.bar_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bar_owner_id UUID NOT NULL REFERENCES public.bar_owners(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'past_due', 'canceled', 'unpaid')),
  plan_type TEXT NOT NULL DEFAULT 'premium' CHECK (plan_type IN ('trial', 'premium')),
  monthly_price_eur INTEGER NOT NULL DEFAULT 15000, -- 150€ in cents
  trial_start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  trial_end_date TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '30 days'),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bar claims table (for claiming existing bars)
CREATE TABLE public.bar_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bar_owner_id UUID NOT NULL REFERENCES public.bar_owners(id) ON DELETE CASCADE,
  bar_place_id TEXT NOT NULL,
  bar_name TEXT NOT NULL,
  bar_address TEXT NOT NULL,
  claim_evidence JSONB DEFAULT '{}', -- Photos, documents, etc.
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id)
);

-- Create bar analytics reports table
CREATE TABLE public.bar_analytics_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bar_owner_id UUID NOT NULL REFERENCES public.bar_owners(id) ON DELETE CASCADE,
  report_month DATE NOT NULL, -- First day of the month
  total_groups INTEGER NOT NULL DEFAULT 0,
  total_customers INTEGER NOT NULL DEFAULT 0,
  estimated_revenue_eur INTEGER NOT NULL DEFAULT 0, -- In cents
  peak_hours JSONB DEFAULT '{}',
  weekly_breakdown JSONB DEFAULT '{}',
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.bar_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bar_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bar_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bar_analytics_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bar_owners
CREATE POLICY "Bar owners can view their own profile" 
ON public.bar_owners 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Bar owners can update their own profile" 
ON public.bar_owners 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can apply to be a bar owner" 
ON public.bar_owners 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all bar owners" 
ON public.bar_owners 
FOR ALL 
USING (is_admin_user())
WITH CHECK (is_admin_user());

-- RLS Policies for bar_subscriptions
CREATE POLICY "Bar owners can view their own subscription" 
ON public.bar_subscriptions 
FOR SELECT 
USING (bar_owner_id IN (SELECT id FROM public.bar_owners WHERE user_id = auth.uid()));

CREATE POLICY "System can manage subscriptions" 
ON public.bar_subscriptions 
FOR ALL 
USING ((auth.jwt() ->> 'role') = 'service_role')
WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

CREATE POLICY "Admins can view all subscriptions" 
ON public.bar_subscriptions 
FOR SELECT 
USING (is_admin_user());

-- RLS Policies for bar_claims
CREATE POLICY "Bar owners can view their own claims" 
ON public.bar_claims 
FOR SELECT 
USING (bar_owner_id IN (SELECT id FROM public.bar_owners WHERE user_id = auth.uid()));

CREATE POLICY "Bar owners can create claims" 
ON public.bar_claims 
FOR INSERT 
WITH CHECK (bar_owner_id IN (SELECT id FROM public.bar_owners WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all claims" 
ON public.bar_claims 
FOR ALL 
USING (is_admin_user())
WITH CHECK (is_admin_user());

-- RLS Policies for bar_analytics_reports
CREATE POLICY "Bar owners can view their own analytics" 
ON public.bar_analytics_reports 
FOR SELECT 
USING (bar_owner_id IN (SELECT id FROM public.bar_owners WHERE user_id = auth.uid()));

CREATE POLICY "System can manage analytics reports" 
ON public.bar_analytics_reports 
FOR ALL 
USING ((auth.jwt() ->> 'role') = 'service_role')
WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

CREATE POLICY "Admins can view all analytics" 
ON public.bar_analytics_reports 
FOR SELECT 
USING (is_admin_user());

-- Add indexes for performance
CREATE INDEX idx_bar_owners_user_id ON public.bar_owners(user_id);
CREATE INDEX idx_bar_owners_status ON public.bar_owners(status);
CREATE INDEX idx_bar_owners_bar_place_id ON public.bar_owners(bar_place_id);
CREATE INDEX idx_bar_subscriptions_bar_owner_id ON public.bar_subscriptions(bar_owner_id);
CREATE INDEX idx_bar_subscriptions_status ON public.bar_subscriptions(status);
CREATE INDEX idx_bar_claims_bar_owner_id ON public.bar_claims(bar_owner_id);
CREATE INDEX idx_bar_claims_status ON public.bar_claims(status);
CREATE INDEX idx_bar_analytics_reports_bar_owner_id ON public.bar_analytics_reports(bar_owner_id);
CREATE INDEX idx_bar_analytics_reports_report_month ON public.bar_analytics_reports(report_month);

-- Add triggers for updated_at
CREATE TRIGGER update_bar_owners_updated_at
BEFORE UPDATE ON public.bar_owners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bar_subscriptions_updated_at
BEFORE UPDATE ON public.bar_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to check if user is bar owner
CREATE OR REPLACE FUNCTION public.is_bar_owner()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.bar_owners
    WHERE user_id = auth.uid()
      AND status = 'approved'
  )
$$;

-- Create function to generate analytics for a bar
CREATE OR REPLACE FUNCTION public.generate_bar_analytics(target_bar_place_id TEXT, target_month DATE)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSON;
    total_groups_count INTEGER := 0;
    total_customers_count INTEGER := 0;
    estimated_revenue INTEGER := 0;
BEGIN
    -- Count groups that went to this bar in the target month
    SELECT 
        COUNT(*) as groups,
        SUM(participants_count) as customers
    INTO total_groups_count, total_customers_count
    FROM public.user_outings_history uoh
    JOIN public.groups g ON uoh.group_id = g.id
    WHERE g.bar_place_id = target_bar_place_id
        AND DATE_TRUNC('month', uoh.completed_at) = target_month;
    
    -- Estimate revenue (assuming 25€ average per person)
    estimated_revenue := COALESCE(total_customers_count, 0) * 2500; -- 25€ in cents
    
    SELECT json_build_object(
        'total_groups', COALESCE(total_groups_count, 0),
        'total_customers', COALESCE(total_customers_count, 0),
        'estimated_revenue_eur', estimated_revenue,
        'average_group_size', CASE 
            WHEN total_groups_count > 0 THEN ROUND(total_customers_count::decimal / total_groups_count, 1)
            ELSE 0 
        END
    ) INTO result;
    
    RETURN result;
END;
$$;