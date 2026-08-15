ALTER TABLE public.crawled_posts
ADD COLUMN IF NOT EXISTS media_type text DEFAULT 'image',
ADD COLUMN IF NOT EXISTS original_media_urls text[],
ADD COLUMN IF NOT EXISTS original_cover_url text,
ADD COLUMN IF NOT EXISTS media_status text DEFAULT 'original_only',
ADD COLUMN IF NOT EXISTS media_source text DEFAULT 'original',
ADD COLUMN IF NOT EXISTS media_error text,
ADD COLUMN IF NOT EXISTS media_cached_at timestamp with time zone;

ALTER TABLE public.crawled_posts
DROP CONSTRAINT IF EXISTS crawled_posts_media_type_check;

ALTER TABLE public.crawled_posts
ADD CONSTRAINT crawled_posts_media_type_check
CHECK (media_type IN ('video', 'image', 'carousel', 'unknown'));

ALTER TABLE public.crawled_posts
DROP CONSTRAINT IF EXISTS crawled_posts_media_status_check;

ALTER TABLE public.crawled_posts
ADD CONSTRAINT crawled_posts_media_status_check
CHECK (media_status IN ('original_only', 'cached', 'failed', 'expired', 'unavailable'));

ALTER TABLE public.crawled_posts
DROP CONSTRAINT IF EXISTS crawled_posts_media_source_check;

ALTER TABLE public.crawled_posts
ADD CONSTRAINT crawled_posts_media_source_check
CHECK (media_source IN ('original', 'r2', 'mixed', 'none'));

-- Backfill data
UPDATE public.crawled_posts
SET
  original_media_urls = COALESCE(original_media_urls, media_urls),
  original_cover_url = COALESCE(original_cover_url, cover_url),
  media_type = CASE
    WHEN media_urls IS NULL OR array_length(media_urls, 1) IS NULL THEN 'unknown'
    WHEN media_urls[1] ~* '\.(mp4|webm|mov|m3u8)(\?|$)' THEN 'video'
    WHEN array_length(media_urls, 1) > 1 THEN 'carousel'
    ELSE 'image'
  END,
  media_source = CASE
    WHEN media_urls IS NULL OR array_length(media_urls, 1) IS NULL THEN 'none'
    WHEN media_urls[1] !~* '^https?://' THEN 'r2'
    ELSE 'original'
  END,
  media_status = CASE
    WHEN media_urls IS NULL OR array_length(media_urls, 1) IS NULL THEN 'unavailable'
    WHEN media_urls[1] !~* '^https?://' THEN 'cached'
    ELSE 'original_only'
  END
WHERE media_type IS NULL
   OR original_media_urls IS NULL
   OR media_status IS NULL
   OR media_source IS NULL;

-- Backfill Unsplash demo images to image type
UPDATE public.crawled_posts
SET media_type = 'image'
WHERE media_urls IS NOT NULL
  AND array_length(media_urls, 1) > 0
  AND media_urls[1] ~* 'images\.unsplash\.com';

-- Backfill video files to video type
UPDATE public.crawled_posts
SET media_type = 'video'
WHERE media_urls IS NOT NULL
  AND array_length(media_urls, 1) > 0
  AND media_urls[1] ~* '\.(mp4|webm|mov|m3u8)(\?|$)';

-- Backfill multiple images to carousel type
UPDATE public.crawled_posts
SET media_type = 'carousel'
WHERE media_urls IS NOT NULL
  AND array_length(media_urls, 1) > 1
  AND media_type IS DISTINCT FROM 'video';
