import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export function useSair() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
}

export function AguardandoAprovacao({ status }: { status?: string }) {
  const sair = useSair();
  const bloqueado = status === "bloqueado";

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-4 rounded-md border border-border bg-card p-8 text-center">
        <ShieldAlert className="mx-auto size-8 text-primary" />
        <h1 className="text-lg font-bold">
          {bloqueado ? "Acesso bloqueado" : "Aguardando aprovação"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {bloqueado
            ? "Seu acesso foi bloqueado pelo administrador. Procure o responsável pelo controle de materiais."
            : "Sua conta foi criada, mas ainda precisa ser aprovada pelo administrador. Assim que for liberada, você poderá acessar o painel."}
        </p>
        <Button variant="outline" className="w-full" onClick={sair}>
          <LogOut /> Sair
        </Button>
      </div>
    </div>
  );
}
