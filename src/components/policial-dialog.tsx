import { useState } from "react";
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

export function PolicialDialog({
  aberto,
  onFechar,
  onSalvar,
}: {
  aberto: boolean;
  onFechar: () => void;
  onSalvar: (dados: { re: string; nome: string; posto: string }) => void;
}) {
  const [re, setRe] = useState("");
  const [nome, setNome] = useState("");
  const [posto, setPosto] = useState("SD PM");

  function fechar() {
    setRe("");
    setNome("");
    setPosto("SD PM");
    onFechar();
  }

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && fechar()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar policial</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="label-industrial">Posto / Graduação</Label>
            <Input value={posto} onChange={(e) => setPosto(e.target.value)} placeholder="SD PM" />
          </div>
          <div className="space-y-1.5">
            <Label className="label-industrial">RE</Label>
            <Input value={re} onChange={(e) => setRe(e.target.value)} placeholder="000000-0" />
          </div>
          <div className="space-y-1.5">
            <Label className="label-industrial">Nome</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={fechar}>
            Cancelar
          </Button>
          <Button
            disabled={!re.trim() || !nome.trim()}
            onClick={() => {
              onSalvar({
                re: re.trim(),
                nome: nome.trim().toUpperCase(),
                posto: posto.trim().toUpperCase(),
              });
              fechar();
            }}
          >
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
