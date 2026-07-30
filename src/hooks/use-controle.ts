import { useCallback, useEffect, useState } from "react";
import {
  efetivoInicial,
  STORAGE_KEY,
  uid,
  type Entrega,
  type MaterialTipo,
  type Policial,
  type Registro,
} from "@/lib/controle";

type Estado = { policiais: Policial[]; historico: Registro[] };

export function useControle() {
  const [estado, setEstado] = useState<Estado>({
    policiais: efetivoInicial,
    historico: [],
  });
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setEstado(JSON.parse(raw) as Estado);
    } catch {
      /* ignora dados inválidos */
    }
    setPronto(true);
  }, []);

  useEffect(() => {
    if (pronto) localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
  }, [estado, pronto]);

  const registrarEntrega = useCallback(
    (policialId: string, material: MaterialTipo, dados: Entrega) => {
      setEstado((s) => {
        const alvo = s.policiais.find((p) => p.id === policialId);
        if (!alvo) return s;
        return {
          policiais: s.policiais.map((p) =>
            p.id === policialId ? { ...p, itens: { ...p.itens, [material]: dados } } : p,
          ),
          historico: [
            {
              id: uid(),
              data: new Date().toISOString(),
              re: alvo.re,
              nome: alvo.nome,
              material,
              entrega: dados.entrega,
              validade: dados.validade,
              observacoes: dados.observacoes ?? "",
              responsavel: dados.responsavel ?? "",
            },
            ...s.historico,
          ],
        };
      });
    },
    [],
  );

  const removerEntrega = useCallback((policialId: string, material: MaterialTipo) => {
    setEstado((s) => ({
      ...s,
      policiais: s.policiais.map((p) => {
        if (p.id !== policialId) return p;
        const itens = { ...p.itens };
        delete itens[material];
        return { ...p, itens };
      }),
    }));
  }, []);

  const salvarPolicial = useCallback((policial: Policial) => {
    setEstado((s) => ({
      ...s,
      policiais: s.policiais.some((p) => p.id === policial.id)
        ? s.policiais.map((p) => (p.id === policial.id ? { ...p, ...policial } : p))
        : [policial, ...s.policiais],
    }));
  }, []);

  const removerPolicial = useCallback((id: string) => {
    setEstado((s) => ({ ...s, policiais: s.policiais.filter((p) => p.id !== id) }));
  }, []);

  const importarEfetivo = useCallback((policiais: Policial[]) => {
    setEstado((s) => ({ ...s, policiais }));
  }, []);

  return {
    ...estado,
    pronto,
    registrarEntrega,
    removerEntrega,
    salvarPolicial,
    removerPolicial,
    importarEfetivo,
  };
}
