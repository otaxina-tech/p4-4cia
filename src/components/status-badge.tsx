import { Badge } from "@/components/ui/badge";
import type { StatusItem } from "@/lib/controle";

export function StatusBadge({ status }: { status: StatusItem }) {
  if (status === "VENCIDO") return <Badge variant="destructive">Vencido</Badge>;
  if (status === "A VENCER")
    return (
      <Badge variant="secondary" className="border-warning/40 text-warning">
        A vencer
      </Badge>
    );
  if (status === "VÁLIDO")
    return (
      <Badge variant="outline" className="border-success/40 text-success">
        Válido
      </Badge>
    );
  return (
    <Badge variant="outline" className="text-muted-foreground">
      Sem entrega
    </Badge>
  );
}
