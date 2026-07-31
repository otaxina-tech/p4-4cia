import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Users2,
  FileDown,
  LogOut,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { StatusBadge } from "@/components/status-badge";
import { EntregaDialog } from "@/components/entrega-dialog";
import { FichaDialog } from "@/components/ficha-dialog";
import { PolicialDialog } from "@/components/policial-dialog";
import { useControle } from "@/hooks/use-controle";
import { useAcesso } from "@/hooks/use-acesso";
import { AguardandoAprovacao, useSair } from "@/components/acesso-gate";
import {
  formatarData,
  statusDe,
  statusPolicial,
  type MaterialTipo,
  type Policial,
} from "@/lib/controle";


export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({
    meta: [
      { title: "Painel | CONTROLE DE MATERIAIS 9ºB.C - 4ª CIA" },
      {
        name: "description",
        content:
          "Controle de entrega de materiais do efetivo: fardamento, bota, boina, cinturão, coldre e mais, com validade, dias restantes e alertas de vencimento.",
      },
      { property: "og:title", content: "Painel — CONTROLE DE MATERIAIS" },
      {
        property: "og:description",
        content:
          "Acompanhe entregas, validades e vencimentos de materiais por policial, com ficha individual e histórico.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const {
    policiais,
    materiais,
    historico,
    registrarEntrega,
    removerEntrega,
    adicionarPolicial,
    removerPolicial,
    adicionarMaterial,
    removerMaterial,
  } = useControle();
  const { perfil, admin, aprovado, carregando: carregandoAcesso } = useAcesso();
  const sair = useSair();
  const podeEditar = aprovado;
  const [busca, setBusca] = useState("");
  const [posto, setPosto] = useState("todos");
  const [status, setStatus] = useState("todos");
  const [ficha, setFicha] = useState<Policial | null>(null);
  const [entregaAlvo, setEntregaAlvo] = useState<Policial | null>(null);
  const [materialAlvo, setMaterialAlvo] = useState<MaterialTipo | undefined>();
  const [novoPolicial, setNovoPolicial] = useState(false);
  const [novoMaterial, setNovoMaterial] = useState("");

  const postos = useMemo(
    () => Array.from(new Set(policiais.map((p) => p.posto))).sort(),
    [policiais],
  );

  const filtrados = useMemo(
    () =>
      policiais.filter((p) => {
        const alvo = `${p.posto} ${p.re} ${p.nome}`.toLowerCase();
        if (busca && !alvo.includes(busca.toLowerCase())) return false;
        if (posto !== "todos" && p.posto !== posto) return false;
        if (status !== "todos" && statusPolicial(p) !== status) return false;
        return true;
      }),
    [policiais, busca, posto, status],
  );

  const itensEntregues = policiais.reduce((s, p) => s + Object.keys(p.itens).length, 0);
  const vencidos = policiais.filter((p) => statusPolicial(p) === "VENCIDO").length;
  const aVencer = policiais.filter((p) => statusPolicial(p) === "A VENCER").length;

  const porMaterial = materiais.map((m) => {
    const entregues = policiais.filter((p) => p.itens[m]).length;
    const vencidosM = policiais.filter((p) => statusDe(p.itens[m]?.validade) === "VENCIDO").length;
    const aVencerM = policiais.filter((p) => statusDe(p.itens[m]?.validade) === "A VENCER").length;
    return { material: m, entregues, vencidosM, aVencerM };
  });

  async function criarPolicial(dados: { re: string; nome: string; posto: string }) {
    try {
      await adicionarPolicial(dados);
      toast.success(`${dados.nome} adicionado ao efetivo.`);
    } catch {
      toast.error("Não foi possível adicionar. Verifique se o RE já existe.");
    }
  }

  async function excluirPolicial(p: Policial) {
    if (!window.confirm(`Remover ${p.nome} (RE ${p.re}) e suas entregas?`)) return;
    try {
      await removerPolicial(p.re);
      toast.success("Policial removido.");
    } catch {
      toast.error("Não foi possível remover.");
    }
  }

  async function criarMaterial() {
    const nome = novoMaterial.trim();
    if (!nome) return;
    try {
      await adicionarMaterial(nome);
      setNovoMaterial("");
      toast.success(`Material "${nome}" adicionado.`);
    } catch {
      toast.error("Não foi possível adicionar. Esse material já existe?");
    }
  }

  async function excluirMaterial(nome: string) {
    if (!window.confirm(`Remover o material "${nome}" e todas as suas entregas?`)) return;
    try {
      await removerMaterial(nome);
      toast.success("Material removido.");
    } catch {
      toast.error("Não foi possível remover.");
    }
  }

  function exportar() {
    const linhas = policiais.map((p) => {
      const base: Record<string, string> = { "Posto/Graduação": p.posto, RE: p.re, Nome: p.nome };
      for (const m of materiais) {

        base[`${m} Entrega`] = formatarData(p.itens[m]?.entrega);
        base[`${m} Validade`] = formatarData(p.itens[m]?.validade);
        base[`${m} Status`] = statusDe(p.itens[m]?.validade);
      }
      return base;
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(linhas), "Cadastro");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(historico), "Histórico");
    XLSX.writeFile(wb, "CONTROLE_MATERIAIS_2026.xlsx");
    toast.success("Planilha exportada.");
  }

  if (carregandoAcesso) return null;
  if (!aprovado) return <AguardandoAprovacao status={perfil?.status} />;

  return (
    <div className="min-h-screen">
      <Toaster />
      <header className="border-b border-border bg-card/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-3">
            <img
              src="/brasao-9bc.png"
              alt="Brasão do 9ºB.C - 4ª CIA"
              className="size-10 shrink-0 object-contain"
            />
            <div>
              <h1 className="text-xl font-bold leading-none">CONTROLE DE MATERIAIS&nbsp;</h1>
              <p className="label-industrial mt-1">9ºB.C - 4ª CIA</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={exportar}>
              <FileDown /> Exportar planilha
            </Button>
            {admin && (
              <Button variant="outline" asChild>
                <Link to="/usuarios">
                  <Users2 /> Usuários
                </Link>
              </Button>
            )}
            <Button variant="ghost" onClick={sair}>
              <LogOut /> Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi icone={<Users className="size-4" />} rotulo="Total de policiais" valor={String(policiais.length)} />
          <Kpi
            icone={<CheckCircle2 className="size-4" />}
            rotulo="Itens entregues"
            valor={String(itensEntregues)}
          />
          <Kpi
            icone={<CalendarClock className="size-4" />}
            rotulo="A vencer (30 dias)"
            valor={String(aVencer)}
            destaque="warning"
          />
          <Kpi
            icone={<AlertTriangle className="size-4" />}
            rotulo="Com item vencido"
            valor={String(vencidos)}
            destaque="destructive"
          />
        </section>

        <Tabs defaultValue="efetivo">
          <TabsList>
            <TabsTrigger value="efetivo">Efetivo</TabsTrigger>
            <TabsTrigger value="materiais">Por material</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="efetivo" className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-64 flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Buscar por nome, RE ou posto..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </div>
              <Select value={posto} onValueChange={setPosto}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Todos os postos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os postos</SelectItem>
                  {postos.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="VÁLIDO">Válido</SelectItem>
                  <SelectItem value="A VENCER">A vencer</SelectItem>
                  <SelectItem value="VENCIDO">Vencido</SelectItem>
                  <SelectItem value="SEM ENTREGA">Sem entrega</SelectItem>
                </SelectContent>
              </Select>
              {podeEditar && (
                <Button onClick={() => setNovoPolicial(true)}>
                  <Plus /> Adicionar policial
                </Button>
              )}
            </div>


            <div className="overflow-hidden rounded-md border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="label-industrial">Posto</TableHead>
                    <TableHead className="label-industrial">RE</TableHead>
                    <TableHead className="label-industrial">Nome</TableHead>
                    <TableHead className="label-industrial text-right">Itens</TableHead>
                    <TableHead className="label-industrial">Situação</TableHead>
                    <TableHead className="label-industrial text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtrados.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                        {p.posto}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {p.re}
                      </TableCell>
                      <TableCell className="font-medium">{p.nome}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {Object.keys(p.itens).length}/{materiais.length}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={statusPolicial(p)} />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={() => setFicha(p)}>
                            <ClipboardList className="size-4" /> Ficha
                          </Button>
                          {podeEditar && (
                            <>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                  setMaterialAlvo(undefined);
                                  setEntregaAlvo(p);
                                }}
                              >
                                Entrega
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                aria-label={`Remover ${p.nome}`}
                                onClick={() => excluirPolicial(p)}
                              >
                                <Trash2 className="size-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>

                    </TableRow>
                  ))}
                  {!filtrados.length && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                        Nenhum policial encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="materiais">
            <div className="overflow-hidden rounded-md border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="label-industrial">Material</TableHead>
                    <TableHead className="label-industrial text-right">Entregues</TableHead>
                    <TableHead className="label-industrial text-right">Pendentes</TableHead>
                    <TableHead className="label-industrial text-right">A vencer</TableHead>
                    <TableHead className="label-industrial text-right">Vencidos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {porMaterial.map((r) => (
                    <TableRow key={r.material}>
                      <TableCell className="font-medium">{r.material}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.entregues}</TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {policiais.length - r.entregues}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-warning">
                        {r.aVencerM}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-destructive">
                        {r.vencidosM}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="historico">
            <div className="overflow-hidden rounded-md border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="label-industrial">Data</TableHead>
                    <TableHead className="label-industrial">RE</TableHead>
                    <TableHead className="label-industrial">Nome</TableHead>
                    <TableHead className="label-industrial">Material</TableHead>
                    <TableHead className="label-industrial">Entrega</TableHead>
                    <TableHead className="label-industrial">Validade</TableHead>
                    <TableHead className="label-industrial">Responsável</TableHead>
                    <TableHead className="label-industrial">Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historico.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {new Date(h.data).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {h.re}
                      </TableCell>
                      <TableCell className="font-medium">{h.nome}</TableCell>
                      <TableCell>{h.material}</TableCell>
                      <TableCell>{formatarData(h.entrega)}</TableCell>
                      <TableCell>{formatarData(h.validade)}</TableCell>
                      <TableCell className="text-muted-foreground">{h.responsavel || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{h.observacoes || "—"}</TableCell>
                    </TableRow>
                  ))}
                  {!historico.length && (
                    <TableRow>
                      <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                        Nenhuma entrega registrada ainda.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <FichaDialog
        policial={ficha}
        podeEditar={podeEditar}
        onFechar={() => setFicha(null)}
        onRegistrar={(m) => {
          setMaterialAlvo(m);
          setEntregaAlvo(ficha);
        }}
        onRemover={async (m) => {
          if (!ficha) return;
          try {
            await removerEntrega(ficha.re, m);
            setFicha({ ...ficha, itens: { ...ficha.itens, [m]: undefined } });
            toast.success("Registro removido.");
          } catch {
            toast.error("Não foi possível remover. Faça login novamente.");
          }
        }}
      />
      <EntregaDialog
        policial={entregaAlvo}
        materialInicial={materialAlvo}
        onFechar={() => setEntregaAlvo(null)}
        onSalvar={async (material, dados) => {
          if (!entregaAlvo) return;
          try {
            await registrarEntrega(entregaAlvo, material, dados);
            setFicha((f) =>
              f && f.id === entregaAlvo.id ? { ...f, itens: { ...f.itens, [material]: dados } } : f,
            );
            toast.success(`${material} registrado para ${entregaAlvo.nome}.`);
          } catch {
            toast.error("Não foi possível salvar. Faça login novamente.");
          }
        }}
      />
    </div>
  );
}

function Kpi({
  icone,
  rotulo,
  valor,
  destaque,
}: {
  icone: React.ReactNode;
  rotulo: string;
  valor: string;
  destaque?: "warning" | "destructive";
}) {
  return (
    <div className="rounded-md border border-border bg-card p-5">
      <div className="label-industrial flex items-center gap-2">
        {icone}
        {rotulo}
      </div>
      <p
        className={`mt-3 text-3xl font-bold tabular-nums ${
          destaque === "warning"
            ? "text-warning"
            : destaque === "destructive"
              ? "text-destructive"
              : "text-foreground"
        }`}
      >
        {valor}
      </p>
    </div>
  );
}
