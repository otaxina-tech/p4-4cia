import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  diasRestantes,
  formatarData,
  MATERIAIS,
  statusDe,
  type MaterialTipo,
  type Policial,
} from "@/lib/controle";
import { StatusBadge } from "@/components/status-badge";

export function FichaDialog({
  policial,
  podeEditar,
  onFechar,
  onRegistrar,
  onRemover,
}: {
  policial: Policial | null;
  podeEditar: boolean;
  onFechar: () => void;
  onRegistrar: (material: MaterialTipo) => void;
  onRemover: (material: MaterialTipo) => void;
}) {
  return (
    <Dialog open={!!policial} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ficha individual de controle de materiais</DialogTitle>
        </DialogHeader>
        {policial && (
          <>
            <div className="grid grid-cols-3 gap-4 rounded-md border border-border bg-background/50 p-4">
              <Info rotulo="Posto/Graduação" valor={policial.posto} />
              <Info rotulo="RE" valor={policial.re} />
              <Info rotulo="Nome" valor={policial.nome} />
            </div>
            <ul className="space-y-2">
              {MATERIAIS.map((m) => {
                const item = policial.itens[m];
                const dias = diasRestantes(item?.validade);
                return (
                  <li
                    key={m}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3"
                  >
                    <div className="min-w-40">
                      <p className="font-medium">{m}</p>
                      <p className="text-xs text-muted-foreground">
                        Entrega {formatarData(item?.entrega)} · Validade{" "}
                        {formatarData(item?.validade)}
                        {item?.responsavel ? ` · Resp. ${item.responsavel}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {dias !== null && (
                        <Badge variant="outline" className="font-mono">
                          {dias} dias
                        </Badge>
                      )}
                      <StatusBadge status={statusDe(item?.validade)} />
                      {podeEditar && (
                        <>
                          <Button size="sm" variant="secondary" onClick={() => onRegistrar(m)}>
                            {item ? "Atualizar" : "Registrar"}
                          </Button>
                          {item && (
                            <Button size="sm" variant="ghost" onClick={() => onRemover(m)}>
                              Limpar
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Info({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <p className="label-industrial">{rotulo}</p>
      <p className="mt-1 font-medium">{valor}</p>
    </div>
  );
}
