"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { duplicateEvent, type EventActionState } from "@/app/actions/events";
import { UFS_BRASIL } from "@/lib/events-meta";
import type { EventWithRelations } from "@/lib/events";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const initialState: EventActionState = { ok: false };

export function DuplicateEventButton({ event }: { event: EventWithRelations }) {
  const [open, setOpen] = useState(false);
  const [uf, setUf] = useState<(typeof UFS_BRASIL)[number]>(
    event.uf as (typeof UFS_BRASIL)[number],
  );
  const [state, formAction, pending] = useActionState(duplicateEvent, initialState);

  useEffect(() => {
    if (state.message && !state.ok) {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          Duplicar evento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Duplicar evento</DialogTitle>
          <DialogDescription>
            Clona a estrutura (URLs) para uma nova cidade/data. Status volta a
            rascunho e leads zerados.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="event_id" value={event.id} />
          <input type="hidden" name="uf" value={uf} />
          <div className="space-y-2">
            <Label htmlFor="dup-nome">Nome</Label>
            <Input
              id="dup-nome"
              name="nome"
              required
              defaultValue={event.nome}
              className="h-9"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dup-cidade">Cidade</Label>
              <Input
                id="dup-cidade"
                name="cidade"
                required
                defaultValue={event.cidade}
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label>UF</Label>
              <Select
                value={uf}
                onValueChange={(value) => setUf(value as (typeof UFS_BRASIL)[number])}
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue />
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
              <Label htmlFor="dup-data">Data</Label>
              <Input
                id="dup-data"
                name="data_evento"
                type="date"
                required
                defaultValue={event.data_evento}
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dup-hora">Hora</Label>
              <Input
                id="dup-hora"
                name="hora_evento"
                type="time"
                defaultValue={event.hora_evento?.slice(0, 5) ?? ""}
                className="h-9"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Duplicando…" : "Duplicar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
