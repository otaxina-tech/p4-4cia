import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type Entrega, type MaterialTipo, type Policial } from "@/lib/controle";

const hoje = () => new Date().toISOString().slice(0, 10);
const somaAnos = (iso: string, anos: number) => {
  const d = new Date(`${iso}T00:00:00`);
  d.setFullYear(d.getFullYear() + anos);
  return d.toISOString().slice(0, 10);
};

export function EntregaDialog({
  policial,
  materiais,
  materialInicial,
  onFechar,
  onSalvar,
}: {
  policial: Policial | null;
  materiais: MaterialTipo[];
  materialInicial?: MaterialTipo;
  onFechar: () => void;
  onSalvar: (material: MaterialTipo, dados: Entrega) => void;
}) {
  const [material, setMaterial] = useState<MaterialTipo>(materialInicial ?? materiais[0] ?? "");
  const [entrega, setEntrega] = useState(hoje());
  const [validade, setValidade] = useState(somaAnos(hoje(), 1));
  const [observacoes, setObservacoes] = useState("");
  const [responsavel, setResponsavel] = useState("");

  useEffect(() => {
    if (!policial) return;
    const atual = materialInicial ?? materiais[0] ?? "";
    const existente = policial.itens[atual];
    setMaterial(atual);
    setEntrega(existente?.entrega ?? hoje());
    setValidade(existente?.validade ?? somaAnos(hoje(), 1));
    setObservacoes(existente?.observacoes ?? "");
    setResponsavel(existente?.responsavel ?? "");
  }, [policial, materialInicial, materiais]);

  return (
    <Dialog open={!!policial} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar entrega de material</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {policial?.posto} · RE {policial?.re} · {policial?.nome}
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-1.5">
            <Label className="label-industrial">Material</Label>
            <Select value={material} onValueChange={(v) => setMaterial(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o material" />
              </SelectTrigger>
              <SelectContent>
                {materiais.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="label-industrial">Data de entrega</Label>
            <Input
              type="date"
              value={entrega}
              onChange={(e) => {
                setEntrega(e.target.value);
                if (e.target.value) setValidade(somaAnos(e.target.value, 1));
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="label-industrial">Validade</Label>
            <Input type="date" value={validade} onChange={(e) => setValidade(e.target.value)} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label className="label-industrial">Responsável</Label>
            <Input value={responsavel} onChange={(e) => setResponsavel(e.target.value)} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label className="label-industrial">Observações</Label>
            <Textarea
              rows={3}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onFechar}>
            Cancelar
          </Button>
          <Button
            disabled={!material || !entrega || !validade}
            onClick={() => {
              onSalvar(material, { entrega, validade, observacoes, responsavel });
              onFechar();
            }}
          >
            Salvar entrega
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
