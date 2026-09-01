# MasterCheck — deploy na VPS (iamcontrol.com.br)

## Subdomínio

https://mastercheck.iamcontrol.com.br

## 1) Cloudflare DNS

No painel Cloudflare → domínio **iamcontrol.com.br** → DNS → Add record:

| Type | Name          | Content        | Proxy |
|------|---------------|----------------|-------|
| A    | mastercheck   | IP_DA_SUA_VPS  | Proxied (laranja) **ou** DNS only |

Recomendado para Next.js atrás de Nginx:
- Proxy **laranja (Proxied)** + SSL/TLS mode **Full (strict)** se a VPS tiver certificado (Certbot ou Origin Certificate)
- Ou **DNS only** (cinza) enquanto testa, depois ative o proxy

## 2) Na VPS (primeira vez)

```bash
sudo mkdir -p /opt/mastercheck
cd /opt/mastercheck
git clone https://github.com/infinityintelligence07-tech/MasterCheck.git .
cp .env.example .env
nano .env
```

No `.env` da VPS:

```env
NEXT_PUBLIC_SUPABASE_URL=https://myprsrpdgvssamuydpap.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_APP_URL=https://mastercheck.iamcontrol.com.br
```

```bash
docker compose up -d --build
```

Container escuta em `127.0.0.1:3010` (não abre a porta publicamente).

## 3) Nginx

```bash
sudo cp /opt/mastercheck/deploy/nginx.mastercheck.conf /etc/nginx/sites-available/mastercheck
sudo ln -sf /etc/nginx/sites-available/mastercheck /etc/nginx/sites-enabled/mastercheck
sudo nginx -t && sudo systemctl reload nginx
```

### Certificado SSL na origem (recomendado com Cloudflare Full Strict)

**Opção A — Certbot (se DNS only ou Cloudflare permite HTTP-01):**
```bash
sudo certbot --nginx -d mastercheck.iamcontrol.com.br
```

**Opção B — Cloudflare Origin Certificate** (bom com proxy laranja):
1. Cloudflare → SSL/TLS → Origin Server → Create Certificate
2. Hostnames: `mastercheck.iamcontrol.com.br`
3. Salve cert + key na VPS e ajuste o server block HTTPS no Nginx
4. SSL/TLS mode: **Full (strict)**

## 4) Supabase Auth

Authentication → URL Configuration:

- Site URL: `https://mastercheck.iamcontrol.com.br`
- Redirect URLs: `https://mastercheck.iamcontrol.com.br/auth/callback`

(Pode manter também `http://localhost:3000/auth/callback` para desenvolvimento.)

## 5) GitHub Actions (deploy automático)

Repo → Settings → Secrets and variables → Actions:

| Secret         | Exemplo              |
|----------------|----------------------|
| `VPS_HOST`     | IP da VPS            |
| `VPS_USER`     | `root` ou `deploy`   |
| `VPS_SSH_KEY`  | chave privada SSH    |
| `VPS_APP_PATH` | `/opt/mastercheck`   |
| `VPS_PORT`     | `22`                 |

Na VPS o repo precisa estar clonado em `VPS_APP_PATH` com permissão de `git pull`.

Push em `main` → workflow **Deploy MasterCheck VPS** roda sozinho.

## 6) Teste

```bash
curl -I https://mastercheck.iamcontrol.com.br/login
docker compose -f /opt/mastercheck/docker-compose.yml ps
```
