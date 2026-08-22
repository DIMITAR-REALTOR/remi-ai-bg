import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, Home } from "lucide-react";
import { toast } from "sonner";
import { PartyForm } from "@/components/PartyForm";
import {
  EMPTY_PARTY, EMPTY_DEPOSIT_TERMS, generateDepositContract,
  type PartyData, type DepositTerms,
} from "@/lib/contracts-meta";
import { fmtPrice } from "@/lib/listings-meta";

export const Route = createFileRoute("/_app/dashboard/contracts/new/deposit")({
  component: DepositForm,
});

function DepositForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [seller, setSeller] = useState<PartyData>(EMPTY_PARTY);
  const [buyer, setBuyer] = useState<PartyData>(EMPTY_PARTY);
  const [sellerPhoto, setSellerPhoto] = useState<string | null>(null);
  const [buyerPhoto, setBuyerPhoto] = useState<string | null>(null);
  const [terms, setTerms] = useState<DepositTerms>(EMPTY_DEPOSIT_TERMS);
  const [listingId, setListingId] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const { data: listings = [] } = useQuery({
    queryKey: ["contract-listings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("id,title,city,neighborhood,area_sqm,price_eur")
        .eq("broker_id", user!.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const setTerm = <K extends keyof DepositTerms>(k: K, v: DepositTerms[K]) =>
    setTerms((p) => ({ ...p, [k]: v }));

  const applyListing = (id: string) => {
    setListingId(id);
    const l = listings.find((x: any) => x.id === id);
    if (!l) return;
    setTerms((p) => ({
      ...p,
      property_description: l.title ?? p.property_description,
      property_address: [l.neighborhood, l.city].filter(Boolean).join(", ") || p.property_address,
      agreed_price_eur: l.price_eur ? String(l.price_eur) : p.agreed_price_eur,
    }));
  };

  const previewText = useMemo(
    () => generateDepositContract(seller, buyer, terms),
    [seller, buyer, terms]
  );

  const save = async (status: "draft" | "finalized") => {
    if (!user) return;
    if (!seller.name || !buyer.name) {
      toast.error("Попълни поне имената на продавача и купувача");
      return;
    }
    setBusy(true);
    const { data, error } = await (supabase as any).from("contracts").insert({
      broker_id: user.id,
      listing_id: listingId || null,
      contract_type: "deposit",
      status,
      party_a: seller,
      party_b: buyer,
      party_a_id_photo_url: sellerPhoto,
      party_b_id_photo_url: buyerPhoto,
      terms,
      generated_content: previewText,
    }).select("id").single();
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(status === "draft" ? "Черновата е запазена" : "Договорът е финализиран");
    qc.invalidateQueries({ queryKey: ["my-contracts", user.id] });
    navigate({ to: "/dashboard/contracts/$id", params: { id: data.id } });
  };

  return (
    <div className="mx-auto max-w-xl px-4 pt-4 pb-10">
      <Link to="/dashboard/contracts/new" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" />Назад
      </Link>

      <h1 className="mt-2 text-2xl font-black text-foreground">Договор за капаро / депозит</h1>
      <p className="mt-1 text-xs text-muted-foreground">
        Ориентировъчен текст. Препоръчва се преглед от юрист преди подписване.
      </p>

      {listings.length > 0 && (
        <div className="mt-4 rounded-2xl border border-border bg-card p-4">
          <Label className="flex items-center gap-1.5 text-xs"><Home className="h-3.5 w-3.5" />Свържи с имот от твоите обяви (по избор)</Label>
          <Select value={listingId} onValueChange={applyListing}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Избери имот" /></SelectTrigger>
            <SelectContent>
              {listings.map((l: any) => (
                <SelectItem key={l.id} value={l.id}>{l.title} · {fmtPrice(l.price_eur)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="mt-4">
        <PartyForm title="Продавач" value={seller} onChange={setSeller} idPhotoUrl={sellerPhoto} onIdPhotoChange={setSellerPhoto} />
      </div>
      <div className="mt-3">
        <PartyForm title="Купувач" value={buyer} onChange={setBuyer} idPhotoUrl={buyerPhoto} onIdPhotoChange={setBuyerPhoto} />
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground">Имот и условия</h3>
        <div className="mt-3 space-y-3">
          <div><Label>Описание на имота</Label><Textarea rows={2} value={terms.property_description} onChange={(e) => setTerm("property_description", e.target.value)} placeholder="Апартамент, 2 стаи, ет. 3..." /></div>
          <div><Label>Адрес</Label><Input value={terms.property_address} onChange={(e) => setTerm("property_address", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Договорена цена (€)</Label><Input inputMode="decimal" value={terms.agreed_price_eur} onChange={(e) => setTerm("agreed_price_eur", e.target.value)} /></div>
            <div><Label>Капаро (€)</Label><Input inputMode="decimal" value={terms.deposit_eur} onChange={(e) => setTerm("deposit_eur", e.target.value)} /></div>
          </div>
          <div><Label>Срок за предварителен/окончателен договор</Label><Input type="date" value={terms.preliminary_contract_deadline} onChange={(e) => setTerm("preliminary_contract_deadline", e.target.value)} /></div>
          <div><Label>Допълнителни клаузи</Label><Textarea rows={3} value={terms.extra_clauses} onChange={(e) => setTerm("extra_clauses", e.target.value)} placeholder="По избор..." /></div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-muted/30 p-4">
        <h3 className="text-sm font-semibold text-foreground">Преглед</h3>
        <pre className="mt-2 max-h-80 overflow-y-auto whitespace-pre-wrap font-sans text-xs text-muted-foreground">{previewText}</pre>
      </div>

      <div className="mt-4 flex gap-2">
        <Button variant="outline" className="flex-1" disabled={busy} onClick={() => save("draft")}>Запази чернова</Button>
        <Button className="flex-1" disabled={busy} onClick={() => save("finalized")}>Финализирай</Button>
      </div>
    </div>
  );
}
