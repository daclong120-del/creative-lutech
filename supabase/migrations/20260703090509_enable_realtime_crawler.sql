-- Enable Realtime for crawler_tasks and crawler_logs tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.crawler_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crawler_logs;
