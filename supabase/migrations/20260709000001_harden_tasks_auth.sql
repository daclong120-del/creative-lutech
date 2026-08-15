-- 1. Bật RLS trên bảng crawler_tasks và crawler_logs
ALTER TABLE public.crawler_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crawler_logs ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if any
DROP POLICY IF EXISTS "Allow read of crawler tasks for authenticated users" ON public.crawler_tasks;
DROP POLICY IF EXISTS "Allow read of crawler tasks for admin users" ON public.crawler_tasks;
DROP POLICY IF EXISTS "Allow write of crawler tasks for admin users" ON public.crawler_tasks;
DROP POLICY IF EXISTS "Allow read of crawler logs for authenticated users" ON public.crawler_logs;
DROP POLICY IF EXISTS "Allow read of crawler logs for admin users" ON public.crawler_logs;

-- 3. Cấu hình RLS policies cho bảng crawler_tasks
-- Chỉ admin user mới có thể xem danh sách tasks
CREATE POLICY "Allow read of crawler tasks for admin users" ON public.crawler_tasks
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- Chỉ admin user mới được thực hiện các thay đổi (INSERT, UPDATE, DELETE)
CREATE POLICY "Allow write of crawler tasks for admin users" ON public.crawler_tasks
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- 4. Cấu hình RLS policies cho bảng crawler_logs
-- Chỉ admin user mới có thể xem logs
CREATE POLICY "Allow read of crawler logs for admin users" ON public.crawler_logs
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- Không cung cấp quyền write cho client thông thường trên crawler_logs (chỉ worker dùng service_role bypass RLS để ghi logs)

-- 5. Cấu hình lại RPC create_crawler_tasks để giới hạn quyền admin hoặc service_role
CREATE OR REPLACE FUNCTION public.create_crawler_tasks(
  p_tasks jsonb
) RETURNS jsonb AS $$
DECLARE
  v_task jsonb;
  v_inserted_count int := 0;
  v_skipped_count int := 0;
  v_errors text[] := '{}';
  v_platform text;
  v_command text;
  v_target text;
  v_max_count int;
  v_priority text;
  v_metadata jsonb;
  v_result jsonb;
BEGIN
  -- Authenticate & Authorize: Yêu cầu quyền admin hoặc service_role của Supabase
  IF NOT (auth.role() = 'service_role' OR public.is_admin(auth.uid())) THEN
    RAISE EXCEPTION 'Bạn không có quyền thực hiện hành động này.';
  END IF;

  -- Giới hạn tối đa 50 nhiệm vụ cho mỗi lần chèn
  IF jsonb_array_length(p_tasks) > 50 THEN
    RAISE EXCEPTION 'Số lượng nhiệm vụ vượt quá giới hạn 50 trong một lần tạo.';
  END IF;

  FOR v_task IN SELECT * FROM jsonb_array_elements(p_tasks) LOOP
    v_platform := v_task->>'platform';
    v_command := v_task->>'command';
    v_target := trim(v_task->>'target');
    v_max_count := coalesce((v_task->>'max_count')::int, 50);
    v_priority := coalesce(v_task->>'priority', 'normal');
    v_metadata := coalesce(v_task->'metadata', '{}'::jsonb);

    IF v_target = '' OR v_target IS NULL THEN
      v_skipped_count := v_skipped_count + 1;
      CONTINUE;
    END IF;

    -- Kiểm tra nhiệm vụ trùng lặp đang chạy hoặc chờ xử lý
    IF EXISTS (
      SELECT 1 FROM public.crawler_tasks 
      WHERE platform = v_platform 
        AND command = v_command 
        AND lower(trim(target)) = lower(v_target)
        AND status IN ('pending', 'running')
    ) THEN
      v_skipped_count := v_skipped_count + 1;
      v_errors := array_append(v_errors, format('Nhiệm vụ "%s" cho %s đang chạy hoặc đang chờ.', v_target, v_platform));
    ELSE
      INSERT INTO public.crawler_tasks (platform, command, target, max_count, status, priority, metadata)
      VALUES (v_platform, v_command, v_target, v_max_count, 'pending', v_priority, v_metadata);
      v_inserted_count := v_inserted_count + 1;
    END IF;
  END LOOP;

  v_result := jsonb_build_object(
    'inserted_count', v_inserted_count,
    'skipped_count', v_skipped_count,
    'errors', to_jsonb(v_errors)
  );
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Hạn chế quyền execute đối với RPC create_crawler_tasks
REVOKE EXECUTE ON FUNCTION public.create_crawler_tasks(jsonb) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_crawler_tasks(jsonb) TO service_role, authenticated;

-- 6. Cấu hình lại RPC claim_next_crawler_task để chỉ cho phép service_role
CREATE OR REPLACE FUNCTION public.claim_next_crawler_task()
RETURNS jsonb AS $$
DECLARE
  v_task public.crawler_tasks;
BEGIN
  -- Authenticate & Authorize: Chỉ cho phép worker sử dụng service_role
  IF NOT (auth.role() = 'service_role') THEN
    RAISE EXCEPTION 'Bạn không có quyền thực hiện hành động này.';
  END IF;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Hạn chế quyền execute đối với RPC claim_next_crawler_task
REVOKE EXECUTE ON FUNCTION public.claim_next_crawler_task() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_next_crawler_task() TO service_role;

