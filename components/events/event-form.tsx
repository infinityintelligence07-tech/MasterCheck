"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  createEvent,
  updateEvent,
  type EventActionState,
} from "@/app/actions/events";
import { CHECKLIST_LABELS_PADRAO } from "@/lib/constants";
import type { EventStatus } from "@/lib/constants";
import type { UfBrasil } from "@/lib/events-meta";
import {
  CHECKLIST_URL_FIELDS,
  EVENT_STATUS_LABELS,
  EVENT_STATUSES,
  UFS_BRASIL,
} from "@/lib/events-meta";
import type { EventWithRelations } from "@/lib/events";
import type { Profile } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const initialState: EventActionState = { ok: false };

type EventFormProps = {
  mode: "create" | "edit";
  event?: EventWithRelations;
  operators: Profile[];
  currentUserId: string;
  canWrite: boolean;
};

export function EventForm({
  mode,
  event,
  operators,
  currentUserId,
  canWrite,
}: EventFormProps) {
  const boundUpdate = updateEvent.bind(null, event?.id ?? "");
  const action = mode === "create" ? createEvent : boundUpdate;
  const [state, formAction, pending] = useActionState(action, initialState);

  const [uf, setUf] = useState<UfBrasil>((event?.uf as UfBrasil) ?? "SP");
  const [status, setStatus] = useState<EventStatus>(
    (event?.status as EventStatus) ?? "rascunho",
  );
  const [responsavelId, setResponsavelId] = useState(
    event?.responsavel_id ?? currentUserId,
  );

  useEffect(() => {
    if (state.message && !state.ok) {
      toast.error(state.message);
    }
  }, [state]);

  const urlMap = Object.fromEntries(
    (event?.checklist_items ?? []).map((i) => [i.tipo, i.url ?? ""]),
  );

  if (!canWrite) {
    return (
      <p className="text-sm text-muted-foreground">
        Seu perfil é somente leitura.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="uf" value={uf} />
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="responsavel_id" value={responsavelId} />

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="nome">Nome do evento</Label>
          <Input
            id="nome"
            name="nome"
            required
            defaultValue={event?.nome ?? ""}
            placeholder="MC Belo Horizonte"
            className="h-9"
          />
          {state.fieldErrors?.nome?.[0] ? (
            <p className="text-xs text-destructive">{state.fieldErrors.nome[0]}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cidade">Cidade</Label>
          <Input
            id="cidade"
            name="cidade"
            required
            defaultValue={event?.cidade ?? ""}
            className="h-9"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="uf">UF</Label>
          <Select
            value={uf}
            onValueChange={(value) => setUf(value as UfBrasil)}
          >
            <SelectTrigger id="uf" className="h-9 w-full">
              <SelectValue placeholder="UF" />
            </SelectTrigger>
            <SelectContent>
              {UFS_BRASIL.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="data_evento">Data</Label>
          <Input
            id="data_evento"
            name="data_evento"
            type="date"
            required
            defaultValue={event?.data_evento ?? ""}
            className="h-9"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hora_evento">Hora (opcional)</Label>
          <Input
            id="hora_evento"
            name="hora_evento"
            type="time"
            defaultValue={event?.hora_evento?.slice(0, 5) ?? ""}
            className="h-9"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as EventStatus)}
          >
            <SelectTrigger id="status" className="h-9 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EVENT_STATUSES.map((item) => (
                <SelectItem key={item} value={item}>
                  {EVENT_STATUS_LABELS[item]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="responsavel_id">Responsável</Label>
          <Select value={responsavelId} onValueChange={setResponsavelId}>
            <SelectTrigger id="responsavel_id" className="h-9 w-full">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {operators.map((op) => (
                <SelectItem key={op.id} value={op.id}>
                  {op.nome || op.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="observacoes">Observações</Label>
          <Textarea
            id="observacoes"
            name="observacoes"
            rows={3}
            defaultValue={event?.observacoes ?? ""}
            placeholder="Notas gerais do evento"
          />
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-medium">Links do checklist</h2>
          <p className="text-xs text-muted-foreground">
            Opcionais — podem ser preenchidos depois no detalhe.
          </p>
        </div>
        <div className="grid gap-3">
          {CHECKLIST_URL_FIELDS.map((tipo) => (
            <div key={tipo} className="space-y-1.5">
              <Label htmlFor={`url_${tipo}`} className="text-xs">
                {CHECKLIST_LABELS_PADRAO[tipo]}
              </Label>
              <Input
                id={`url_${tipo}`}
                name={`url_${tipo}`}
                type="url"
                placeholder="https://"
                defaultValue={urlMap[tipo] ?? ""}
                className="h-9"
              />
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Salvando…"
            : mode === "create"
              ? "Criar evento"
              : "Salvar alterações"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href={event ? `/eventos/${event.id}` : "/"}>Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}
