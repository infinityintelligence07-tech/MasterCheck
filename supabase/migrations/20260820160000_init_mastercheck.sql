-- MasterCheck — schema inicial
-- profiles, events, checklist, leads, activity, templates + RLS + triggers

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
CREATE TYPE public.user_role AS ENUM ('admin', 'operador', 'leitor');

CREATE TYPE public.event_status AS ENUM (
  'rascunho',
  'em_conferencia',
  'pronto',
  'realizado',
  'cancelado'
);

CREATE TYPE public.checklist_tipo AS ENUM (
  'lp_inscricao',
  'pagina_obrigado',
  'grupo_whatsapp',
  'manychat_inscricao',
  'manychat_e_amanha',
  'manychat_e_hoje',
  'exportacao_leads',
  'teste_ponta_a_ponta'
);

CREATE TYPE public.item_status AS ENUM (
  'pendente',
  'ok',
  'erro',
  'nao_aplica'
);

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  nome text NOT NULL DEFAULT '',
  email text NOT NULL,
  avatar_url text,
  role public.user_role NOT NULL DEFAULT 'operador',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX profiles_role_idx ON public.profiles (role);
CREATE UNIQUE INDEX profiles_email_idx ON public.profiles (email);

CREATE TABLE public.checklist_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo public.checklist_tipo NOT NULL UNIQUE,
  label text NOT NULL,
  ordem int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cidade text NOT NULL,
  uf char(2) NOT NULL,
  data_evento date NOT NULL,
  hora_evento time,
  status public.event_status NOT NULL DEFAULT 'rascunho',
  responsavel_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  qtd_leads int NOT NULL DEFAULT 0 CHECK (qtd_leads >= 0),
  qtd_leads_atualizado_em timestamptz,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX events_data_evento_idx ON public.events (data_evento);
CREATE INDEX events_status_idx ON public.events (status);
CREATE INDEX events_responsavel_id_idx ON public.events (responsavel_id);
CREATE INDEX events_cidade_data_idx ON public.events (cidade, data_evento);

CREATE TABLE public.checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  tipo public.checklist_tipo NOT NULL,
  label text NOT NULL,
  url text,
  status public.item_status NOT NULL DEFAULT 'pendente',
  http_status int,
  testado_em timestamptz,
  conferido_por uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  conferido_em timestamptz,
  observacao text,
  ordem int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, tipo)
);

CREATE INDEX checklist_items_event_id_idx ON public.checklist_items (event_id);
CREATE INDEX checklist_items_status_idx ON public.checklist_items (status);

CREATE TABLE public.lead_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  qtd int NOT NULL CHECK (qtd >= 0),
  registrado_por uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX lead_snapshots_event_id_idx ON public.lead_snapshots (event_id, created_at DESC);

CREATE TABLE public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  acao text NOT NULL,
  entidade text,
  campo text,
  valor_antigo text,
  valor_novo text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX activity_log_event_id_idx ON public.activity_log (event_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER events_set_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER checklist_items_set_updated_at
  BEFORE UPDATE ON public.checklist_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER checklist_templates_set_updated_at
  BEFORE UPDATE ON public.checklist_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Profile sync from auth.users
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role public.user_role := 'operador';
  v_nome text;
BEGIN
  IF lower(NEW.email) = 'infinityintelligence07@gmail.com' THEN
    v_role := 'admin';
  END IF;

  v_nome := coalesce(
    NEW.raw_user_meta_data ->> 'nome',
    NEW.raw_user_meta_data ->> 'name',
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.profiles (id, nome, email, avatar_url, role)
  VALUES (
    NEW.id,
    v_nome,
    NEW.email,
    NEW.raw_user_meta_data ->> 'avatar_url',
    v_role
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        nome = COALESCE(NULLIF(public.profiles.nome, ''), EXCLUDED.nome);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Auto checklist on new event
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_default_checklist_items()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.checklist_items (event_id, tipo, label, ordem, status)
  SELECT
    NEW.id,
    t.tipo,
    t.label,
    t.ordem,
    'pendente'
  FROM public.checklist_templates t
  ORDER BY t.ordem;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_event_created_checklist
  AFTER INSERT ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.create_default_checklist_items();

-- ---------------------------------------------------------------------------
-- RLS helpers (role from profiles — never from user_metadata)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_operador_or_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'operador')
  );
$$;

-- ---------------------------------------------------------------------------
-- Seed templates (labels padrão)
-- ---------------------------------------------------------------------------
INSERT INTO public.checklist_templates (tipo, label, ordem) VALUES
  ('lp_inscricao', 'LP inscrição', 1),
  ('pagina_obrigado', 'Página de obrigado', 2),
  ('grupo_whatsapp', 'Grupo WhatsApp', 3),
  ('manychat_inscricao', 'ManyChat inscrição', 4),
  ('manychat_e_amanha', 'ManyChat é amanhã', 5),
  ('manychat_e_hoje', 'ManyChat é hoje', 6),
  ('exportacao_leads', 'Exportação de leads', 7),
  ('teste_ponta_a_ponta', 'Teste ponta a ponta', 8);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY profiles_select_authenticated
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY profiles_update_own
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (
    public.is_admin()
    OR (id = auth.uid() AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()))
  );

CREATE POLICY profiles_insert_admin
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR id = auth.uid());

CREATE POLICY profiles_delete_admin
  ON public.profiles FOR DELETE TO authenticated
  USING (public.is_admin());

-- checklist_templates
CREATE POLICY checklist_templates_select
  ON public.checklist_templates FOR SELECT TO authenticated
  USING (true);

CREATE POLICY checklist_templates_write_admin
  ON public.checklist_templates FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- events
CREATE POLICY events_select
  ON public.events FOR SELECT TO authenticated
  USING (true);

CREATE POLICY events_insert_operador
  ON public.events FOR INSERT TO authenticated
  WITH CHECK (public.is_operador_or_admin());

CREATE POLICY events_update_operador
  ON public.events FOR UPDATE TO authenticated
  USING (public.is_operador_or_admin())
  WITH CHECK (public.is_operador_or_admin());

CREATE POLICY events_delete_admin
  ON public.events FOR DELETE TO authenticated
  USING (public.is_admin());

-- checklist_items
CREATE POLICY checklist_items_select
  ON public.checklist_items FOR SELECT TO authenticated
  USING (true);

CREATE POLICY checklist_items_insert_operador
  ON public.checklist_items FOR INSERT TO authenticated
  WITH CHECK (public.is_operador_or_admin());

CREATE POLICY checklist_items_update_operador
  ON public.checklist_items FOR UPDATE TO authenticated
  USING (public.is_operador_or_admin())
  WITH CHECK (public.is_operador_or_admin());

CREATE POLICY checklist_items_delete_admin
  ON public.checklist_items FOR DELETE TO authenticated
  USING (public.is_admin());

-- lead_snapshots
CREATE POLICY lead_snapshots_select
  ON public.lead_snapshots FOR SELECT TO authenticated
  USING (true);

CREATE POLICY lead_snapshots_insert_operador
  ON public.lead_snapshots FOR INSERT TO authenticated
  WITH CHECK (public.is_operador_or_admin());

CREATE POLICY lead_snapshots_update_operador
  ON public.lead_snapshots FOR UPDATE TO authenticated
  USING (public.is_operador_or_admin())
  WITH CHECK (public.is_operador_or_admin());

CREATE POLICY lead_snapshots_delete_admin
  ON public.lead_snapshots FOR DELETE TO authenticated
  USING (public.is_admin());

-- activity_log
CREATE POLICY activity_log_select
  ON public.activity_log FOR SELECT TO authenticated
  USING (true);

CREATE POLICY activity_log_insert_operador
  ON public.activity_log FOR INSERT TO authenticated
  WITH CHECK (public.is_operador_or_admin());

CREATE POLICY activity_log_update_admin
  ON public.activity_log FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY activity_log_delete_admin
  ON public.activity_log FOR DELETE TO authenticated
  USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
