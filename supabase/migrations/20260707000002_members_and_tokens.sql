-- Create workspaces table
CREATE TABLE IF NOT EXISTS public.workspaces (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.workspaces OWNER TO postgres;

-- Seed default workspace
INSERT INTO public.workspaces (id, name)
VALUES ('00000000-0000-0000-0000-000000000000', 'SinoMedia Team')
ON CONFLICT (id) DO NOTHING;

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email text NOT NULL UNIQUE,
    name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles OWNER TO postgres;

-- Seed profiles for existing auth users
INSERT INTO public.profiles (id, email, name)
SELECT id, email, COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1))
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Create team_roles table
CREATE TABLE IF NOT EXISTS public.team_roles (
    id text NOT NULL PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text,
    is_locked boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.team_roles OWNER TO postgres;

-- Seed default roles
INSERT INTO public.team_roles (id, name, description, is_locked)
VALUES 
  ('admin', 'Admin', 'Có toàn quyền quản trị, cấu hình hệ thống, quản lý tác vụ crawl và thành viên.', true),
  ('user', 'User', 'Chỉ xem dữ liệu, giám sát trạng thái và xem dữ liệu đã thu thập.', false)
ON CONFLICT (id) DO NOTHING;

-- Create team_role_permissions table
CREATE TABLE IF NOT EXISTS public.team_role_permissions (
    role_id text REFERENCES public.team_roles(id) ON DELETE CASCADE,
    permission text NOT NULL,
    PRIMARY KEY (role_id, permission)
);

ALTER TABLE public.team_role_permissions OWNER TO postgres;

-- Seed default permissions
INSERT INTO public.team_role_permissions (role_id, permission)
VALUES
  ('admin', 'tasks'),
  ('admin', 'accounts'),
  ('admin', 'proxies'),
  ('admin', 'settings'),
  ('admin', 'members'),
  ('admin', 'logs'),
  ('user', 'logs')
ON CONFLICT DO NOTHING;

-- Create team_members table
CREATE TABLE IF NOT EXISTS public.team_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_id text REFERENCES public.team_roles(id) ON DELETE RESTRICT,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending')),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE (workspace_id, user_id)
);

ALTER TABLE public.team_members OWNER TO postgres;

-- Seed the oldest profile as Admin in the default workspace
INSERT INTO public.team_members (workspace_id, user_id, role_id, status)
SELECT '00000000-0000-0000-0000-000000000000', id, 'admin', 'active'
FROM public.profiles
ORDER BY created_at ASC
LIMIT 1
ON CONFLICT (workspace_id, user_id) DO NOTHING;

-- Seed remaining profiles as User
INSERT INTO public.team_members (workspace_id, user_id, role_id, status)
SELECT '00000000-0000-0000-0000-000000000000', id, 'user', 'active'
FROM public.profiles
WHERE id NOT IN (SELECT user_id FROM public.team_members WHERE workspace_id = '00000000-0000-0000-0000-000000000000')
ON CONFLICT (workspace_id, user_id) DO NOTHING;

-- Create team_invitations table
CREATE TABLE IF NOT EXISTS public.team_invitations (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
    email text NOT NULL,
    role_id text REFERENCES public.team_roles(id) ON DELETE CASCADE,
    token text NOT NULL UNIQUE,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE (workspace_id, email)
);

ALTER TABLE public.team_invitations OWNER TO postgres;

-- Create api_tokens table
CREATE TABLE IF NOT EXISTS public.api_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    token_hash text NOT NULL UNIQUE,
    token_prefix text NOT NULL,
    role_id text REFERENCES public.team_roles(id) ON DELETE RESTRICT,
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.api_tokens OWNER TO postgres;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_role_id ON public.team_members(role_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON public.team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_api_tokens_created_by ON public.api_tokens(created_by);

-- Helper security function to check admin without recursion
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_members.user_id = $1 AND team_members.role_id = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Trigger to create profiles and member mapping automatically on user sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  has_admin boolean;
  default_role text := 'user';
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );

  -- Check if there is an active invitation for this email
  SELECT role_id INTO default_role FROM public.team_invitations
  WHERE email = new.email AND expires_at > now()
  LIMIT 1;

  IF default_role IS NOT NULL THEN
    -- Consume invitation
    INSERT INTO public.team_members (workspace_id, user_id, role_id, status)
    VALUES ('00000000-0000-0000-0000-000000000000', new.id, default_role, 'active');
    
    DELETE FROM public.team_invitations WHERE email = new.email;
  ELSE
    -- Check if there are any admins in the default workspace
    SELECT EXISTS (
      SELECT 1 FROM public.team_members 
      WHERE workspace_id = '00000000-0000-0000-0000-000000000000' AND role_id = 'admin'
    ) INTO has_admin;

    -- If no admin exists, make the first user an admin
    IF NOT has_admin THEN
      default_role := 'admin';
    ELSE
      default_role := 'user';
    END IF;

    -- Add to default workspace
    INSERT INTO public.team_members (workspace_id, user_id, role_id, status)
    VALUES ('00000000-0000-0000-0000-000000000000', new.id, default_role, 'active');
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_tokens ENABLE ROW LEVEL SECURITY;

-- Workspace policies
CREATE POLICY "Users can view workspaces they are members of" ON public.workspaces
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.workspace_id = workspaces.id AND team_members.user_id = auth.uid()
    )
  );

-- Profile policies
CREATE POLICY "Allow read of profiles for authenticated users" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow users to update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Role policies
CREATE POLICY "Allow read of roles for authenticated users" ON public.team_roles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow write of roles for admin users" ON public.team_roles
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- Role Permission policies
CREATE POLICY "Allow read of role permissions for authenticated users" ON public.team_role_permissions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow write of role permissions for admin users" ON public.team_role_permissions
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- Member policies
CREATE POLICY "Allow read of team members for authenticated users" ON public.team_members
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow write of team members for admin users" ON public.team_members
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- Invitation policies
CREATE POLICY "Allow read of invitations for admin users" ON public.team_invitations
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Allow write of invitations for admin users" ON public.team_invitations
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- API Token policies
CREATE POLICY "Allow read of API tokens for admin users" ON public.api_tokens
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Allow write of API tokens for admin users" ON public.api_tokens
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()));
