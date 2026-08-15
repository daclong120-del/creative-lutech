-- RLS policies for crawler_accounts
ALTER TABLE public.crawler_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read of crawler accounts for authenticated users" ON public.crawler_accounts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow write of crawler accounts for admin users" ON public.crawler_accounts
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- RLS policies for crawler_proxies
ALTER TABLE public.crawler_proxies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read of crawler proxies for authenticated users" ON public.crawler_proxies
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow write of crawler proxies for admin users" ON public.crawler_proxies
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()));
