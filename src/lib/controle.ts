export const MATERIAIS_PADRAO = [
  "Fardamento",
  "Bota",
  "Boina",
  "Cinturão",
  "Coldre",
  "Japona",
  "Fiel",
  "Adicional 1",
  "Adicional 2",
] as const;

/** Os tipos de material são cadastráveis, por isso o tipo é aberto. */
export type MaterialTipo = string;

export type Entrega = {
  entrega: string; // ISO date
  validade: string; // ISO date
  observacoes?: string;
  responsavel?: string;
  recibo?: string;
};

export type Policial = {
  id: string;
  posto: string;
  re: string;
  nome: string;
  itens: Partial<Record<MaterialTipo, Entrega>>;
};

export type Registro = {
  id: string;
  data: string;
  re: string;
  nome: string;
  material: MaterialTipo;
  entrega: string;
  validade: string;
  observacoes: string;
  responsavel: string;
  recibo: string;
};

export type StatusItem = "VÁLIDO" | "A VENCER" | "VENCIDO" | "SEM ENTREGA";

export const uid = () => Math.random().toString(36).slice(2, 10);

export function diasRestantes(validade?: string): number | null {
  if (!validade) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const alvo = new Date(`${validade}T00:00:00`);
  return Math.round((alvo.getTime() - hoje.getTime()) / 86_400_000);
}

export function statusDe(validade?: string): StatusItem {
  const d = diasRestantes(validade);
  if (d === null) return "SEM ENTREGA";
  if (d < 0) return "VENCIDO";
  if (d <= 30) return "A VENCER";
  return "VÁLIDO";
}

export function statusPolicial(p: Policial): StatusItem {
  const status = Object.values(p.itens)
    .filter(Boolean)
    .map((i) => statusDe(i?.validade))
    .filter((s) => s !== "SEM ENTREGA");
  if (!status.length) return "SEM ENTREGA";
  if (status.includes("VENCIDO")) return "VENCIDO";
  if (status.includes("A VENCER")) return "A VENCER";
  return "VÁLIDO";
}

export const formatarData = (iso?: string) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR") : "—";

/** Hierarquia militar (do mais alto para o mais baixo). */
const HIERARQUIA = [
  "CEL", "TEN CEL", "MAJ", "CAP", "1° TEN", "1º TEN", "2° TEN", "2º TEN",
  "ASP", "SUB TEN", "ST", "1° SGT", "1º SGT", "2° SGT", "2º SGT",
  "3° SGT", "3º SGT", "CB", "SD",
];

/** Índice do posto na hierarquia militar; postos desconhecidos vão para o fim. */
export function ordemPosto(posto?: string): number {
  const alvo = (posto ?? "").toUpperCase().replace(/\s*PM\s*$/, "").trim();
  const i = HIERARQUIA.findIndex((h) => h === alvo);
  return i === -1 ? HIERARQUIA.length : i;
}

export const ORDEM_STATUS: Record<StatusItem, number> = {
  VENCIDO: 0,
  "A VENCER": 1,
  "VÁLIDO": 2,
  "SEM ENTREGA": 3,
};
