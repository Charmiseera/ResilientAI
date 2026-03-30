-- Copy and paste this script directly into your Supabase SQL Editor to create tables.
-- By default, Row Level Security is disabled so our app can read/write freely with the anonymous key.

-- 1. Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    business_type TEXT NOT NULL,
    city TEXT NOT NULL,
    phone TEXT UNIQUE,
    lang TEXT DEFAULT 'en',
    weekly_revenue_inr NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create decisions table
CREATE TABLE IF NOT EXISTS public.decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    event_id TEXT,
    business_type TEXT,
    action_taken TEXT,
    profit_impact_inr NUMERIC,
    engine TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create adopted_strategies table
CREATE TABLE IF NOT EXISTS public.adopted_strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    weekly_revenue NUMERIC,
    current_margin_pct NUMERIC,
    price_delta NUMERIC,
    extra_units INTEGER,
    projected_profit NUMERIC,
    snapshot_json JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create login_sessions table
CREATE TABLE IF NOT EXISTS public.login_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    login_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    logout_time TIMESTAMP WITH TIME ZONE
);

-- 5. Create agent_learnings table
CREATE TABLE IF NOT EXISTS public.agent_learnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    behavior_type TEXT,
    pattern_data JSONB,
    confidence_score NUMERIC,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: No RLS policies are added to keep the MVP open. For production, you will enable RLS here.
