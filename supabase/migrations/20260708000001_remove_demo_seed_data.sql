-- Remove deterministic demo rows that were previously inserted by supabase/seed.sql.
-- These rows made the crawler dashboard look like it had real task/account data.

DELETE FROM public.crawler_logs
WHERE task_id IN (
  'f47ac10b-58cc-4372-a567-0e02b2c3d401',
  'f47ac10b-58cc-4372-a567-0e02b2c3d402',
  'f47ac10b-58cc-4372-a567-0e02b2c3d403'
);

DELETE FROM public.crawler_tasks
WHERE id IN (
  'f47ac10b-58cc-4372-a567-0e02b2c3d401',
  'f47ac10b-58cc-4372-a567-0e02b2c3d402',
  'f47ac10b-58cc-4372-a567-0e02b2c3d403'
);

DELETE FROM public.crawler_accounts
WHERE id IN (
  'e47ac10b-58cc-4372-a567-0e02b2c3d501',
  'e47ac10b-58cc-4372-a567-0e02b2c3d502',
  'e47ac10b-58cc-4372-a567-0e02b2c3d503'
)
AND cookie_data = 'dummy_cookie_content';

DELETE FROM public.crawled_posts
WHERE id IN (
  'post_dy_1',
  'post_dy_2',
  'post_bili_1',
  'post_xhs_1'
);

DELETE FROM public.crawled_authors
WHERE id IN (
  'author_douyin_1',
  'author_bilibili_1',
  'author_xhs_1'
);
