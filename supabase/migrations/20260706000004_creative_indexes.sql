-- 1. Index GIN hỗ trợ lọc mảng nhãn (tags) cực nhanh
CREATE INDEX IF NOT EXISTS crawled_posts_tags_idx ON public.crawled_posts USING gin (tags);

-- 2. Indexes B-Tree hỗ trợ sắp xếp theo thời gian đăng bài và cào bài
CREATE INDEX IF NOT EXISTS crawled_posts_published_at_idx ON public.crawled_posts (published_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS crawled_posts_crawled_at_idx ON public.crawled_posts (crawled_at DESC);

-- 3. Functional Indexes hỗ trợ sắp xếp BXH tương tác (Views & Likes) từ trường JSONB stats
-- Hỗ trợ Douyin, Bilibili (dùng play_count), các platform khác dùng view_count/like_count
CREATE INDEX IF NOT EXISTS crawled_posts_play_count_idx ON public.crawled_posts (
  coalesce(
    (stats->>'play_count')::integer, 
    (stats->>'view_count')::integer, 
    0
  ) DESC
);

CREATE INDEX IF NOT EXISTS crawled_posts_like_count_idx ON public.crawled_posts (
  coalesce(
    (stats->>'like_count')::integer, 
    0
  ) DESC
);
