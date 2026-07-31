import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Ban, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAcesso, type Perfil } from "@/hooks/use-acesso";
import { AguardandoAprovacao } from "@/components/acesso-gate";
import { formatarData } from "@/lib/controle";

export const Route = createFileRoute("/_authenticated/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuários | CONTROLE DE MATERIAIS 9ºB.C - 4ª CIA" },
      {
        name: "description",
        content:
          "Aprovação de contas: o administrador libera, bloqueia ou remove o acesso dos usuários ao controle de materiais.",
      },
      { property: "og:title", content: "Usuários — CONTROLE DE MATERIAIS" },
      {
        property: "og:description",
        content: "Aprove ou bloqueie contas de acesso ao controle de materiais do 9ºB.C - 4ª CIA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Usuarios,
});

function Usuarios() {
  const { perfil, admin, aprovado, carregando } = useAcesso();
  const queryClient = useQueryClient();

  const lista = useQuery({
    queryKey: ["perfis"],
    enabled: admin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, status, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Perfil[];
    },
  });

  const alterar = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("profiles").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Situação atualizada.");
      queryClient.invalidateQueries({ queryKey: ["perfis"] });
    },
    onError: () => toast.error("Não foi possível atualizar."),
  });

  const remover = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("profiles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Registro removido.");
      queryClient.invalidateQueries({ queryKey: ["perfis"] });
    },
    onError: () => toast.error("Não foi possível remover."),
  });

  if (carregando) return null;
  if (!aprovado) return <AguardandoAprovacao status={perfil?.status} />;
  if (!admin) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Somente o administrador pode gerenciar contas.
          </p>
          <Button variant="outline" asChild>
            <Link to="/painel">
              <ArrowLeft /> Voltar ao painel
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const perfis = lista.data ?? [];

  return (
    <div className="min-h-screen">
      <Toaster />
      <header className="border-b border-border bg-card/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <h1 className="text-xl font-bold leading-none">Usuários</h1>
            <p className="label-industrial mt-1">Aprovação de contas</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/painel">
              <ArrowLeft /> Painel
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>E-mail</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {perfis.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.email || "—"}</TableCell>
                  <TableCell className="uppercase">{p.status}</TableCell>
                  <TableCell>{formatarData(p.created_at.slice(0, 10))}</TableCell>
                  <TableCell className="space-x-2 text-right">
                    {p.status !== "aprovado" && (
                      <Button
                        size="sm"
                        onClick={() => alterar.mutate({ id: p.id, status: "aprovado" })}
                      >
                        <Check /> Aprovar
                      </Button>
                    )}
                    {p.status !== "bloqueado" && p.id !== perfil?.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => alterar.mutate({ id: p.id, status: "bloqueado" })}
                      >
                        <Ban /> Bloquear
                      </Button>
                    )}
                    {p.id !== perfil?.id && (
                      <Button size="sm" variant="ghost" onClick={() => remover.mutate(p.id)}>
                        <Trash2 /> Remover
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {perfis.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    Nenhuma conta cadastrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
}
