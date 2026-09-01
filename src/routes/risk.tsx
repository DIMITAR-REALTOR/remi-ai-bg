import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { analyzeDealRisk, type DealRiskResult, extractLegalDocument, extractIdentityDocument } from "@/lib/ai.functions";
import { addHistory } from "@/lib/history-storage";
import { uploadLegalDocument, uploadIdentityDocument, validateDocFile } from "@/lib/storage";
import {
  LEGAL_DOCUMENT_TYPES, legalDocTypeShortLabel, legalDocFields, AVAILABILITY_LABELS,
  IDENTITY_ROLES, maskEgn, HEIR_CERTIFICATE_TRIGGER_VALUE, type LegalDocumentType,
} from "@/lib/legal-meta";
import { fmtDate } from "@/lib/crm-meta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldAlert, ArrowLeft, Plus, FileCheck2, FileClock, FileX2, Sparkles, Eye, EyeOff, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/risk")({
  head: () => ({
    meta: [
      { title: "REMI Правен анализ" },
      { name: "description", content: "Документи, тежести и правни рискове по собствеността — с AI разпознаване." },
    ],
  }),
  component: LegalAnalysisPage,
});

function LegalAnalysisPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [dialogType, setDialogType] = useState<LegalDocumentType | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ["legal-documents", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("legal_documents")
        .select("id,document_type,document_subtype,availability_status,extracted_data,broker_confirmed,broker_notes,created_at")
        .eq("broker_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: identities = [] } = useQuery({
    queryKey: ["identity-documents", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("identity_documents")
        .select("id,full_name,egn,document_number,valid_until,role_in_deal,input_method,created_at")
        .eq("broker_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const hasInheritedOwnership = docs.some(
    (d: any) => d.document_type === "ownership_document" && d.extracted_data?.acquisition_method === HEIR_CERTIFICATE_TRIGGER_VALUE
  );
  const visibleDocTypes = LEGAL_DOCUMENT_TYPES.filter((t) => t.value !== "heir_certificate" || hasInheritedOwnership);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["legal-documents", user?.id] });
    qc.invalidateQueries({ queryKey: ["identity-documents", user?.id] });
  };

  return (
    <div className="mx-auto max-w-xl px-5 pt-6 pb-8">
      <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Начало
      </Link>

      <header className="mt-3 flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">REMI Правен анализ</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Документи, тежести и правни рискове по собствеността — с AI разпознаване.
          </p>
        </div>
      </header>

      <Tabs defaultValue="risk" className="mt-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="risk">Оценка на риска</TabsTrigger>
          <TabsTrigger value="documents">Документи</TabsTrigger>
        </TabsList>

        <TabsContent value="risk" className="mt-4">
          <RiskScoreSection />
        </TabsContent>

        <TabsContent value="documents" className="mt-4 space-y-6">
          {/* Табло — статус по тип документ */}
          <section className="grid grid-cols-1 gap-2">
            {visibleDocTypes.map((t) => {
              const matching = docs.filter((d: any) => d.document_type === t.value);
              const status = matching.length === 0 ? "missing" : matching.some((d: any) => d.availability_status === "uploaded") ? "uploaded" : "available";
              return (
                <button
                  key={t.value}
                  onClick={() => setDialogType(t.value)}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition hover:border-primary/40"
                >
                  <div
                    className={cn(
                      "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
                      status === "uploaded" && "bg-success/15 text-success",
                      status === "available" && "bg-warning/20 text-warning-foreground",
                      status === "missing" && "bg-muted text-muted-foreground"
                    )}
                  >
                    {status === "uploaded" ? <FileCheck2 className="h-4 w-4" /> : status === "available" ? <FileClock className="h-4 w-4" /> : <FileX2 className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{t.shortLabel}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {matching.length === 0 ? "Няма добавени" : `${matching.length} ${matching.length === 1 ? "документ" : "документа"}`}
                    </p>
                  </div>
                  <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              );
            })}
          </section>

          {hasInheritedOwnership && !docs.some((d: any) => d.document_type === "heir_certificate") && (
            <div className="rounded-2xl border border-warning/40 bg-warning/10 p-3 text-xs text-warning-foreground">
              Открит е документ за собственост, придобита по наследство — препоръчваме да добавиш и Удостоверение за наследници.
            </div>
          )}

          {/* Списък с вече добавени документи */}
          {!isLoading && docs.length > 0 && (
            <section>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Добавени документи</p>
              <ul className="mt-2 space-y-2">
                {docs.map((d: any) => (
                  <DocRow key={d.id} doc={d} onChanged={refresh} />
                ))}
              </ul>
            </section>
          )}

          {/* Документи за самоличност */}
          <section>
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Документи за самоличност</p>
              <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => setShowAddMenu(true)}>
                <Plus className="h-3 w-3" /> Добави
              </Button>
            </div>
            {identities.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">Няма добавени страни по сделка.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {identities.map((p: any) => (
                  <IdentityRow key={p.id} person={p} />
                ))}
              </ul>
            )}
          </section>
        </TabsContent>
      </Tabs>

      {dialogType && (
        <AddLegalDocDialog
          type={dialogType}
          onClose={() => setDialogType(null)}
          onSaved={() => {
            setDialogType(null);
            refresh();
          }}
        />
      )}
      {showAddMenu && (
        <AddIdentityDialog
          onClose={() => setShowAddMenu(false)}
          onSaved={() => {
            setShowAddMenu(false);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function scoreTone(score: number) {
  if (score <= 3) return { label: "Нисък риск", cls: "bg-success text-success-foreground" };
  if (score <= 6) return { label: "Среден риск", cls: "bg-warning text-warning-foreground" };
  return { label: "Висок риск", cls: "bg-destructive text-destructive-foreground" };
}

function RiskScoreSection() {
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [construction, setConstruction] = useState("");
  const [docStatus, setDocStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<DealRiskResult | null>(null);
  const [busy, setBusy] = useState(false);
  const analyze = useServerFn(analyzeDealRisk);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!price || !location.trim() || !construction.trim() || !docStatus.trim()) {
      toast.error("Попълни цена, локация, тип строителство и статус на документите");
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const price_eur = Number(price);
      const payload = {
        price_eur,
        location: location.trim(),
        construction_type: construction.trim(),
        document_status: docStatus.trim(),
        notes: notes.trim(),
      };
      const r = await analyze({ data: payload });
      setResult(r);
      addHistory({
        kind: "risk",
        location: payload.location,
        price_eur: payload.price_eur,
        construction_type: payload.construction_type,
        document_status: payload.document_status,
        notes: payload.notes,
        result: r,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Грешка при анализ");
    } finally {
      setBusy(false);
    }
  };

  const tone = result ? scoreTone(result.score) : null;

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-card p-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="risk-price">Цена (EUR)</Label>
            <Input
              id="risk-price"
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
              placeholder="120000"
            />
          </div>
          <div>
            <Label htmlFor="risk-location">Локация</Label>
            <Input
              id="risk-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Варна, Чайка"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="risk-construction">Тип строителство</Label>
            <Input
              id="risk-construction"
              value={construction}
              onChange={(e) => setConstruction(e.target.value)}
              placeholder="Тухла / Панел / ЕПК"
            />
          </div>
          <div>
            <Label htmlFor="risk-doc-status">Статус на документите</Label>
            <Input
              id="risk-doc-status"
              value={docStatus}
              onChange={(e) => setDocStatus(e.target.value)}
              placeholder="Пълна документация"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="risk-notes">Допълнителни бележки</Label>
          <Textarea
            id="risk-notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="напр. наследство, ипотека, незавършен строеж..."
          />
        </div>

        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Анализирам..." : <><Sparkles className="h-4 w-4" /> Оцени риска</>}
        </Button>
      </form>

      {result && tone && (
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-4">
            <div className={cn("grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-2xl font-black", tone.cls)}>
              {result.score}
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Оценка на риска</p>
              <p className="mt-1 text-sm font-medium text-foreground">
                Рискът е <span className="font-bold">{result.score}/10</span>
              </p>
              <span className={cn("mt-2 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold", tone.cls)}>
                {tone.label}
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {result.risks.map((r, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-3">
                <p className="text-sm font-semibold text-foreground">{i + 1}. {r.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{r.explanation}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Препоръка</p>
            <p className="mt-1 text-sm text-foreground">{result.recommendation}</p>
          </div>
        </section>
      )}
    </div>
  );
}

function DocRow({ doc, onChanged }: { doc: any; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const fields = legalDocFields(doc.document_type);
  return (
    <li className="rounded-2xl border border-border bg-card p-3">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-3 text-left">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{legalDocTypeShortLabel(doc.document_type)}</p>
          <p className="text-[11px] text-muted-foreground">
            {AVAILABILITY_LABELS[doc.availability_status] ?? doc.availability_status} · {fmtDate(doc.created_at)}
          </p>
        </div>
        {doc.broker_confirmed && <span className="shrink-0 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success">Потвърден</span>}
      </button>
      {open && (
        <div className="mt-3 space-y-1.5 border-t border-border pt-3">
          {doc.broker_notes && <p className="text-xs text-muted-foreground">Бележка: {doc.broker_notes}</p>}
          {fields.map((f) => {
            const v = doc.extracted_data?.[f.key];
            if (!v) return null;
            return (
              <div key={f.key} className="flex justify-between gap-3 text-xs">
                <span className="text-muted-foreground">{f.label}</span>
                <span className="text-right font-medium text-foreground">{v}</span>
              </div>
            );
          })}
        </div>
      )}
    </li>
  );
}

function IdentityRow({ person }: { person: any }) {
  const [reveal, setReveal] = useState(false);
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        <UserRound className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{person.full_name || "—"}</p>
        <p className="text-[11px] text-muted-foreground">
          {person.role_in_deal || "—"} · ЕГН: {reveal ? person.egn || "—" : maskEgn(person.egn)}
        </p>
      </div>
      <button onClick={() => setReveal((v) => !v)} className="shrink-0 text-muted-foreground hover:text-foreground">
        {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </li>
  );
}

function AddLegalDocDialog({ type, onClose, onSaved }: { type: LegalDocumentType; onClose: () => void; onSaved: () => void }) {
  const { user } = useAuth();
  const meta = LEGAL_DOCUMENT_TYPES.find((t) => t.value === type)!;
  const extract = useServerFn(extractLegalDocument);

  const [mode, setMode] = useState<"upload" | "available">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const setField = (k: string, v: string) => setFields((p) => ({ ...p, [k]: v }));

  const handleFile = async (f: File) => {
    const err = validateDocFile(f);
    if (err) {
      toast.error(err);
      return;
    }
    setFile(f);
    if (!user) return;
    setBusy(true);
    try {
      const { signedUrl } = await uploadLegalDocument(user.id, f);
      const res = await extract({
        data: { file_url: signedUrl, document_type: type, field_keys: meta.fields.map((x) => x.key) },
      });
      setFields(res.fields);
      toast.success("AI разпозна документа — провери и потвърди полетата");
    } catch (e: any) {
      toast.error(e?.message ?? "Грешка при разпознаване");
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!user) return;
    if (mode === "upload" && !file) {
      toast.error("Качи файл или избери \"Налично при брокера\"");
      return;
    }
    setBusy(true);
    try {
      const { error } = await (supabase as any).from("legal_documents").insert({
        broker_id: user.id,
        document_type: type,
        availability_status: mode === "upload" ? "uploaded" : "available_not_uploaded",
        extracted_data: mode === "upload" ? fields : null,
        broker_confirmed: mode === "upload" ? confirmed : true,
        broker_notes: notes.trim() || null,
      });
      if (error) throw error;
      toast.success("Документът е записан");
      onSaved();
    } catch (e: any) {
      toast.error(e?.message ?? "Грешка при запис");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{meta.label}</DialogTitle>
        </DialogHeader>

        {meta.allowAvailableNotUploaded && (
          <Tabs value={mode} onValueChange={(v) => setMode(v as "upload" | "available")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Качи документ</TabsTrigger>
              <TabsTrigger value="available">Налично при брокера</TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {mode === "upload" ? (
          <div className="space-y-3">
            <div>
              <Label>Снимка или PDF на документа</Label>
              <Input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                disabled={busy}
              />
              {file && <p className="mt-1 text-xs text-muted-foreground">{file.name}</p>}
            </div>

            {busy && !Object.keys(fields).length && (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 animate-pulse" /> AI разпознава документа...
              </p>
            )}

            {file && Object.keys(fields).length > 0 && (
              <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-3">
                <p className="text-xs font-medium text-muted-foreground">Провери и коригирай при нужда:</p>
                {meta.fields.map((f) => (
                  <div key={f.key}>
                    <Label className="text-xs">{f.label}</Label>
                    <Input value={fields[f.key] ?? ""} onChange={(e) => setField(f.key, e.target.value)} placeholder={f.placeholder} />
                  </div>
                ))}
                <div className="flex items-center gap-2 pt-1">
                  <Checkbox checked={confirmed} onCheckedChange={(v) => setConfirmed(!!v)} id="confirm" />
                  <Label htmlFor="confirm" className="text-xs font-normal">Потвърждавам, че данните са верни</Label>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <Label>Бележка (по желание)</Label>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="напр. видяно на оглед на ..." />
          </div>
        )}

        <Button onClick={save} disabled={busy || (mode === "upload" && !!file && Object.keys(fields).length > 0 && !confirmed)} className="w-full">
          Запази
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function AddIdentityDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { user } = useAuth();
  const extractId = useServerFn(extractIdentityDocument);
  const [busy, setBusy] = useState(false);
  const [full_name, setFullName] = useState("");
  const [egn, setEgn] = useState("");
  const [document_number, setDocNumber] = useState("");
  const [valid_until, setValidUntil] = useState("");
  const [role_in_deal, setRole] = useState<string>(IDENTITY_ROLES[0]);
  const [file, setFile] = useState<File | null>(null);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [inputMethod, setInputMethod] = useState<"manual" | "ocr">("manual");

  const runOcr = async (f: File) => {
    const err = validateDocFile(f);
    if (err) {
      toast.error(err);
      return;
    }
    if (!user) return;
    setBusy(true);
    try {
      const { signedUrl, path } = await uploadIdentityDocument(user.id, f);
      const res = await extractId({ data: { file_url: signedUrl } });
      setFullName(res.full_name);
      setEgn(res.egn);
      setDocNumber(res.document_number);
      setValidUntil(res.valid_until);
      setFilePath(path);
      setInputMethod("ocr");
      toast.success("Данните са разпознати — провери преди запис");
    } catch (e: any) {
      toast.error(e?.message ?? "Грешка при разпознаване");
    } finally {
      setBusy(false);
    }
  };

  const uploadWithoutOcr = async (f: File) => {
    const err = validateDocFile(f);
    if (err) {
      toast.error(err);
      return;
    }
    if (!user) return;
    setBusy(true);
    try {
      const { path } = await uploadIdentityDocument(user.id, f);
      setFilePath(path);
      toast.success("Снимката е качена (без AI разпознаване)");
    } catch (e: any) {
      toast.error(e?.message ?? "Грешка при качване");
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!user) return;
    if (!full_name.trim()) {
      toast.error("Въведи име");
      return;
    }
    setBusy(true);
    try {
      const { error } = await (supabase as any).from("identity_documents").insert({
        broker_id: user.id,
        full_name: full_name.trim(),
        egn: egn.trim() || null,
        document_number: document_number.trim() || null,
        valid_until: valid_until.trim() || null,
        role_in_deal,
        file_path: filePath,
        input_method: inputMethod,
      });
      if (error) throw error;
      toast.success("Записано");
      onSaved();
    } catch (e: any) {
      toast.error(e?.message ?? "Грешка при запис");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Документ за самоличност</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label>Имена (по документ)</Label>
            <Input value={full_name} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <Label>ЕГН</Label>
            <Input value={egn} onChange={(e) => setEgn(e.target.value)} inputMode="numeric" />
          </div>
          <div>
            <Label>Номер на документ</Label>
            <Input value={document_number} onChange={(e) => setDocNumber(e.target.value)} />
          </div>
          <div>
            <Label>Валидност</Label>
            <Input value={valid_until} onChange={(e) => setValidUntil(e.target.value)} placeholder="дд.мм.гггг" />
          </div>
          <div>
            <Label>Роля в сделката</Label>
            <Select value={role_in_deal} onValueChange={setRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{IDENTITY_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="rounded-xl border border-dashed border-border p-3">
            <p className="text-xs font-medium text-muted-foreground">По желание — снимка на документа</p>
            <div className="mt-2 flex gap-2">
              <Input
                type="file"
                accept="image/*"
                className="text-xs"
                onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
                disabled={busy}
              />
            </div>
            {file && (
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="outline" className="text-xs" onClick={() => runOcr(file)} disabled={busy}>
                  <Sparkles className="mr-1 h-3 w-3" /> Разпознай с AI
                </Button>
                <Button size="sm" variant="ghost" className="text-xs" onClick={() => uploadWithoutOcr(file)} disabled={busy}>
                  Качи само снимката
                </Button>
              </div>
            )}
          </div>
        </div>

        <Button onClick={save} disabled={busy} className="w-full">Запази</Button>
      </DialogContent>
    </Dialog>
  );
}
