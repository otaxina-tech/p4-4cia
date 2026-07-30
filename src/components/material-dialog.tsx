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
import { uid, type Material } from "@/lib/materiais";

const vazio = (): Material => ({
  id: uid(),
  codigo: "",
  nome: "",
  categoria: "",
  unidade: "un",
  quantidade: 0,
  minimo: 0,
  localizacao: "",
  precoUnitario: 0,
  atualizadoEm: new Date().toISOString(),
});

export function MaterialDialog({
  aberto,
  material,
  onFechar,
  onSalvar,
}: {
  aberto: boolean;
  material: Material | null;
  onFechar: () => void;
  onSalvar: (m: Material) => void;
}) {
  const [form, setForm] = useState<Material>(material ?? vazio());

  useEffect(() => {
    if (aberto) setForm(material ?? vazio());
  }, [aberto, material]);

  const campo = (k: keyof Material, valor: string | number) =>
    setForm((f) => ({ ...f, [k]: valor }));

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{material ? "Editar material" : "Novo material"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-1 space-y-1.5">
            <Label className="label-industrial">Código</Label>
            <Input value={form.codigo} onChange={(e) => campo("codigo", e.target.value)} />
          </div>
          <div className="col-span-1 space-y-1.5">
            <Label className="label-industrial">Categoria</Label>
            <Input value={form.categoria} onChange={(e) => campo("categoria", e.target.value)} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label className="label-industrial">Nome do material</Label>
            <Input value={form.nome} onChange={(e) => campo("nome", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="label-industrial">Quantidade</Label>
            <Input
              type="number"
              value={form.quantidade}
              onChange={(e) => campo("quantidade", Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="label-industrial">Estoque mínimo</Label>
            <Input
              type="number"
              value={form.minimo}
              onChange={(e) => campo("minimo", Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="label-industrial">Unidade</Label>
            <Input value={form.unidade} onChange={(e) => campo("unidade", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="label-industrial">Localização</Label>
            <Input
              value={form.localizacao}
              onChange={(e) => campo("localizacao", e.target.value)}
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label className="label-industrial">Preço unitário (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={form.precoUnitario}
              onChange={(e) => campo("precoUnitario", Number(e.target.value))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onFechar}>
            Cancelar
          </Button>
          <Button
            disabled={!form.nome.trim()}
            onClick={() => {
              onSalvar({ ...form, atualizadoEm: new Date().toISOString() });
              onFechar();
            }}
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
