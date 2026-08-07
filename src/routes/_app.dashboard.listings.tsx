import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Sparkles, ShieldAlert } from "lucide-react";
import { fmtPrice, statusLabel, statusTone, propertyTypeLabel } from "@/lib/listings-meta";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_app/dashboard/listings")({
  component: ListingsPage,
});

const toneClasses: Record<string, string> = {
  success: "bg-success/15 text-success",
  warning: "bg-warning/20 text-warning-foreground",
  muted: "bg-muted text-muted-foreground",
};

const sampleListings = (broker_id: string) => [
  { broker_id, title: "Уютен двустаен в Чайка", description: "Слънчев апартамент с тераса, близо до плажа.", price_eur: 92000, property_type: "apartment", area_sqm: 68, rooms: 2, floor: 4, city: "Варна", neighborhood: "Чайка", status: "active", photos: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=900","https://images.unsplash.com/photo-1554995207-c18c203602cb?w=900"] },
  { broker_id, title: "Тристаен в Левски след ремонт", description: "Изцяло обновен апартамент с обзавеждане.", price_eur: 128000, property_type: "apartment", area_sqm: 92, rooms: 3, floor: 6, city: "Варна", neighborhood: "Левски", status: "active", photos: ["https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=900"] },
  { broker_id, title: "Луксозен мезонет в Бриз", description: "Панорамна гледка към морето, две тераси.", price_eur: 180000, property_type: "apartment", area_sqm: 130, rooms: 4, floor: 8, city: "Варна", neighborhood: "Бриз", status: "active", photos: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=900"] },
  { broker_id, title: "Едностаен във Възраждане", description: "Компактен и функционален, подходящ за инвестиция.", price_eur: 62000, property_type: "apartment", area_sqm: 42, rooms: 1, floor: 3, city: "Варна", neighborhood: "Възраждане", status: "active", photos: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900"] },
  { broker_id, title: "Двустаен с двор във Виница", description: "Тих район, новo строителство, паркомясто.", price_eur: 89000, property_type: "apartment", area_sqm: 72, rooms: 2, floor: 1, city: "Варна", neighborhood: "Виница", status: "active", photos: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=900"] },
  { broker_id, title: "Къща с двор в Виница", description: "Самостоятелна къща с двор 400 кв.м.", price_eur: 175000, property_type: "house", area_sqm: 180, rooms: 5, floor: null as any, city: "Варна", neighborhood: "Виница", status: "active", photos: ["https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=900"] },
  { broker_id, title: "Парцел за строителство в Бриз", description: "Регулиран парцел с лице към улица.", price_eur: 120000, property_type: "land", area_sqm: 650, rooms: null as any, floor: null as any, city: "Варна", neighborhood: "Бриз", status: "active", photos: ["https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900"] },
  { broker_id, title: "Тристаен в Левски, тих", description: "Спокойна вътрешна локация, удобен транспорт.", price_eur: 115000, property_type: "apartment", area_sqm: 85, rooms: 3, floor: 2, city: "Варна", neighborhood: "Левски", status: "reserved", photos: ["https://images.unsplash.com/photo-1484154218962-a197022b5858?w=900"] },
  { broker_id, title: "Просторен четиристаен в Чайка", description: "Голяма всекидневна, две тераси, гараж.", price_eur: 165000, property_type: "apartment", area_sqm: 118, rooms: 4, floor: 5, city: "Варна", neighborhood: "Чайка", status: "active", photos: ["https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=900"] },
  { broker_id, title: "Бизнес помещение в центъра", description: "Партерно ниво, витрина, подходящо за магазин.", price_eur: 145000, property_type: "business", area_sqm: 110, rooms: 3, floor: 0, city: "Варна", neighborhood: "Възраждане", status: "active", photos: ["https://images.unsplash.com/photo-1497366216548-37526070297c?w=900"] },
];

function ListingsPage() {
  const { user, isBroker, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!loading && user && !isBroker) navigate({ to: "/profile" });
  }, [loading, user, isBroker, navigate]);

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["my-listings", user?.id],
    enabled: !!user && isBroker,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("id,title,price_eur,property_type,area_sqm,rooms,city,neighborhood,status,photos")
        .eq("broker_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const seed = async () => {
    if (!user) return;
    const { error } = await supabase.from("listings").insert(sampleListings(user.id) as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Примерните обяви са добавени");
    qc.invalidateQueries({ queryKey: ["my-listings", user.id] });
    qc.invalidateQueries({ queryKey: ["public-listings"] });
  };

  const del = async (id: string) => {
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Изтрито");
    qc.invalidateQueries({ queryKey: ["my-listings", user?.id] });
    qc.invalidateQueries({ queryKey: ["public-listings"] });
  };

  if (loading || !isBroker) return <div className="p-8 text-center text-sm text-muted-foreground">Зареждане...</div>;

  return (
    <div className="mx-auto max-w-xl px-4 pt-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-black text-foreground">Обяви</h1>
        <Button asChild size="sm" className="gap-1.5"><Link to="/dashboard/new"><Plus className="h-4 w-4" />Добави обява</Link></Button>
      </div>

      <Link to="/risk" className="mt-3 flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition hover:border-primary/40">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><ShieldAlert className="h-4 w-4" /></div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Анализ на сделка</p>
          <p className="text-xs text-muted-foreground">AI оценка на риска при сделка с имот</p>
        </div>
      </Link>

      {isLoading ? (
        <p className="mt-6 text-center text-sm text-muted-foreground">Зареждане...</p>
      ) : listings.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border p-8 text-center">
          <div className="mx-auto mb-3 text-4xl">🏠</div>
          <p className="text-sm font-medium text-foreground">Все още нямаш обяви.</p>
          <p className="mt-1 text-xs text-muted-foreground">Добави своята първа обява или зареди примерни данни.</p>
          <div className="mt-4 flex flex-col gap-2">
            <Button asChild><Link to="/dashboard/new"><Plus className="mr-1 h-4 w-4" />Добави първата си обява →</Link></Button>
            <Button variant="outline" onClick={seed} className="gap-2"><Sparkles className="h-4 w-4" />Зареди примерни обяви</Button>
          </div>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {listings.map((l: any) => (
            <li key={l.id} className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="flex gap-3 p-3">
                <div className="h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {l.photos?.[0] && <img src={l.photos[0]} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", toneClasses[statusTone(l.status)])}>{statusLabel(l.status)}</span>
                    <span className="text-[11px] text-muted-foreground">{propertyTypeLabel(l.property_type)}</span>
                  </div>
                  <p className="mt-1 truncate text-sm font-semibold text-foreground">{l.title}</p>
                  <p className="text-xs text-muted-foreground">{[l.neighborhood, l.city].filter(Boolean).join(", ")}</p>
                  <p className="mt-1 text-sm font-bold text-primary">{fmtPrice(l.price_eur)}</p>
                </div>
              </div>
              <div className="flex border-t border-border">
                <Link to="/dashboard/edit/$id" params={{ id: l.id }} className="flex flex-1 items-center justify-center gap-1.5 py-2 text-xs font-medium text-foreground hover:bg-secondary">
                  <Pencil className="h-3.5 w-3.5" />Редактирай
                </Link>
                <AlertDialog>
                  <AlertDialogTrigger className="flex flex-1 items-center justify-center gap-1.5 border-l border-border py-2 text-xs font-medium text-destructive hover:bg-destructive/5">
                    <Trash2 className="h-3.5 w-3.5" />Изтрий
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Изтрий обявата?</AlertDialogTitle>
                      <AlertDialogDescription>Това действие не може да бъде отменено.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Отказ</AlertDialogCancel>
                      <AlertDialogAction onClick={() => del(l.id)}>Изтрий</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
