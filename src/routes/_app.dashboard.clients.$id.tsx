import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Pencil, Trash2, Phone } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClientForm } from "@/components/ClientForm";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { clientStatusLabel, clientStatusTone, clientTypeLabel, crmToneClasses, fmtDate, fmtDateTime } from "@/lib/crm-meta";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_app/dashboard/clients/$id")({
  component: ClientDetail,
});

function ClientDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);

  const { data: client, isLoading } = useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("clients").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["client-tasks", id],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("tasks").select("*").eq("client_id", id).order("due_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const del = async () => {
    const { error } = await (supabase as any).from("clients").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Изтрит");
    qc.invalidateQueries({ queryKey: ["my-clients", user?.id] });
    navigate({ to: "/dashboard/clients" });
  };

  if (isLoading) return <div className="p-8 text-center text-sm text-muted-foreground">Зареждане...</div>;
  if (!client) return (
    <div className="p-8 text-center">
      <p className="text-sm text-muted-foreground">Клиентът не е намерен.</p>
      <Button asChild className="mt-4"><Link to="/dashboard/clients">Назад</Link></Button>
    </div>
  );

  return (
    <div className="mx-auto max-w-xl px-4 pt-4 pb-6">
      <Link to="/dashboard/clients" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" />Назад
      </Link>

      <div className="mt-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-foreground">{client.name}</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">{clientTypeLabel(client.client_type)}</p>
          </div>
          <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", crmToneClasses[clientStatusTone(client.status)])}>
            {clientStatusLabel(client.status)}
          </span>
        </div>

        {client.phone && (
          <Button asChild variant="outline" size="sm" className="mt-3 gap-2">
            <a href={`tel:${client.phone}`}><Phone className="h-4 w-4" />{client.phone}</a>
          </Button>
        )}

        {client.looking_for && (
          <div className="mt-3">
            <p className="text-xs font-semibold text-muted-foreground">Търси</p>
            <p className="mt-1 text-sm text-foreground whitespace-pre-line">{client.looking_for}</p>
          </div>
        )}
        {client.notes && (
          <div className="mt-3">
            <p className="text-xs font-semibold text-muted-foreground">Бележки</p>
            <p className="mt-1 text-sm text-foreground whitespace-pre-line">{client.notes}</p>
          </div>
        )}
        <p className="mt-3 text-xs text-muted-foreground">Последен контакт: {fmtDate(client.last_contact_at)}</p>

        <div className="mt-4 flex gap-2">
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => setEditOpen(true)}>
              <Pencil className="h-3.5 w-3.5" />Редактирай
            </Button>
            <DialogContent>
              <DialogHeader><DialogTitle>Редактирай клиент</DialogTitle></DialogHeader>
              <ClientForm
                initial={{
                  id: client.id, name: client.name, phone: client.phone ?? "", client_type: client.client_type,
                  looking_for: client.looking_for ?? "", status: client.status, notes: client.notes ?? "",
                  last_contact_at: client.last_contact_at ? client.last_contact_at.slice(0, 10) : "",
                }}
                onSaved={() => setEditOpen(false)}
              />
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-destructive hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />Изтрий
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Изтрий клиента?</AlertDialogTitle>
                <AlertDialogDescription>Това действие не може да бъде отменено.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Отказ</AlertDialogCancel>
                <AlertDialogAction onClick={del}>Изтрий</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="mt-5">
        <h2 className="text-sm font-semibold text-foreground">История на огледи и задачи</h2>
        {tasks.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">Няма свързани задачи.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {tasks.map((t: any) => (
              <li key={t.id} className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-foreground">{t.title}</p>
                  {t.completed && <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success">Изпълнена</span>}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{fmtDateTime(t.due_at)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
