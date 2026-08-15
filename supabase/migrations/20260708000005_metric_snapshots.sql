-- Create post_metric_snapshots table if not exists
CREATE TABLE IF NOT EXISTS public.post_metric_snapshots (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    post_id text NOT NULL REFERENCES public.crawled_posts(id) ON DELETE CASCADE,
    platform text NOT NULL,
    platform_post_id text NOT NULL,
    observed_at timestamp with time zone DEFAULT now() NOT NULL,
    view_count bigint DEFAULT 0 NOT NULL,
    like_count bigint DEFAULT 0 NOT NULL,
    comment_count bigint DEFAULT 0 NOT NULL,
    share_count bigint DEFAULT 0 NOT NULL,
    raw jsonb,
    source text
);

ALTER TABLE public.post_metric_snapshots OWNER TO postgres;

-- Create author_metric_snapshots table if not exists
CREATE TABLE IF NOT EXISTS public.author_metric_snapshots (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    author_id text NOT NULL REFERENCES public.crawled_authors(id) ON DELETE CASCADE,
    platform text NOT NULL,
    platform_author_id text NOT NULL,
    observed_at timestamp with time zone DEFAULT now() NOT NULL,
    fans_count bigint DEFAULT 0 NOT NULL,
    follows_count bigint DEFAULT 0 NOT NULL,
    interaction_count bigint DEFAULT 0 NOT NULL,
    videos_count bigint DEFAULT 0 NOT NULL,
    raw jsonb,
    source text
);

ALTER TABLE public.author_metric_snapshots OWNER TO postgres;

-- Create indexes for performance timeseries aggregation
CREATE INDEX IF NOT EXISTS post_metric_snapshots_post_id_observed_at_idx ON public.post_metric_snapshots(post_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS author_metric_snapshots_author_id_observed_at_idx ON public.author_metric_snapshots(author_id, observed_at DESC);

-- Enable RLS & Policies
ALTER TABLE public.post_metric_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.author_metric_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access for authenticated users on post_metric_snapshots"
ON public.post_metric_snapshots FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read access for authenticated users on author_metric_snapshots"
ON public.author_metric_snapshots FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert access for authenticated users on post_metric_snapshots"
ON public.post_metric_snapshots FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow insert access for authenticated users on author_metric_snapshots"
ON public.author_metric_snapshots FOR INSERT TO authenticated WITH CHECK (true);

-- Enable realtime for snapshots
alter publication supabase_realtime add table public.post_metric_snapshots;
alter publication supabase_realtime add table public.author_metric_snapshots;
