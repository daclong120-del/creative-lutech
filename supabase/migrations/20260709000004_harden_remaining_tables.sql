-- Enable RLS for remaining tables
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exported_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crawled_comments ENABLE ROW LEVEL SECURITY;

-- Harden team_members policy
DROP POLICY IF EXISTS "Allow read of team members for authenticated users" ON public.team_members;
CREATE POLICY "Allow read of team members for admin or self" ON public.team_members
    FOR SELECT
    TO authenticated
    USING (
        public.is_admin(auth.uid()) OR user_id = auth.uid()
    );


-- Policies for audit_logs
-- Only admin can read and insert (service role bypasses RLS anyway)
DROP POLICY IF EXISTS "Allow read of audit logs for admin users" ON public.audit_logs;
CREATE POLICY "Allow read of audit logs for admin users" ON public.audit_logs
    FOR SELECT
    TO authenticated
    USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Allow insert of audit logs for admin users" ON public.audit_logs;
CREATE POLICY "Allow insert of audit logs for admin users" ON public.audit_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin(auth.uid()));

-- Policies for exported_files
-- Admin can do everything, authenticated user can read their own exports.
DROP POLICY IF EXISTS "Allow read of exported files for authenticated users" ON public.exported_files;
CREATE POLICY "Allow read of exported files for authenticated users" ON public.exported_files
    FOR SELECT
    TO authenticated
    USING (public.is_admin(auth.uid()) OR created_by = auth.uid()::text);

DROP POLICY IF EXISTS "Allow write of exported files for admin users" ON public.exported_files;
CREATE POLICY "Allow write of exported files for admin users" ON public.exported_files
    FOR ALL
    TO authenticated
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

-- Policies for crawled_comments
-- Authenticated can read, admin can write
DROP POLICY IF EXISTS "Allow read of crawled comments for authenticated users" ON public.crawled_comments;
CREATE POLICY "Allow read of crawled comments for authenticated users" ON public.crawled_comments
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow write of crawled comments for admin users" ON public.crawled_comments;
CREATE POLICY "Allow write of crawled comments for admin users" ON public.crawled_comments
    FOR ALL
    TO authenticated
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));
