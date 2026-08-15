-- 1. Revoke default privileges in schema public from anon, authenticated and public
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated, public;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;

-- 2. Revoke existing privileges from anon, authenticated and public on all current public schema objects
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated, public;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;

-- 3. Ensure anon and authenticated can usage schema public (critical for REST API initialization)
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 4. Enable RLS on crawler output tables
ALTER TABLE public.crawled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crawled_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creative_advertisers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creative_ads ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies to prevent duplication
DROP POLICY IF EXISTS "Allow read for authenticated users on crawled_posts" ON public.crawled_posts;
DROP POLICY IF EXISTS "Allow read for authenticated users on crawled_authors" ON public.crawled_authors;
DROP POLICY IF EXISTS "Allow read for authenticated users on creative_advertisers" ON public.creative_advertisers;
DROP POLICY IF EXISTS "Allow read for authenticated users on creative_ads" ON public.creative_ads;

-- 6. Create SELECT policies for authenticated users on crawler output tables
CREATE POLICY "Allow read for authenticated users on crawled_posts" ON public.crawled_posts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read for authenticated users on crawled_authors" ON public.crawled_authors
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read for authenticated users on creative_advertisers" ON public.creative_advertisers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read for authenticated users on creative_ads" ON public.creative_ads
  FOR SELECT TO authenticated USING (true);

-- 7. Grant explicit execute rights back to authenticated and service_role for required functions
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_crawler_tasks(jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.claim_next_crawler_task() TO service_role;

-- 8. Grant selective read/write permissions back to authenticated
-- Standard read-only access for data tables
GRANT SELECT ON public.crawled_posts TO authenticated;
GRANT SELECT ON public.crawled_authors TO authenticated;
GRANT SELECT ON public.crawled_comments TO authenticated;
GRANT SELECT ON public.creative_advertisers TO authenticated;
GRANT SELECT ON public.creative_ads TO authenticated;

-- Metric snapshots & exports SELECT and INSERT access
GRANT SELECT, INSERT ON public.post_metric_snapshots TO authenticated;
GRANT SELECT, INSERT ON public.author_metric_snapshots TO authenticated;
GRANT SELECT, INSERT ON public.exported_files TO authenticated;

-- System config and members read-only or read-write access
GRANT SELECT ON public.workspaces TO authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_role_permissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_invitations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_tokens TO authenticated;

-- Operational tables (tasks, accounts, proxies, logs, audit logs)
-- Access is restricted by RLS policies using public.is_admin(auth.uid()) where applicable
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crawler_tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crawler_accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crawler_proxies TO authenticated;
GRANT SELECT ON public.crawler_logs TO authenticated;
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;

-- Grant USAGE and SELECT on sequences to authenticated
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
