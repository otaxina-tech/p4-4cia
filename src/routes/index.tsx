import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import * as XLSX from "xlsx";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  CircleAlert,
  FileSpreadsheet,
  PackageX,
  Pencil,
  Plus,
  Search,
  Trash2,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { MaterialDialog } from "@/components/material-dialog";
import { MovimentoDialog } from "@/components/movimento-dialog";
import { useEstoque } from "@/hooks/use-estoque";
import { linhaParaMaterial, moeda, statusDo, type Material } from "@/lib/materiais";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Controle de Materiais | Estoque e Movimentações" },
      {
        name: "description",
        content:
          "Aplicativo de controle de materiais: consulte, filtre, cadastre e registre entradas e saídas de estoque a partir da sua planilha.",
      },
      { property: "og:title", content: "Controle de Materiais" },
      {
        property: "og:description",
        content:
          "Consulte, cadastre e movimente materiais com alertas de estoque mínimo e importação de planilha.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { materiais, movimentos, salvarMaterial, removerMaterial, movimentar, importar } =
    useEstoque();
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("todas");
  const [status, setStatus] = useState("todos");
  const [editando, setEditando] = useState<Material | null>(null);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [movAlvo, setMovAlvo] = useState<Material | null>(null);
  const [movTipo, setMovTipo] = useState<"entrada" | "saida">("entrada");
  const inputArquivo = useRef<HTMLInputElement>(null);

  const categorias = useMemo(
    () => Array.from(new Set(materiais.map((m) => m.categoria).filter(Boolean))).sort(),
    [materiais],
  );

  const filtrados = useMemo(
    () =>
      materiais.filter((m) => {
        const alvo = `${m.codigo} ${m.nome} ${m.categoria} ${m.localizacao}`.toLowerCase();
        if (busca && !alvo.includes(busca.toLowerCase())) return false;
        if (categoria !== "todas" && m.categoria !== categoria) return false;
        if (status !== "todos" && statusDo(m) !== status) return false;
        return true;
      }),
    [materiais, busca, categoria, status],
  );

  const totalItens = materiais.reduce((s, m) => s + m.quantidade, 0);
  const valorTotal = materiais.reduce((s, m) => s + m.quantidade * m.precoUnitario, 0);
  const abaixoMinimo = materiais.filter((m) => statusDo(m) === "baixo").length;
  const zerados = materiais.filter((m) => statusDo(m) === "zerado").length;

  async function aoImportar(file: File) {
    try {
      const wb = XLSX.read(await file.arrayBuffer());
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
        wb.Sheets[wb.SheetNames[0]],
      );
      const novos = rows.map(linhaParaMaterial).filter(Boolean) as Material[];
      if (!novos.length) {
        toast.error("Nenhuma linha reconhecida na planilha.");
        return;
      }
      importar(novos);
      toast.success(`${novos.length} materiais importados da planilha.`);
    } catch {
      toast.error("Não foi possível ler o arquivo.");
    }
  }

  return (
    <div className="min-h-screen">
      <Toaster />
      <header className="border-b border-border bg-card/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-sm bg-primary text-primary-foreground">
              <Boxes className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-none">Controle de Materiais</h1>
              <p className="label-industrial mt-1">Almoxarifado · Estoque operacional</p>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              ref={inputArquivo}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void aoImportar(f);
                e.target.value = "";
              }}
            />
            <Button variant="outline" onClick={() => inputArquivo.current?.click()}>
              <FileSpreadsheet /> Importar planilha
            </Button>
            <Button
              onClick={() => {
                setEditando(null);
                setDialogAberto(true);
              }}
            >
              <Plus /> Novo material
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi icone={<Boxes className="size-4" />} rotulo="Itens em estoque" valor={totalItens.toLocaleString("pt-BR")} />
          <Kpi icone={<Wallet className="size-4" />} rotulo="Valor total" valor={moeda(valorTotal)} />
          <Kpi
            icone={<CircleAlert className="size-4" />}
            rotulo="Abaixo do mínimo"
            valor={String(abaixoMinimo)}
            destaque="warning"
          />
          <Kpi
            icone={<PackageX className="size-4" />}
            rotulo="Zerados"
            valor={String(zerados)}
            destaque="destructive"
          />
        </section>

        <section className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-64 flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar por código, nome, categoria ou local..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <Select value={categoria} onValueChange={setCategoria}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as categorias</SelectItem>
              {categorias.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="ok">Normal</SelectItem>
              <SelectItem value="baixo">Abaixo do mínimo</SelectItem>
              <SelectItem value="zerado">Zerado</SelectItem>
            </SelectContent>
          </Select>
        </section>

        <section className="overflow-hidden rounded-md border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="label-industrial">Código</TableHead>
                <TableHead className="label-industrial">Material</TableHead>
                <TableHead className="label-industrial">Categoria</TableHead>
                <TableHead className="label-industrial">Local</TableHead>
                <TableHead className="label-industrial text-right">Saldo</TableHead>
                <TableHead className="label-industrial text-right">Mínimo</TableHead>
                <TableHead className="label-industrial text-right">Valor</TableHead>
                <TableHead className="label-industrial">Status</TableHead>
                <TableHead className="label-industrial text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map((m) => {
                const s = statusDo(m);
                return (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {m.codigo}
                    </TableCell>
                    <TableCell className="font-medium">{m.nome}</TableCell>
                    <TableCell className="text-muted-foreground">{m.categoria}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {m.localizacao}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {m.quantidade} <span className="text-muted-foreground">{m.unidade}</span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {m.minimo}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {moeda(m.quantidade * m.precoUnitario)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={s === "ok" ? "outline" : s === "baixo" ? "secondary" : "destructive"}
                        className={
                          s === "baixo" ? "border-warning/40 text-warning" : undefined
                        }
                      >
                        {s === "ok" ? "Normal" : s === "baixo" ? "Baixo" : "Zerado"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Entrada"
                          onClick={() => {
                            setMovTipo("entrada");
                            setMovAlvo(m);
                          }}
                        >
                          <ArrowDownToLine className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Saída"
                          onClick={() => {
                            setMovTipo("saida");
                            setMovAlvo(m);
                          }}
                        >
                          <ArrowUpFromLine className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Editar"
                          onClick={() => {
                            setEditando(m);
                            setDialogAberto(true);
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Excluir"
                          onClick={() => {
                            removerMaterial(m.id);
                            toast.success("Material excluído.");
                          }}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!filtrados.length && (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                    Nenhum material encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </section>

        <section className="rounded-md border border-border bg-card p-5">
          <h2 className="text-sm font-bold">Últimas movimentações</h2>
          <ul className="mt-4 space-y-2">
            {movimentos.slice(0, 8).map((mv) => {
              const mat = materiais.find((m) => m.id === mv.materialId);
              return (
                <li
                  key={mv.id}
                  className="flex items-center justify-between border-b border-border/60 pb-2 text-sm last:border-0"
                >
                  <span className="flex items-center gap-2">
                    {mv.tipo === "entrada" ? (
                      <ArrowDownToLine className="size-4 text-success" />
                    ) : (
                      <ArrowUpFromLine className="size-4 text-destructive" />
                    )}
                    <span className="font-medium">{mat?.nome ?? "Material removido"}</span>
                    <span className="text-muted-foreground">
                      {mv.tipo === "entrada" ? "+" : "−"}
                      {mv.quantidade} {mat?.unidade}
                    </span>
                    {mv.observacao && (
                      <span className="text-muted-foreground">· {mv.observacao}</span>
                    )}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {new Date(mv.data).toLocaleString("pt-BR")}
                  </span>
                </li>
              );
            })}
            {!movimentos.length && (
              <li className="text-sm text-muted-foreground">
                Nenhuma movimentação registrada ainda.
              </li>
            )}
          </ul>
        </section>
      </main>

      <MaterialDialog
        aberto={dialogAberto}
        material={editando}
        onFechar={() => setDialogAberto(false)}
        onSalvar={(m) => {
          salvarMaterial(m);
          toast.success("Material salvo.");
        }}
      />
      <MovimentoDialog
        material={movAlvo}
        tipo={movTipo}
        onFechar={() => setMovAlvo(null)}
        onConfirmar={(q, obs) => {
          if (movAlvo) {
            movimentar(movAlvo.id, movTipo, q, obs);
            toast.success(movTipo === "entrada" ? "Entrada registrada." : "Saída registrada.");
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
