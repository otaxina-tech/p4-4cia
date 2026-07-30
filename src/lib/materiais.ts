export type Material = {
  id: string;
  codigo: string;
  nome: string;
  categoria: string;
  unidade: string;
  quantidade: number;
  minimo: number;
  localizacao: string;
  precoUnitario: number;
  atualizadoEm: string;
};

export type Movimento = {
  id: string;
  materialId: string;
  tipo: "entrada" | "saida";
  quantidade: number;
  observacao: string;
  data: string;
};

export const STORAGE_KEY = "controle-materiais-v1";

const now = () => new Date().toISOString();

export const uid = () => Math.random().toString(36).slice(2, 10);

export const materiaisIniciais: Material[] = [
  {
    id: uid(),
    codigo: "MT-1001",
    nome: "Parafuso sextavado M8",
    categoria: "Fixadores",
    unidade: "un",
    quantidade: 420,
    minimo: 200,
    localizacao: "A-01",
    precoUnitario: 0.85,
    atualizadoEm: now(),
  },
  {
    id: uid(),
    codigo: "MT-1002",
    nome: "Chapa de aço 2mm",
    categoria: "Metais",
    unidade: "m²",
    quantidade: 18,
    minimo: 25,
    localizacao: "B-04",
    precoUnitario: 92.4,
    atualizadoEm: now(),
  },
  {
    id: uid(),
    codigo: "MT-1003",
    nome: "Cabo flexível 2,5mm",
    categoria: "Elétrica",
    unidade: "m",
    quantidade: 340,
    minimo: 150,
    localizacao: "C-02",
    precoUnitario: 3.1,
    atualizadoEm: now(),
  },
  {
    id: uid(),
    codigo: "MT-1004",
    nome: "Disco de corte 7\"",
    categoria: "Consumíveis",
    unidade: "un",
    quantidade: 12,
    minimo: 30,
    localizacao: "D-07",
    precoUnitario: 14.9,
    atualizadoEm: now(),
  },
  {
    id: uid(),
    codigo: "MT-1005",
    nome: "Luva de segurança",
    categoria: "EPI",
    unidade: "par",
    quantidade: 0,
    minimo: 20,
    localizacao: "E-01",
    precoUnitario: 11.5,
    atualizadoEm: now(),
  },
  {
    id: uid(),
    codigo: "MT-1006",
    nome: "Tinta esmalte cinza",
    categoria: "Químicos",
    unidade: "L",
    quantidade: 64,
    minimo: 20,
    localizacao: "F-03",
    precoUnitario: 38.0,
    atualizadoEm: now(),
  },
];

export type Status = "ok" | "baixo" | "zerado";

export function statusDo(m: Material): Status {
  if (m.quantidade <= 0) return "zerado";
  if (m.quantidade <= m.minimo) return "baixo";
  return "ok";
}

export const moeda = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const num = (v: unknown) => {
  if (typeof v === "number") return v;
  const parsed = Number(String(v ?? "").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
};

const pick = (row: Record<string, unknown>, keys: string[]) => {
  const entries = Object.entries(row);
  for (const key of keys) {
    const hit = entries.find(
      ([k]) =>
        k
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim() === key,
    );
    if (hit) return hit[1];
  }
  return undefined;
};

export function linhaParaMaterial(row: Record<string, unknown>): Material | null {
  const nome = String(pick(row, ["nome", "material", "descricao", "produto"]) ?? "").trim();
  if (!nome) return null;
  return {
    id: uid(),
    codigo: String(pick(row, ["codigo", "cod", "sku", "referencia"]) ?? "").trim() || "—",
    nome,
    categoria: String(pick(row, ["categoria", "grupo", "tipo"]) ?? "Geral").trim() || "Geral",
    unidade: String(pick(row, ["unidade", "un", "medida"]) ?? "un").trim() || "un",
    quantidade: num(pick(row, ["quantidade", "qtd", "estoque", "saldo"])),
    minimo: num(pick(row, ["minimo", "estoque minimo", "qtd minima", "min"])),
    localizacao: String(pick(row, ["localizacao", "local", "prateleira", "endereco"]) ?? "—").trim() || "—",
    precoUnitario: num(pick(row, ["preco unitario", "preco", "valor unitario", "valor", "custo"])),
    atualizadoEm: now(),
  };
}
