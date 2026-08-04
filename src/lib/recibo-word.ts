import JSZip from "jszip";
import type { Recibo } from "@/hooks/use-recibos";

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function porExtenso(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

const esc = (t: string) =>
  t
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Parágrafo com o mesmo recuo/entrelinha do corpo do modelo. */
function paragrafo(texto: string) {
  return `<w:p><w:pPr><w:pStyle w:val="Normal"/><w:spacing w:lineRule="auto" w:line="360"/><w:ind w:left="317" w:right="742"/><w:rPr><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">${esc(texto)}</w:t></w:r></w:p>`;
}

/**
 * Gera o recibo em Word a partir do modelo oficial (public/modelo-recibo.docx),
 * preservando integralmente formatação, espaçamentos, imagens e rodapé.
 */
export async function gerarReciboWord(r: Recibo) {
  const res = await fetch("/modelo-recibo.docx");
  if (!res.ok) throw new Error("Modelo de recibo não encontrado");
  const zip = await JSZip.loadAsync(await res.arrayBuffer());
  const arquivo = zip.file("word/document.xml");
  if (!arquivo) throw new Error("Modelo de recibo inválido");
  let xml = await arquivo.async("string");

  // --- lista de itens: clona o parágrafo modelo marcado com {{ITEM}} ---
  const marca = xml.indexOf("{{ITEM}}");
  const ini = xml.lastIndexOf("<w:p>", marca);
  const fim = xml.indexOf("</w:p>", marca) + "</w:p>".length;
  const modeloItem = xml.slice(ini, fim);

  const itens = r.itens.length ? r.itens : [{ material: "—", observacoes: "" } as never];
  const blocoItens = itens
    .map((i, n) => {
      const texto = `${i.material}${i.observacoes ? `, ${i.observacoes}` : ""}${
        n === itens.length - 1 ? "." : ";"
      }`;
      return modeloItem.replace("{{ITEM}}", esc(texto));
    })
    .join("");

  const obs = r.observacoes ? paragrafo(r.observacoes) : "";
  xml = xml.slice(0, ini) + blocoItens + obs + xml.slice(fim);

  const campos: Record<string, string> = {
    "{{CODIGO}}": r.codigo,
    "{{POLICIAL}}": `${r.posto} ${r.re} ${r.nome}`,
    "{{DATA}}": porExtenso(r.data),
    "{{ENTREGUE}}": r.responsavel || "",
    "{{RE_ENT}}": "",
    "{{FUNCAO_ENT}}": "",
    "{{RECEBIDO}}": `${r.posto} ${r.nome}`,
    "{{RE_REC}}": r.re,
    "{{FUNCAO_REC}}": "",
  };
  for (const [k, v] of Object.entries(campos)) xml = xml.split(k).join(esc(v));

  zip.file("word/document.xml", xml);
  const blob = await zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Recibo ${r.codigo.replace(/\//g, "-")} - ${r.nome}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}
