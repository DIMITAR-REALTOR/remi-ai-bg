import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Plus, Check, Trash2, Calendar, CalendarPlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TaskForm } from "@/components/TaskForm";
import { fmtDateTime } from "@/lib/crm-meta";
import { googleCalendarUrl } from "@/lib/share";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/dashboard/tasks")({
  component: TasksPage,
});

function TasksPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"upcoming" | "done">("upcoming");

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["my-tasks", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("tasks")
        .select("*, clients:client_id(name), listings:listing_id(title)")
        .eq("broker_id", user!.id)
        .order("due_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = tasks.filter((t: any) => (tab === "done" ? t.completed : !t.completed));

  const toggleDone = async (t: any) => {
    const { error } = await (supabase as any).from("tasks").update({ completed: !t.completed }).eq("id", t.id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["my-tasks", user?.id] });
  };
  const del = async (id: string) => {
    const { error } = await (supabase as any).from("tasks").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Изтрита");
    qc.invalidateQueries({ queryKey: ["my-tasks", user?.id] });
  };

  return (
    <div className="mx-auto max-w-xl px-4 pt-4 pb-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-black text-foreground">Огледи и задачи</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Добави задача</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Нова задача</DialogTitle></DialogHeader>
            <TaskForm onSaved={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-3 inline-flex rounded-full bg-secondary p-1 text-xs">
        <button onClick={() => setTab("upcoming")} className={cn("rounded-full px-3 py-1.5 font-medium", tab === "upcoming" ? "bg-background text-foreground shadow" : "text-muted-foreground")}>Предстоящи</button>
        <button onClick={() => setTab("done")} className={cn("rounded-full px-3 py-1.5 font-medium", tab === "done" ? "bg-background text-foreground shadow" : "text-muted-foreground")}>Изпълнени</button>
      </div>

      {isLoading ? (
        <p className="mt-6 text-center text-sm text-muted-foreground">Зареждане...</p>
      ) : filtered.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          <Calendar className="mx-auto mb-2 h-6 w-6 opacity-50" />
          Няма задачи.
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {filtered.map((t: any) => (
            <li key={t.id} className="rounded-2xl border border-border bg-card p-3">
              <div className="flex items-start gap-3">
                <button onClick={() => toggleDone(t)} className={cn("mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2", t.completed ? "border-success bg-success text-success-foreground" : "border-border text-transparent hover:border-primary")}>
                  <Check className="h-3.5 w-3.5" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className={cn("truncate text-sm font-semibold", t.completed ? "text-muted-foreground line-through" : "text-foreground")}>{t.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{fmtDateTime(t.due_at)}</p>
                  {(t.clients?.name || t.listings?.title) && (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {t.clients?.name && <>👤 {t.clients.name}</>}
                      {t.clients?.name && t.listings?.title && " · "}
                      {t.listings?.title && <>🏠 {t.listings.title}</>}
                    </p>
                  )}
                  {t.notes && <p className="mt-1 text-xs text-muted-foreground whitespace-pre-line">{t.notes}</p>}
                  {t.due_at && !t.completed && (
                    <a
                      href={googleCalendarUrl({
                        title: t.title,
                        start: t.due_at,
                        durationMinutes: 60,
                        details: [t.clients?.name && `Клиент: ${t.clients.name}`, t.listings?.title && `Имот: ${t.listings.title}`, t.notes]
                          .filter(Boolean).join("\n"),
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      <CalendarPlus className="h-3.5 w-3.5" />Добави в Google Календар
                    </a>
                  )}
                </div>
                <button onClick={() => del(t.id)} className="text-muted-foreground hover:text-destructive" aria-label="Изтрий">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
