-- Versões/páginas alternativas por item de checklist (ex.: várias LPs)
ALTER TABLE public.checklist_items
  ADD COLUMN IF NOT EXISTS url_versions jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.checklist_items.url_versions IS
  'Lista de versões/páginas: [{id, label, url}]. url principal fica em checklist_items.url (1ª versão).';

-- Backfill: se já tem url e url_versions vazio, cria uma versão "Principal"
UPDATE public.checklist_items
SET url_versions = jsonb_build_array(
  jsonb_build_object(
    'id', gen_random_uuid()::text,
    'label', 'Principal',
    'url', url
  )
)
WHERE url IS NOT NULL
  AND btrim(url) <> ''
  AND (url_versions IS NULL OR url_versions = '[]'::jsonb);
