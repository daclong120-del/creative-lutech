-- Create system_settings table if not exists
CREATE TABLE IF NOT EXISTS public.system_settings (
    id text NOT NULL PRIMARY KEY DEFAULT 'default',
    use_2captcha boolean DEFAULT true NOT NULL,
    api_key text, -- encrypted 2Captcha API Key
    collect_comments boolean DEFAULT true NOT NULL,
    collect_replies boolean DEFAULT true NOT NULL,
    headless_mode boolean DEFAULT true NOT NULL,
    default_priority text DEFAULT 'normal' NOT NULL,
    max_concurrent_tasks integer DEFAULT 3 NOT NULL,
    max_retries integer DEFAULT 2 NOT NULL,
    default_webhook_url text, -- encrypted Webhook URL
    notify_on_success boolean DEFAULT true NOT NULL,
    alert_on_failure boolean DEFAULT true NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT check_single_row CHECK (id = 'default')
);

ALTER TABLE public.system_settings OWNER TO postgres;

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Drop policies if exist for idempotency
DROP POLICY IF EXISTS "Allow read of system settings for admin users" ON public.system_settings;
DROP POLICY IF EXISTS "Allow write of system settings for admin users" ON public.system_settings;

-- Create policy for Admin only
CREATE POLICY "Allow read of system settings for admin users" ON public.system_settings
    FOR SELECT
    TO authenticated
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Allow write of system settings for admin users" ON public.system_settings
    FOR ALL
    TO authenticated
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

-- Revoke default privileges and grant to specific roles
REVOKE ALL ON public.system_settings FROM anon, public;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_settings TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.system_settings TO authenticated;

-- Seed default settings row if not exists
INSERT INTO public.system_settings (id) VALUES ('default') ON CONFLICT DO NOTHING;
