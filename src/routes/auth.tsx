import { useState } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import brasao from "@/assets/brasao.png";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acesso restrito | Controle de Materiais 9ºB.C - 4ª CIA" },
      {
        name: "description",
        content:
          "Área de acesso para registrar e editar entregas de materiais do efetivo do 9ºB.C - 4ª CIA.",
      },
      { property: "og:title", content: "Acesso restrito — Controle de Materiais" },
      {
        property: "og:description",
        content: "Entre com e-mail e senha para registrar e editar entregas de materiais.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/painel" });
  },
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setCarregando(false);
    if (error) return toast.error("E-mail ou senha inválidos.");
    toast.success("Acesso liberado.");
    navigate({ to: "/painel", replace: true });
  }

  async function cadastrar(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { emailRedirectTo: window.location.origin },
    });
    setCarregando(false);
    if (error) return toast.error(error.message);
    if (!data.session) {
      return toast.success("Conta criada. Confirme o e-mail para poder editar.");
    }
    toast.success("Conta criada e acesso liberado.");
    navigate({ to: "/painel", replace: true });
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12">
      <img
        src={brasao}
        alt=""
        aria-hidden="true"
        width={1024}
        height={1024}
        className="pointer-events-none absolute left-1/2 top-1/2 w-[min(120vw,720px)] max-w-none -translate-x-1/2 -translate-y-1/2 opacity-[0.07] blur-[1px]"
      />
      <Toaster />
      <div className="relative w-full max-w-md space-y-6 rounded-md border border-border bg-card/95 p-8 backdrop-blur">
        <div className="flex items-center gap-3">
          <img
            src={brasao}
            alt="Brasão do 9ºB.C - 4ª CIA"
            width={1024}
            height={1024}
            className="size-10 shrink-0 object-contain"
          />
          <div>
            <h1 className="text-lg font-bold leading-none">Acesso restrito</h1>
            <p className="label-industrial mt-1">Somente para editar registros</p>
          </div>
        </div>

        <Tabs defaultValue="entrar">
          <TabsList className="w-full">
            <TabsTrigger value="entrar" className="flex-1">
              Entrar
            </TabsTrigger>
            <TabsTrigger value="criar" className="flex-1">
              Criar conta
            </TabsTrigger>
          </TabsList>

          <TabsContent value="entrar">
            <form className="space-y-4" onSubmit={entrar}>
              <Campos
                email={email}
                senha={senha}
                setEmail={setEmail}
                setSenha={setSenha}
                autoComplete="current-password"
              />
              <Button type="submit" className="w-full" disabled={carregando}>
                Entrar
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="criar">
            <form className="space-y-4" onSubmit={cadastrar}>
              <Campos
                email={email}
                senha={senha}
                setEmail={setEmail}
                setSenha={setSenha}
                autoComplete="new-password"
              />
              <Button type="submit" className="w-full" disabled={carregando}>
                Criar conta
              </Button>
            </form>
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
}

function Campos({
  email,
  senha,
  setEmail,
  setSenha,
  autoComplete,
}: {
  email: string;
  senha: string;
  setEmail: (v: string) => void;
  setSenha: (v: string) => void;
  autoComplete: string;
}) {
  return (
    <>
      <div className="space-y-1.5">
        <Label className="label-industrial">E-mail</Label>
        <Input
          type="email"
          required
          value={email}
          autoComplete="email"
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="label-industrial">Senha</Label>
        <Input
          type="password"
          required
          minLength={6}
          value={senha}
          autoComplete={autoComplete}
          onChange={(e) => setSenha(e.target.value)}
        />
      </div>
    </>
  );
}
