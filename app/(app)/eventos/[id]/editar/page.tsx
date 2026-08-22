import { notFound } from "next/navigation";
import { EventForm } from "@/components/events/event-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/auth";
import { getEventById, listOperators } from "@/lib/events";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditEventPage({ params }: PageProps) {
  const { id } = await params;
  const [event, operators, profile] = await Promise.all([
    getEventById(id),
    listOperators(),
    getCurrentProfile(),
  ]);

  if (!event || !profile) notFound();

  const canWrite = profile.role === "admin" || profile.role === "operador";

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Editar evento</h1>
        <p className="text-sm text-muted-foreground">{event.nome}</p>
      </div>
      <Card className="border-border bg-card shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Dados do evento</CardTitle>
          <CardDescription>
            Alterações são validadas no servidor com Zod.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EventForm
            mode="edit"
            event={event}
            operators={operators}
            currentUserId={profile.id}
            canWrite={canWrite}
          />
        </CardContent>
      </Card>
    </div>
  );
}
