-- Fix crawled_authors table: add missing columns and unique constraint for upsert
ALTER TABLE public.crawled_authors 
ADD COLUMN IF NOT EXISTS raw jsonb,
ADD COLUMN IF NOT EXISTS videos_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS interaction_count integer DEFAULT 0;

ALTER TABLE public.crawled_authors
DROP CONSTRAINT IF EXISTS crawled_authors_platform_platform_uid_key,
ADD CONSTRAINT crawled_authors_platform_platform_uid_key UNIQUE (platform, platform_uid);

-- Fix crawled_posts table: add unique constraint for upsert
ALTER TABLE public.crawled_posts
DROP CONSTRAINT IF EXISTS crawled_posts_platform_platform_id_key,
ADD CONSTRAINT crawled_posts_platform_platform_id_key UNIQUE (platform, platform_id);

-- Create crawled_comments table if not exists
CREATE TABLE IF NOT EXISTS public.crawled_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    platform text NOT NULL,
    platform_cid text NOT NULL,
    post_id text,
    platform_post_id text NOT NULL,
    parent_cid text,
    author_uid text,
    author_nickname text,
    content text,
    like_count integer DEFAULT 0,
    raw jsonb,
    published_at timestamp with time zone,
    crawled_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT crawled_comments_platform_platform_cid_key UNIQUE (platform, platform_cid)
);
