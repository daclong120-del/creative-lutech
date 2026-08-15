-- Migration: Unified Content Contract (Content-Aware Schema Upgrade)
-- Upgrade crawled_posts to support content-first platforms like Zhihu

ALTER TABLE public.crawled_posts
ADD COLUMN IF NOT EXISTS title text,
ADD COLUMN IF NOT EXISTS content_type text DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS source_url text;

ALTER TABLE public.crawled_posts
DROP CONSTRAINT IF EXISTS crawled_posts_media_type_check;

ALTER TABLE public.crawled_posts
ADD CONSTRAINT crawled_posts_media_type_check
CHECK (media_type IN ('video', 'image', 'carousel', 'text', 'unknown'));

ALTER TABLE public.crawled_posts
DROP CONSTRAINT IF EXISTS crawled_posts_media_status_check;

ALTER TABLE public.crawled_posts
ADD CONSTRAINT crawled_posts_media_status_check
CHECK (media_status IN ('original_only', 'cached', 'failed', 'expired', 'unavailable', 'not_applicable'));

CREATE INDEX IF NOT EXISTS crawled_posts_content_type_idx
ON public.crawled_posts (content_type);

CREATE INDEX IF NOT EXISTS crawled_posts_source_url_idx
ON public.crawled_posts (source_url);

-- Backfill for existing Zhihu text-only and media posts
UPDATE public.crawled_posts
SET
  media_type = CASE 
    WHEN (media_urls IS NULL OR array_length(media_urls, 1) IS NULL) AND cover_url IS NULL THEN 'text'::text
    ELSE media_type 
  END,
  media_status = CASE 
    WHEN (media_urls IS NULL OR array_length(media_urls, 1) IS NULL) AND cover_url IS NULL THEN 'not_applicable'::text
    ELSE media_status 
  END,
  media_source = CASE 
    WHEN (media_urls IS NULL OR array_length(media_urls, 1) IS NULL) AND cover_url IS NULL THEN 'none'::text
    ELSE media_source 
  END,
  content_type = COALESCE(raw->>'type', 'unknown'),
  title = COALESCE(
    raw->'question'->>'title',
    raw->>'title',
    split_part(caption, E'\n', 1)
  ),
  source_url = CASE 
    WHEN COALESCE(raw->>'type', 'unknown') = 'answer' THEN 'https://www.zhihu.com/question/' || COALESCE(raw->'question'->>'id', '') || '/answer/' || platform_id
    WHEN COALESCE(raw->>'type', 'unknown') = 'article' THEN 'https://zhuanlan.zhihu.com/p/' || platform_id
    WHEN COALESCE(raw->>'type', 'unknown') = 'zvideo' THEN 'https://www.zhihu.com/zvideo/' || platform_id
    ELSE 'https://www.zhihu.com'
  END
WHERE platform = 'zhihu';

-- Backfill Bilibili
UPDATE public.crawled_posts
SET
  content_type = 'video',
  source_url = 'https://www.bilibili.com/video/' || platform_id,
  title = COALESCE(title, split_part(caption, E'\n', 1))
WHERE platform = 'bilibili';

-- Backfill Douyin
UPDATE public.crawled_posts
SET
  content_type = 'video',
  source_url = 'https://www.douyin.com/video/' || platform_id,
  title = COALESCE(title, split_part(caption, E'\n', 1))
WHERE platform = 'douyin';

-- Backfill Kuaishou
UPDATE public.crawled_posts
SET
  content_type = 'video',
  source_url = 'https://www.kuaishou.com/short-video/' || platform_id,
  title = COALESCE(title, split_part(caption, E'\n', 1))
WHERE platform = 'kuaishou';

-- Backfill XHS (Xiaohongshu)
UPDATE public.crawled_posts
SET
  content_type = 'note',
  source_url = 'https://www.xiaohongshu.com/explore/' || platform_id,
  title = COALESCE(title, split_part(caption, E'\n', 1))
WHERE platform = 'xhs';
