-- 1. Thêm cột metadata vào bảng crawler_tasks
ALTER TABLE public.crawler_tasks 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb NOT NULL;

-- 2. Thêm các cột tags và language vào bảng crawled_posts
ALTER TABLE public.crawled_posts 
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}'::text[] NOT NULL,
ADD COLUMN IF NOT EXISTS language text;

-- 3. Cập nhật hàm RPC create_crawler_tasks để hỗ trợ trích xuất và ghi metadata
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
