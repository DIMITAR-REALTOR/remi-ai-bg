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
  component: AuthPage,
});

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/profile" });
  }, [loading, user, navigate]);

  return (
    <div className="mx-auto max-w-md px-5 pt-10">
      <div className="text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
          <Building2 className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-black text-foreground">REMI AI</h1>
        <p className="mt-1 text-sm text-muted-foreground">Влез или създай профил</p>
      </div>

      <Tabs defaultValue="login" className="mt-6">
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { toast.error("Грешен имейл или парола"); return; }
    toast.success("Добре дошъл!");
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

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error("Паролата трябва да е поне 6 знака"); return; }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
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
