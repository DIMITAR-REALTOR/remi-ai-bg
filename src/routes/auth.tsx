import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Building2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Вход / Регистрация — REMI AI" }] }),
  validateSearch: (s: Record<string, unknown>): { next?: string } =>
    typeof s.next === "string" && s.next.startsWith("/") && !s.next.startsWith("//")
      ? { next: s.next }
      : {},
  component: AuthPage,
});

/** Same-origin relative return path preserved across sign-in (e.g. OAuth consent). */
function useNextPath() {
  return Route.useSearch().next;
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.44a5.5 5.5 0 0 1-2.39 3.62v3h3.86c2.26-2.08 3.58-5.15 3.58-8.86z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.86-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28v-3.1H1.29A12 12 0 0 0 0 12c0 1.94.46 3.77 1.29 5.38z" />
      <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.61 4.58 1.79l3.43-3.43C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.29 6.62l3.98 3.1C6.22 6.86 8.87 4.75 12 4.75z" />
    </svg>
  );
}

function GoogleButton() {
  const next = useNextPath();
  const [busy, setBusy] = useState(false);

  const signInWithGoogle = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}${next ?? "/profile"}`,
      },
    });
    if (error) {
      setBusy(false);
      toast.error("Неуспешен вход с Google");
    }
    // при успешно пренасочване към Google busy остава true до навигацията
  };

  return (
    <Button type="button" variant="outline" className="w-full gap-2" disabled={busy} onClick={signInWithGoogle}>
      <GoogleIcon />
      {busy ? "Пренасочване..." : "Продължи с Google"}
    </Button>
  );
}

function OrDivider() {
  return (
    <div className="my-4 flex items-center gap-3">
      <div className="h-px flex-1 bg-border" />
      <span className="text-xs text-muted-foreground">или</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const next = useNextPath();

  useEffect(() => {
    if (loading || !user) return;
    if (next) window.location.href = next;
    else navigate({ to: "/profile" });
  }, [loading, user, navigate, next]);

  return (
    <div className="mx-auto max-w-md px-5 pt-10">
      <div className="text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
          <Building2 className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-black text-foreground">REMI AI</h1>
        <p className="mt-1 text-sm text-muted-foreground">Влез или създай профил</p>
      </div>

      <div className="mt-6">
        <GoogleButton />
        <OrDivider />
      </div>

      <Tabs defaultValue="login">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Вход</TabsTrigger>
          <TabsTrigger value="signup">Регистрация</TabsTrigger>
        </TabsList>
        <TabsContent value="login"><LoginForm /></TabsContent>
        <TabsContent value="signup"><SignupForm /></TabsContent>
      </Tabs>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">← Към начало</Link>
      </p>
    </div>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const next = useNextPath();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { toast.error("Грешен имейл или парола"); return; }
    toast.success("Добре дошъл!");
    if (next) { window.location.href = next; return; }
    navigate({ to: "/profile" });
  };

  return (
    <form onSubmit={submit} className="mt-4 space-y-3">
      <div><Label htmlFor="lemail">Имейл</Label><Input id="lemail" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <div><Label htmlFor="lpass">Парола</Label><Input id="lpass" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
      <Button type="submit" className="w-full" disabled={busy}>{busy ? "Моля изчакай..." : "Вход"}</Button>
    </form>
  );
}

function SignupForm() {
  const [role, setRole] = useState<"broker" | "client">("client");
  const [form, setForm] = useState({ email: "", password: "", full_name: "", phone: "", agency_name: "", bio: "" });
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const next = useNextPath();

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error("Паролата трябва да е поне 6 знака"); return; }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}${next ?? "/"}`,
        data: {
          role,
          full_name: form.full_name,
          phone: form.phone,
          agency_name: role === "broker" ? form.agency_name : null,
          bio: role === "broker" ? form.bio : null,
        },
      },
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Профилът е създаден");
    if (next) { window.location.href = next; return; }
    navigate({ to: "/profile" });
  };

  return (
    <form onSubmit={submit} className="mt-4 space-y-3">
      <div>
        <Label className="mb-1.5 block">Тип профил</Label>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setRole("client")} className={`rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition ${role === "client" ? "border-primary bg-primary/5 text-foreground" : "border-border text-muted-foreground"}`}>Клиент</button>
          <button type="button" onClick={() => setRole("broker")} className={`rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition ${role === "broker" ? "border-primary bg-primary/5 text-foreground" : "border-border text-muted-foreground"}`}>Брокер</button>
        </div>
      </div>
      <div><Label htmlFor="name">Име</Label><Input id="name" required value={form.full_name} onChange={set("full_name")} /></div>
      <div><Label htmlFor="phone">Телефон</Label><Input id="phone" type="tel" value={form.phone} onChange={set("phone")} /></div>
      {role === "broker" && (
        <>
          <div><Label htmlFor="agency">Агенция</Label><Input id="agency" value={form.agency_name} onChange={set("agency_name")} /></div>
          <div><Label htmlFor="bio">Описание</Label><Textarea id="bio" rows={3} value={form.bio} onChange={set("bio")} /></div>
        </>
      )}
      <div><Label htmlFor="semail">Имейл</Label><Input id="semail" type="email" required value={form.email} onChange={set("email")} /></div>
      <div><Label htmlFor="spass">Парола</Label><Input id="spass" type="password" required minLength={6} value={form.password} onChange={set("password")} /></div>
      <Button type="submit" className="w-full" disabled={busy}>{busy ? "Моля изчакай..." : "Създай профил"}</Button>
    </form>
  );
}
