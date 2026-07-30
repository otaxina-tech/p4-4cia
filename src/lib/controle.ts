import efetivo from "@/data/efetivo.json";

export const MATERIAIS = [
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

export type MaterialTipo = (typeof MATERIAIS)[number];

export type Entrega = {
  entrega: string; // ISO date
  validade: string; // ISO date
  observacoes?: string;
  responsavel?: string;
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
};

export type StatusItem = "VÁLIDO" | "A VENCER" | "VENCIDO" | "SEM ENTREGA";

export const STORAGE_KEY = "controle-materiais-pm-v1";

export const uid = () => Math.random().toString(36).slice(2, 10);

export const efetivoInicial: Policial[] = (
  efetivo as { posto: string; re: string; nome: string }[]
).map((p) => ({ id: p.re || uid(), posto: p.posto, re: p.re, nome: p.nome, itens: {} }));

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
  const status = MATERIAIS.map((m) => statusDe(p.itens[m]?.validade)).filter(
    (s) => s !== "SEM ENTREGA",
  );
  if (!status.length) return "SEM ENTREGA";
  if (status.includes("VENCIDO")) return "VENCIDO";
  if (status.includes("A VENCER")) return "A VENCER";
  return "VÁLIDO";
}

export const formatarData = (iso?: string) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR") : "—";
