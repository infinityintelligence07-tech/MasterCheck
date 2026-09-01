# MasterCheck

Painel interno da **IAM Treinamentos** para conferir ativos digitais das MasterClasses — substituindo a planilha Google por um fluxo único de checklist, leads, testes de link e histórico de atividade.

Repositório: [github.com/infinityintelligence07-tech/MasterCheck](https://github.com/infinityintelligence07-tech/MasterCheck)

---

## O que o app faz

| Área | Funcionalidade |
|------|----------------|
| **Dashboard** | Grade com status do checklist (bolinhas), leads, countdown, filtros, alertas D-3, cards de resumo |
| **Eventos** | CRUD, duplicar, responsável, observações |
| **Checklist** | 8 itens por evento (LP, obrigado, WhatsApp, ManyChat×3, exportação, teste E2E), URLs, teste HTTP, conferência |
| **Leads** | Edição inline, snapshots e sparkline no detalhe |
| **CSV** | Import/export no formato da planilha legada (match por cidade + data) |
| **Activity log** | Timeline por evento + coluna “Última atividade” no dashboard |
| **Busca rápida** | `Ctrl+K` / `Cmd+K` — navegação e busca de eventos |

---

## Stack

- **Next.js 15** (App Router) + TypeScript strict
- **Tailwind CSS v4** + shadcn/ui (tema dark padrão)
- **Supabase** — Auth, Postgres, RLS (sem Prisma)
- **Zod** + React Hook Form · **TanStack Table v9** · **date-fns** (pt-BR) · **sonner** · **lucide**

Deploy alvo: **Vercel**

---

## Pré-requisitos

- Node.js 20+
- npm
- Projeto Supabase (Auth + Postgres habilitados)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (opcional, para migrations locais)

---

## Setup local

### 1. Clonar e instalar

```bash
git clone https://github.com/infinityintelligence07-tech/MasterCheck.git
cd MasterCheck
npm install
```

### 2. Variáveis de ambiente

```bash
cp .env.example .env
```

Preencha `.env` (Next.js carrega `.env`; o script de admin também lê `.env` ou `.env.local`):

| Variável | Onde obter |
|----------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API (**só servidor/scripts**, nunca no client) |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` em dev |

Opcional:

```env
MASTERCHECK_ADMIN_PASSWORD=SenhaSegura123!
```

Se omitida, o script de admin usa `MasterCheck@2026!` — **troque após o primeiro login**.

### 3. Banco de dados (migrations)

Arquivos em `supabase/migrations/`:

1. `20260820160000_init_mastercheck.sql` — schema, RLS, triggers, templates
2. `20260820163000_harden_function_grants.sql` — hardening de funções SECURITY DEFINER

**Opção A — Supabase CLI** (projeto linkado):

```bash
supabase link --project-ref SEU_PROJECT_REF
supabase db push
```

**Opção B — SQL Editor** no dashboard Supabase: execute cada migration na ordem.

Projeto de referência IAM: `myprsrpdgvssamuydpap`.

### 4. Seed de demonstração (opcional)

Execute `supabase/seed.sql` no SQL Editor para 3 eventos de exemplo (Curitiba, BH, SP).

### 5. Primeiro admin

```bash
npm run seed:admin
```

Cria ou atualiza o usuário `infinityintelligence07@gmail.com` com `role = admin`. O trigger `handle_new_user` cria o profile automaticamente no signup.

### 6. Auth — Redirect URLs

No Supabase → **Authentication → URL Configuration**:

| Campo | Desenvolvimento | Produção |
|-------|-----------------|----------|
| Site URL | `http://localhost:3000` | `https://seu-dominio.vercel.app` |
| Redirect URLs | `http://localhost:3000/auth/callback` | `https://seu-dominio.vercel.app/auth/callback` |

### 7. Rodar

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) → login com o admin criado.

---

## Papéis (RLS)

| Role | Permissões |
|------|------------|
| **admin** | Tudo + excluir eventos + configurações |
| **operador** | Criar/editar eventos, checklist, leads, CSV |
| **leitor** | Somente leitura |

Novos usuários entram como `operador` (trigger). Admins ajustam roles direto na tabela `profiles` ou via painel futuro.

---

## Scripts npm

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Build de produção |
| `npm run start` | Servidor após build |
| `npm run lint` | ESLint |
| `npm run seed:admin` | Cria/garante admin IAM |

---

## Deploy na Vercel

1. Importe o repositório GitHub na Vercel.
2. **Framework preset:** Next.js.
3. Adicione as variáveis de ambiente (mesmas do `.env`, com `NEXT_PUBLIC_APP_URL` apontando para a URL de produção).
4. Atualize **Redirect URLs** no Supabase com a URL de produção.
5. Deploy.

`SUPABASE_SERVICE_ROLE_KEY` fica apenas nas env vars da Vercel (Server Actions / scripts CI). **Nunca** prefixe com `NEXT_PUBLIC_`.

## Deploy na VPS (subdomínio + automático)

O projeto inclui Docker, Nginx de exemplo e GitHub Actions.

Guia completo: [`deploy/README.md`](./deploy/README.md)

Resumo:

1. DNS `A` `mastercheck.iamcontrol.com.br` → IP da VPS (Cloudflare)  
2. Clone em `/opt/mastercheck`, configure `.env` com `NEXT_PUBLIC_APP_URL=https://mastercheck.iamcontrol.com.br`  
3. `docker compose up -d --build` + Nginx (proxy `127.0.0.1:3010`) + SSL  
4. Secrets no GitHub: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_APP_PATH`, `VPS_PORT`  
5. Push em `main` → redeploy automático  

---

## Estrutura do projeto

```
app/
  (app)/              # rotas autenticadas (dashboard, eventos, config)
  actions/            # Server Actions (auth, events, checklist, leads, csv)
  auth/callback/      # OAuth / magic link callback
  login/
components/
  dashboard/          # grade, filtros, CSV, cards
  checklist/          # painel e cards por item
  events/             # form, timeline, duplicar/excluir
  leads/              # editor inline, sparkline
  layout/             # header, command palette, tema
  ui/                 # shadcn
lib/
  supabase/           # client, server, middleware
  validations/        # schemas Zod
  activity-log.ts     # auditoria (server)
  activity-format.ts  # formatação (client-safe)
  csv.ts, dashboard.ts, events.ts, link-test.ts, ...
types/
  database.ts         # tipos gerados do Supabase
supabase/
  migrations/         # SQL versionado
  seed.sql            # dados demo
scripts/
  create-admin.cjs    # seed do admin IAM
```

---

## Regenerar tipos TypeScript

Após alterar o schema:

```bash
supabase gen types typescript --project-id SEU_PROJECT_REF > types/database.ts
```

---

## Import / export CSV

- **Export:** dashboard → botão Exportar (eventos filtrados).
- **Import:** dashboard → Importar CSV. Colunas compatíveis com a planilha legada; match por **cidade + data do evento**.
- Atualiza URLs, status do checklist e leads; cria eventos novos quando não encontra match.

---

## Atalhos

| Atalho | Ação |
|--------|------|
| `Ctrl+K` / `Cmd+K` | Busca rápida (eventos + navegação) |
| `Tab` | Navegação por teclado (foco visível) |

---

## Teste de links

- Timeout HTTP: **8 s**
- ManyChat, 401/403 e redirects (302) → **não verificável** (não marca erro automático)
- Testar link **não** marca item como conferido — conferência é ação separada

---

## Backlog (fora do escopo v1)

- [ ] Integração **API ManyChat** (status real dos fluxos)
- [ ] **Webhook da LP** → atualizar `qtd_leads` em tempo real
- [ ] **Notificações WhatsApp/Slack** a D-2 para itens pendentes
- [ ] **Relatório de conversão** (leads × presença × vendas)
- [ ] Painel de gestão de usuários/roles em `/configuracoes`
- [ ] Edição de labels em `checklist_templates` via UI

---

## Licença

Uso interno IAM Treinamentos.
