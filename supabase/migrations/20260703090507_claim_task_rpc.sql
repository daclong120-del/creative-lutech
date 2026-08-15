-- Create RPC function to atomically claim the next pending task
CREATE OR REPLACE FUNCTION public.claim_next_crawler_task()
RETURNS jsonb AS $$
DECLARE
  v_task public.crawler_tasks;
BEGIN
  -- Khóa và cập nhật dòng task pending đầu tiên có thứ tự thời gian tạo sớm nhất
  UPDATE public.crawler_tasks
  SET status = 'running',
      updated_at = now()
  WHERE id = (
    SELECT id
    FROM public.crawler_tasks
    WHERE status = 'pending'
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING * INTO v_task;

  IF FOUND THEN
    RETURN to_jsonb(v_task);
  ELSE
    RETURN NULL;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
