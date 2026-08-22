import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ConfiguracoesPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Gestão de usuários e labels do checklist — UI completa nas próximas etapas.
        </p>
      </div>
      <Card className="border-border bg-card shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Acesso admin</CardTitle>
          <CardDescription>
            Você está autenticado como {profile.email} com role admin.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Placeholder seguro. A edição de roles e templates entra depois do CRUD de eventos.
        </CardContent>
      </Card>
    </div>
  );
}
