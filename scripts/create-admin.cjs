/**
 * Cria (ou localiza) o admin infinityintelligence07@gmail.com
 * Uso: node scripts/create-admin.cjs
 */
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const p = path.join(process.cwd(), file);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (!m || process.env[m[1]]) continue;
      let v = m[2].trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      process.env[m[1]] = v;
    }
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = "infinityintelligence07@gmail.com";
const password = process.env.MASTERCHECK_ADMIN_PASSWORD || "MasterCheck@2026!";

if (!url || !key) {
  console.error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data: listed, error: listErr } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listErr) throw listErr;

  let user = listed.users.find((u) => u.email?.toLowerCase() === email);

  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nome: "Admin MasterCheck" },
    });
    if (error) throw error;
    user = data.user;
    console.log("Usuário admin criado:", email);
    console.log("Senha temporária:", password);
  } else {
    console.log("Usuário admin já existe:", email);
  }

  const { error: roleErr } = await supabase
    .from("profiles")
    .update({ role: "admin", nome: "Admin MasterCheck" })
    .eq("id", user.id);

  if (roleErr) throw roleErr;
  console.log("Profile role=admin OK:", user.id);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
