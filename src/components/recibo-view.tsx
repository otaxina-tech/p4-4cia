import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, Printer } from "lucide-react";
import type { Recibo } from "@/hooks/use-recibos";
import { formatarData } from "@/lib/controle";
import { gerarReciboWord } from "@/lib/recibo-word";


function imprimir(r: Recibo) {
  const linhas = r.itens
    .map(
      (i, n) => `<tr>
        <td>${n + 1}</td>
        <td>${i.material}</td>
        <td>${formatarData(i.entrega)}</td>
        <td>${formatarData(i.validade)}</td>
        <td>${i.observacoes ?? ""}</td>
      </tr>`,
    )
    .join("");
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
    <title>Recibo ${r.codigo}</title>
    <style>
      body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:32px}
      header{display:flex;align-items:center;gap:16px;border-bottom:2px solid #111;padding-bottom:12px}
      header img{height:64px}
      h1{font-size:18px;margin:0}
      h2{font-size:14px;margin:2px 0 0;font-weight:normal}
      .num{margin-left:auto;font-size:16px;font-weight:bold}
      table{width:100%;border-collapse:collapse;margin-top:20px;font-size:12px}
      th,td{border:1px solid #666;padding:6px 8px;text-align:left}
      th{background:#eee;text-transform:uppercase;font-size:11px}
      .dados{margin-top:18px;font-size:13px;line-height:1.7}
      .assin{margin-top:64px;display:flex;gap:48px;font-size:12px;text-align:center}
      .assin div{flex:1;border-top:1px solid #111;padding-top:6px}
    </style></head><body>
    <header>
      <img src="/brasao-9bc.png" alt="Brasão 9ºB.C">
      <div><h1>9º B.C — 4ª CIA</h1><h2>Recibo de entrega de material</h2></div>
      <div class="num">RECIBO Nº ${r.codigo}</div>
    </header>
    <div class="dados">
      <strong>Policial:</strong> ${r.posto} · RE ${r.re} · ${r.nome}<br>
      <strong>Data:</strong> ${formatarData(r.data)}<br>
      <strong>Responsável pela entrega:</strong> ${r.responsavel || "—"}
    </div>
    <table>
      <thead><tr><th>#</th><th>Material</th><th>Entrega</th><th>Validade</th><th>Observações</th></tr></thead>
      <tbody>${linhas}</tbody>
    </table>
    ${r.observacoes ? `<p style="font-size:12px;margin-top:14px"><strong>Observações:</strong> ${r.observacoes}</p>` : ""}
    <p style="font-size:12px;margin-top:24px">Declaro ter recebido os materiais acima relacionados, comprometendo-me pela sua guarda e conservação.</p>
    <div class="assin"><div>Assinatura do recebedor</div><div>Assinatura do responsável</div></div>
    </body></html>`;
  const w = window.open("", "_blank", "width=900,height=1000");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
}

export function ReciboView({ recibo, onFechar }: { recibo: Recibo | null; onFechar: () => void }) {
  return (
    <Dialog open={!!recibo} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Recibo nº {recibo?.codigo}</DialogTitle>
        </DialogHeader>
        {recibo && (
          <div className="space-y-4 text-sm">
            <div className="rounded-md border border-border p-4">
              <p className="font-medium">
                {recibo.posto} · RE {recibo.re} · {recibo.nome}
              </p>
              <p className="text-muted-foreground">
                Data: {formatarData(recibo.data)} · Responsável: {recibo.responsavel || "—"}
              </p>
            </div>
            <div className="divide-y divide-border rounded-md border border-border">
              {recibo.itens.map((i) => (
                <div key={i.material} className="flex flex-wrap justify-between gap-2 p-3">
                  <span className="font-medium">{i.material}</span>
                  <span className="text-muted-foreground">
                    Entrega {formatarData(i.entrega)} · Validade {formatarData(i.validade)}
                    {i.observacoes ? ` · ${i.observacoes}` : ""}
                  </span>
                </div>
              ))}
            </div>
            {recibo.observacoes && (
              <p className="text-muted-foreground">Observações: {recibo.observacoes}</p>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={onFechar}>
            Fechar
          </Button>
          <Button onClick={() => recibo && imprimir(recibo)}>
            <Printer /> Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
