-- Create crawler_proxies table if not exists
CREATE TABLE IF NOT EXISTS public.crawler_proxies (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    host text NOT NULL,
    port integer NOT NULL,
    username text,
    password text,
    protocol text DEFAULT 'http'::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    assigned_account_id uuid REFERENCES public.crawler_accounts(id) ON DELETE SET NULL,
    last_used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT check_proxy_protocol CHECK (protocol = ANY (ARRAY['http'::text, 'https'::text, 'socks5'::text])),
    CONSTRAINT check_proxy_status CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'dead'::text]))
);

ALTER TABLE public.crawler_proxies OWNER TO postgres;

-- Create audit_logs table if not exists
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    actor_id text NOT NULL,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id text,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    ip_address text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.audit_logs OWNER TO postgres;
