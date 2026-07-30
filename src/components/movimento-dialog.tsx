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
import type { Material, Movimento } from "@/lib/materiais";

export function MovimentoDialog({
  material,
  tipo,
  onFechar,
  onConfirmar,
}: {
  material: Material | null;
  tipo: Movimento["tipo"];
  onFechar: () => void;
  onConfirmar: (quantidade: number, observacao: string) => void;
}) {
  const [quantidade, setQuantidade] = useState(1);
  const [observacao, setObservacao] = useState("");

  useEffect(() => {
    if (material) {
      setQuantidade(1);
      setObservacao("");
    }
  }, [material, tipo]);

  return (
    <Dialog open={!!material} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {tipo === "entrada" ? "Registrar entrada" : "Registrar saída"}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {material?.nome} — saldo atual {material?.quantidade} {material?.unidade}
        </p>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="label-industrial">Quantidade</Label>
            <Input
              type="number"
              min={1}
              value={quantidade}
              onChange={(e) => setQuantidade(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="label-industrial">Observação</Label>
            <Textarea
              rows={3}
              value={observacao}
              placeholder="Ordem de serviço, fornecedor, responsável..."
              onChange={(e) => setObservacao(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onFechar}>
            Cancelar
          </Button>
          <Button
            disabled={quantidade <= 0}
            onClick={() => {
              onConfirmar(quantidade, observacao);
              onFechar();
            }}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
