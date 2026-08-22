-- Seed MasterCheck — 3 eventos de exemplo + snapshots + activity
-- Requer profile admin (infinityintelligence07@gmail.com) já existente.
-- Rode após criar o usuário no Auth (ou via script npm run seed:admin).

DO $$
DECLARE
  admin_id uuid;
  ev_bh uuid;
  ev_sp uuid;
  ev_cwb uuid;
BEGIN
  SELECT id INTO admin_id
  FROM public.profiles
  WHERE lower(email) = 'infinityintelligence07@gmail.com'
  LIMIT 1;

  IF admin_id IS NULL THEN
    RAISE NOTICE 'Seed pulado: crie o usuário infinityintelligence07@gmail.com no Auth e rode este seed de novo.';
    RETURN;
  END IF;

  UPDATE public.profiles
  SET role = 'admin', nome = COALESCE(NULLIF(nome, ''), 'Admin MasterCheck')
  WHERE id = admin_id;

  -- Evita duplicar seed
  IF EXISTS (
    SELECT 1 FROM public.events
    WHERE nome IN ('MC Belo Horizonte', 'MC São Paulo', 'MC Curitiba')
  ) THEN
    RAISE NOTICE 'Seed já aplicado (eventos de exemplo existem).';
    RETURN;
  END IF;

  -- MC Belo Horizonte — 26/08/2026, 266 leads, checklist quase completo
  INSERT INTO public.events (
    id, nome, cidade, uf, data_evento, hora_evento, status,
    responsavel_id, qtd_leads, qtd_leads_atualizado_em, observacoes
  ) VALUES (
    gen_random_uuid(),
    'MC Belo Horizonte',
    'Belo Horizonte',
    'MG',
    '2026-08-26',
    '19:30',
    'pronto',
    admin_id,
    266,
    now() - interval '2 hours',
    'Checklist quase completo — falta só o teste ponta a ponta.'
  )
  RETURNING id INTO ev_bh;

  UPDATE public.checklist_items SET
    url = 'https://ie.iamtreinamentos.com.br/mc-belohorizonte',
    status = 'ok',
    http_status = 200,
    testado_em = now() - interval '1 day',
    conferido_por = admin_id,
    conferido_em = now() - interval '1 day'
  WHERE event_id = ev_bh AND tipo = 'lp_inscricao';

  UPDATE public.checklist_items SET
    url = 'https://ie.iamtreinamentos.com.br/mc-belohorizonte/obrigado',
    status = 'ok',
    http_status = 200,
    testado_em = now() - interval '1 day',
    conferido_por = admin_id,
    conferido_em = now() - interval '1 day'
  WHERE event_id = ev_bh AND tipo = 'pagina_obrigado';

  UPDATE public.checklist_items SET
    url = 'https://chat.whatsapp.com/D5q7ExemploBH',
    status = 'ok',
    conferido_por = admin_id,
    conferido_em = now() - interval '20 hours'
  WHERE event_id = ev_bh AND tipo = 'grupo_whatsapp';

  UPDATE public.checklist_items SET
    url = 'https://app.manychat.com/fb1431027/cms/files/bh-inscricao',
    status = 'ok',
    http_status = 302,
    testado_em = now() - interval '1 day',
    conferido_por = admin_id,
    conferido_em = now() - interval '1 day'
  WHERE event_id = ev_bh AND tipo = 'manychat_inscricao';

  UPDATE public.checklist_items SET
    url = 'https://app.manychat.com/fb1431027/cms/files/bh-amanha',
    status = 'ok',
    conferido_por = admin_id,
    conferido_em = now() - interval '18 hours'
  WHERE event_id = ev_bh AND tipo = 'manychat_e_amanha';

  UPDATE public.checklist_items SET
    url = 'https://app.manychat.com/fb1431027/cms/files/bh-hoje',
    status = 'ok',
    conferido_por = admin_id,
    conferido_em = now() - interval '18 hours'
  WHERE event_id = ev_bh AND tipo = 'manychat_e_hoje';

  UPDATE public.checklist_items SET
    status = 'ok',
    conferido_por = admin_id,
    conferido_em = now() - interval '12 hours',
    observacao = 'Exportado 266 leads'
  WHERE event_id = ev_bh AND tipo = 'exportacao_leads';

  -- teste_ponta_a_ponta permanece pendente

  INSERT INTO public.lead_snapshots (event_id, qtd, registrado_por, created_at) VALUES
    (ev_bh, 120, admin_id, now() - interval '10 days'),
    (ev_bh, 198, admin_id, now() - interval '5 days'),
    (ev_bh, 240, admin_id, now() - interval '2 days'),
    (ev_bh, 266, admin_id, now() - interval '2 hours');

  INSERT INTO public.activity_log (event_id, user_id, acao, entidade, campo, valor_novo, created_at)
  VALUES (ev_bh, admin_id, 'atualizou leads', 'events', 'qtd_leads', '266', now() - interval '2 hours');

  -- MC São Paulo — 03/09/2026, 412 leads, em conferência
  INSERT INTO public.events (
    id, nome, cidade, uf, data_evento, hora_evento, status,
    responsavel_id, qtd_leads, qtd_leads_atualizado_em, observacoes
  ) VALUES (
    gen_random_uuid(),
    'MC São Paulo',
    'São Paulo',
    'SP',
    '2026-09-03',
    '20:00',
    'em_conferencia',
    admin_id,
    412,
    now() - interval '30 minutes',
    'Em conferência — validar ManyChat e grupo.'
  )
  RETURNING id INTO ev_sp;

  UPDATE public.checklist_items SET
    url = 'https://ie.iamtreinamentos.com.br/mc-saopaulo',
    status = 'ok',
    http_status = 200,
    testado_em = now() - interval '3 hours',
    conferido_por = admin_id,
    conferido_em = now() - interval '3 hours'
  WHERE event_id = ev_sp AND tipo = 'lp_inscricao';

  UPDATE public.checklist_items SET
    url = 'https://ie.iamtreinamentos.com.br/mc-saopaulo/obrigado',
    status = 'ok',
    http_status = 200,
    testado_em = now() - interval '3 hours',
    conferido_por = admin_id,
    conferido_em = now() - interval '3 hours'
  WHERE event_id = ev_sp AND tipo = 'pagina_obrigado';

  UPDATE public.checklist_items SET
    url = 'https://chat.whatsapp.com/ExemploSP',
    status = 'pendente'
  WHERE event_id = ev_sp AND tipo = 'grupo_whatsapp';

  UPDATE public.checklist_items SET
    url = 'https://app.manychat.com/fb1431027/cms/files/sp-inscricao',
    status = 'pendente'
  WHERE event_id = ev_sp AND tipo = 'manychat_inscricao';

  UPDATE public.checklist_items SET
    url = 'https://app.manychat.com/fb1431027/cms/files/sp-amanha',
    status = 'pendente'
  WHERE event_id = ev_sp AND tipo = 'manychat_e_amanha';

  UPDATE public.checklist_items SET
    url = 'https://app.manychat.com/fb1431027/cms/files/sp-hoje',
    status = 'pendente'
  WHERE event_id = ev_sp AND tipo = 'manychat_e_hoje';

  UPDATE public.checklist_items SET
    status = 'ok',
    conferido_por = admin_id,
    conferido_em = now() - interval '1 hour',
    observacao = '412 leads exportados'
  WHERE event_id = ev_sp AND tipo = 'exportacao_leads';

  INSERT INTO public.lead_snapshots (event_id, qtd, registrado_por, created_at) VALUES
    (ev_sp, 210, admin_id, now() - interval '8 days'),
    (ev_sp, 355, admin_id, now() - interval '3 days'),
    (ev_sp, 412, admin_id, now() - interval '30 minutes');

  INSERT INTO public.activity_log (event_id, user_id, acao, entidade, campo, valor_novo, created_at)
  VALUES (ev_sp, admin_id, 'atualizou leads', 'events', 'qtd_leads', '412', now() - interval '30 minutes');

  -- MC Curitiba — 22/08/2026, 89 leads, 3 pendências (alerta D-2)
  INSERT INTO public.events (
    id, nome, cidade, uf, data_evento, hora_evento, status,
    responsavel_id, qtd_leads, qtd_leads_atualizado_em, observacoes
  ) VALUES (
    gen_random_uuid(),
    'MC Curitiba',
    'Curitiba',
    'PR',
    '2026-08-22',
    '19:00',
    'em_conferencia',
    admin_id,
    89,
    now() - interval '1 day',
    'Atenção: evento em 2 dias com itens pendentes.'
  )
  RETURNING id INTO ev_cwb;

  UPDATE public.checklist_items SET
    url = 'https://ie.iamtreinamentos.com.br/mc-curitiba',
    status = 'ok',
    http_status = 200,
    testado_em = now() - interval '2 days',
    conferido_por = admin_id,
    conferido_em = now() - interval '2 days'
  WHERE event_id = ev_cwb AND tipo = 'lp_inscricao';

  UPDATE public.checklist_items SET
    url = 'https://ie.iamtreinamentos.com.br/mc-curitiba/obrigado',
    status = 'ok',
    http_status = 200,
    testado_em = now() - interval '2 days',
    conferido_por = admin_id,
    conferido_em = now() - interval '2 days'
  WHERE event_id = ev_cwb AND tipo = 'pagina_obrigado';

  UPDATE public.checklist_items SET
    url = 'https://chat.whatsapp.com/ExemploCWB',
    status = 'ok',
    conferido_por = admin_id,
    conferido_em = now() - interval '2 days'
  WHERE event_id = ev_cwb AND tipo = 'grupo_whatsapp';

  UPDATE public.checklist_items SET
    url = 'https://app.manychat.com/fb1431027/cms/files/cwb-inscricao',
    status = 'ok',
    conferido_por = admin_id,
    conferido_em = now() - interval '1 day'
  WHERE event_id = ev_cwb AND tipo = 'manychat_inscricao';

  UPDATE public.checklist_items SET
    url = 'https://app.manychat.com/fb1431027/cms/files/cwb-amanha',
    status = 'pendente'
  WHERE event_id = ev_cwb AND tipo = 'manychat_e_amanha';

  UPDATE public.checklist_items SET
    url = 'https://app.manychat.com/fb1431027/cms/files/cwb-hoje',
    status = 'pendente'
  WHERE event_id = ev_cwb AND tipo = 'manychat_e_hoje';

  UPDATE public.checklist_items SET
    status = 'ok',
    conferido_por = admin_id,
    conferido_em = now() - interval '1 day'
  WHERE event_id = ev_cwb AND tipo = 'exportacao_leads';

  UPDATE public.checklist_items SET
    status = 'pendente',
    observacao = 'Ainda não testado ponta a ponta'
  WHERE event_id = ev_cwb AND tipo = 'teste_ponta_a_ponta';

  INSERT INTO public.lead_snapshots (event_id, qtd, registrado_por, created_at) VALUES
    (ev_cwb, 40, admin_id, now() - interval '6 days'),
    (ev_cwb, 72, admin_id, now() - interval '3 days'),
    (ev_cwb, 89, admin_id, now() - interval '1 day');

  INSERT INTO public.activity_log (event_id, user_id, acao, entidade, campo, valor_novo, created_at)
  VALUES (ev_cwb, admin_id, 'marcou item pendente', 'checklist_items', 'status', 'pendente', now() - interval '4 hours');

  RAISE NOTICE 'Seed concluído: BH, SP e Curitiba.';
END $$;
