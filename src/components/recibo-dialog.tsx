import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ItemRecibo } from "@/hooks/use-recibos";
import { ordemPosto, type MaterialTipo, type Policial } from "@/lib/controle";

const hoje = () => new Date().toISOString().slice(0, 10);
const somaAnos = (iso: string, anos: number) => {
  const d = new Date(`${iso}T00:00:00`);
  d.setFullYear(d.getFullYear() + anos);
  return d.toISOString().slice(0, 10);
};

type Linha = { marcado: boolean; entrega: string; validade: string; observacoes: string };

export function ReciboDialog({
  aberto,
  policiais,
  materiais,
  policialInicial,
  onFechar,
  onSalvar,
}: {
  aberto: boolean;
  policiais: Policial[];
  materiais: MaterialTipo[];
  policialInicial?: string;
  onFechar: () => void;
  onSalvar: (v: {
    policial: Policial;
    itens: ItemRecibo[];
    data: string;
    responsavel: string;
    observacoes: string;
  }) => Promise<unknown>;
}) {
  const ordenados = useMemo(
    () =>
      [...policiais].sort(
        (a, b) => ordemPosto(a.posto) - ordemPosto(b.posto) || a.nome.localeCompare(b.nome, "pt-BR"),
      ),
    [policiais],
  );

  const [re, setRe] = useState(policialInicial ?? "");
  const [data, setData] = useState(hoje());
  const [responsavel, setResponsavel] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [linhas, setLinhas] = useState<Record<string, Linha>>({});
  const [salvando, setSalvando] = useState(false);

  const policial = ordenados.find((p) => p.re === re) ?? null;

  useEffect(() => {
    if (!aberto) return;
    setRe(policialInicial ?? "");
    setData(hoje());
    setResponsavel("");
    setObservacoes("");
  }, [aberto, policialInicial]);

  useEffect(() => {
    const base: Record<string, Linha> = {};
    for (const m of materiais) {
      const item = policial?.itens[m];
      base[m] = {
        marcado: false,
        entrega: item?.entrega ?? hoje(),
        validade: item?.validade ?? somaAnos(hoje(), 1),
        observacoes: item?.observacoes ?? "",
      };
    }
    setLinhas(base);
  }, [policial, materiais]);

  const selecionados = materiais.filter((m) => linhas[m]?.marcado);

  async function salvar() {
    if (!policial || !selecionados.length) return;
    setSalvando(true);
    try {
      await onSalvar({
        policial,
        data,
        responsavel,
        observacoes,
        itens: selecionados.map((m) => ({
          material: m,
          entrega: linhas[m].entrega,
          validade: linhas[m].validade,
          observacoes: linhas[m].observacoes,
        })),
      });
      onFechar();
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Emitir recibo de entrega</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          O número é gerado automaticamente na sequência, no padrão{" "}
          <span className="font-mono text-foreground">000/440/26</span>.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-1.5">
            <Label className="label-industrial">Policial designado</Label>
            <Select value={re} onValueChange={setRe}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o policial" />
              </SelectTrigger>
              <SelectContent>
                {ordenados.map((p) => (
                  <SelectItem key={p.id} value={p.re}>
                    {p.posto} · RE {p.re} · {p.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="label-industrial">Data do recibo</Label>
            <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="label-industrial">Responsável pela entrega</Label>
            <Input value={responsavel} onChange={(e) => setResponsavel(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="label-industrial">Itens do recibo</Label>
          <div className="divide-y divide-border rounded-md border border-border">
            {materiais.map((m) => {
              const l = linhas[m];
              if (!l) return null;
              return (
                <div key={m} className="space-y-2 p-3">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <Checkbox
                      checked={l.marcado}
                      onCheckedChange={(v) =>
                        setLinhas((s) => ({ ...s, [m]: { ...s[m], marcado: !!v } }))
                      }
                    />
                    {m}
                  </label>
                  {l.marcado && (
                    <div className="grid gap-2 pl-6 sm:grid-cols-3">
                      <Input
                        type="date"
                        value={l.entrega}
                        onChange={(e) =>
                          setLinhas((s) => ({
                            ...s,
                            [m]: {
                              ...s[m],
                              entrega: e.target.value,
                              validade: e.target.value
                                ? somaAnos(e.target.value, 1)
                                : s[m].validade,
                            },
                          }))
                        }
                      />
                      <Input
                        type="date"
                        value={l.validade}
                        onChange={(e) =>
                          setLinhas((s) => ({ ...s, [m]: { ...s[m], validade: e.target.value } }))
                        }
                      />
                      <Input
                        placeholder="Observações"
                        value={l.observacoes}
                        onChange={(e) =>
                          setLinhas((s) => ({ ...s, [m]: { ...s[m], observacoes: e.target.value } }))
                        }
                      />
                    </div>
                  )}
                </div>
              );
            })}
            {!materiais.length && (
              <p className="p-4 text-sm text-muted-foreground">Nenhum material cadastrado.</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="label-industrial">Observações gerais</Label>
          <Textarea rows={2} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onFechar}>
            Cancelar
          </Button>
          <Button disabled={!policial || !selecionados.length || salvando} onClick={salvar}>
            Emitir recibo ({selecionados.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
