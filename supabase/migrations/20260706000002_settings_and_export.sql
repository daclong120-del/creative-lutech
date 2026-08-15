-- Create exported_files table if not exists
CREATE TABLE IF NOT EXISTS public.exported_files (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    filename text NOT NULL,
    type text NOT NULL,
    filter_snapshot jsonb DEFAULT '{}'::jsonb NOT NULL,
    size_bytes bigint DEFAULT 0 NOT NULL,
    created_by text NOT NULL,
    download_url text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.exported_files OWNER TO postgres;
