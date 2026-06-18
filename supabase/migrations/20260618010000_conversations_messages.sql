-- ════════════════════════════════════════════════════════════════════
-- conversations / messages — персистентность AI-чата.
-- ДОКУМЕНТИРУЮЩАЯ миграция: таблицы уже существуют в проде.
-- Всё идемпотентно (IF NOT EXISTS / DROP POLICY IF EXISTS), чтобы
-- безопасно применяться к свежим окружениям и не задевать существующие.
-- ════════════════════════════════════════════════════════════════════

-- ─── TABLES ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.conversations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id),
  pet_id     uuid REFERENCES public.pets(id),
  title      text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
  role            text NOT NULL,
  content         text NOT NULL,
  tokens_used     integer,
  created_at      timestamptz DEFAULT now()
);

-- ─── ROW LEVEL SECURITY ─────────────────────────────────────────────
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages      ENABLE ROW LEVEL SECURITY;

-- ─── POLICIES (idempotent) ──────────────────────────────────────────
-- conversations: владелец = auth.uid() = user_id
DROP POLICY IF EXISTS conversations_owner_all ON public.conversations;
CREATE POLICY conversations_owner_all
  ON public.conversations
  FOR ALL
  USING (auth.uid() = user_id);

-- messages: скоуп через владение беседой
DROP POLICY IF EXISTS messages_via_conversation_all ON public.messages;
CREATE POLICY messages_via_conversation_all
  ON public.messages
  FOR ALL
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations WHERE user_id = auth.uid()
    )
  );
