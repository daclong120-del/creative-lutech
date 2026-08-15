-- Unlock 'user' role so that its permissions can be modified
UPDATE public.team_roles
SET is_locked = false
WHERE id = 'user';
