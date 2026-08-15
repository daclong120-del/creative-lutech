-- Create creative_advertisers table if not exists
CREATE TABLE IF NOT EXISTS public.creative_advertisers (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    platform_uid text NOT NULL,
    nickname text NOT NULL,
    platform text NOT NULL,
    avatar_url text,
    description text,
    creative_count integer DEFAULT 0 NOT NULL,
    total_views bigint DEFAULT 0 NOT NULL,
    total_likes bigint DEFAULT 0 NOT NULL,
    follows_count integer DEFAULT 0 NOT NULL,
    fans_count integer DEFAULT 0 NOT NULL,
    crawled_at timestamp with time zone DEFAULT now() NOT NULL,
    last_active_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT creative_advertisers_platform_platform_uid_key UNIQUE (platform, platform_uid)
);

ALTER TABLE public.creative_advertisers OWNER TO postgres;

-- Create creative_ads table if not exists
CREATE TABLE IF NOT EXISTS public.creative_ads (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    platform text NOT NULL,
    author_id uuid REFERENCES public.creative_advertisers(id) ON DELETE SET NULL,
    platform_uid text NOT NULL,
    title text,
    caption text,
    cover_url text,
    media_type text DEFAULT 'video'::text NOT NULL,
    like_count integer DEFAULT 0 NOT NULL,
    view_count integer DEFAULT 0 NOT NULL,
    comment_count integer DEFAULT 0 NOT NULL,
    share_count integer DEFAULT 0 NOT NULL,
    media_urls text[],
    tags text[],
    published_at timestamp with time zone NOT NULL,
    crawled_at timestamp with time zone DEFAULT now() NOT NULL,
    is_ad boolean DEFAULT true NOT NULL,
    growth_rate double precision DEFAULT 0 NOT NULL,
    views_history jsonb DEFAULT '[]'::jsonb NOT NULL,
    CONSTRAINT check_media_type CHECK (media_type = ANY (ARRAY['video'::text, 'image'::text, 'carousel'::text]))
);

ALTER TABLE public.creative_ads OWNER TO postgres;
