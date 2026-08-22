import { EventForm } from "@/components/events/event-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/auth";
import { listOperators } from "@/lib/events";
import { redirect } from "next/navigation";

export default async function NewEventPage() {
  const [operators, profile] = await Promise.all([
    listOperators(),
    getCurrentProfile(),
  ]);

  if (!profile) redirect("/login");

  const canWrite = profile.role === "admin" || profile.role === "operador";

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Novo evento</h1>
        <p className="text-sm text-muted-foreground">
          Ao criar, o checklist padrão (8 itens) é gerado automaticamente.
        </p>
      </div>
      <Card className="border-border bg-card shadow-none">
        <CardHeader>
          <CardTitle className="text-base">MasterClass</CardTitle>
          <CardDescription>
            Preencha cidade, data e, se quiser, os links agora.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EventForm
            mode="create"
            operators={operators}
            currentUserId={profile.id}
            canWrite={canWrite}
          />
        </CardContent>
      </Card>
    </div>
  );
}
