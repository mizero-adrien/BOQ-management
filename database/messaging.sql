-- Messaging: project board + direct messages
-- Run once in Supabase SQL editor

-- ── Tables ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.project_messages (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  sender_id   uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body        text        NOT NULL CHECK (char_length(body) <= 4000),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS project_messages_project_created
  ON public.project_messages(project_id, created_at);

CREATE TABLE IF NOT EXISTS public.direct_messages (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  sender_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body         text        NOT NULL CHECK (char_length(body) <= 4000),
  read_at      timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT dm_different_users CHECK (sender_id <> recipient_id)
);

CREATE INDEX IF NOT EXISTS direct_messages_project
  ON public.direct_messages(project_id);
CREATE INDEX IF NOT EXISTS direct_messages_participants
  ON public.direct_messages(project_id, sender_id, recipient_id);
CREATE INDEX IF NOT EXISTS direct_messages_recipient_unread
  ON public.direct_messages(recipient_id, read_at) WHERE read_at IS NULL;

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages  ENABLE ROW LEVEL SECURITY;

-- Returns project IDs the current user is a member of
CREATE OR REPLACE FUNCTION public.get_user_project_ids()
RETURNS SETOF uuid
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT project_id FROM public.project_members WHERE user_id = auth.uid();
$$;

-- project_messages policies
DROP POLICY IF EXISTS "Project members can read messages"  ON public.project_messages;
DROP POLICY IF EXISTS "Project members can post messages"  ON public.project_messages;

CREATE POLICY "Project members can read messages" ON public.project_messages
  FOR SELECT USING (
    project_id IN (SELECT public.get_user_project_ids())
    OR project_id IN (SELECT id FROM public.projects WHERE owner_id = auth.uid())
  );

CREATE POLICY "Project members can post messages" ON public.project_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND project_id IN (SELECT public.get_user_project_ids())
  );

-- direct_messages policies
DROP POLICY IF EXISTS "Participants can read DMs"  ON public.direct_messages;
DROP POLICY IF EXISTS "Members can send DMs"       ON public.direct_messages;
DROP POLICY IF EXISTS "Recipient can mark as read" ON public.direct_messages;

CREATE POLICY "Participants can read DMs" ON public.direct_messages
  FOR SELECT USING (auth.uid() IN (sender_id, recipient_id));

CREATE POLICY "Members can send DMs" ON public.direct_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND project_id IN (SELECT public.get_user_project_ids())
  );

CREATE POLICY "Recipient can mark as read" ON public.direct_messages
  FOR UPDATE USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- ── Realtime ──────────────────────────────────────────────────────────────────

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.project_messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── updated_at triggers ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS project_messages_updated_at ON public.project_messages;
CREATE TRIGGER project_messages_updated_at
  BEFORE UPDATE ON public.project_messages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS direct_messages_updated_at ON public.direct_messages;
CREATE TRIGGER direct_messages_updated_at
  BEFORE UPDATE ON public.direct_messages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
