import { useCallback, useEffect, useState } from "react";
import {
  materiaisIniciais,
  STORAGE_KEY,
  uid,
  type Material,
  type Movimento,
} from "@/lib/materiais";

type Estado = { materiais: Material[]; movimentos: Movimento[] };

export function useEstoque() {
  const [estado, setEstado] = useState<Estado>({
    materiais: materiaisIniciais,
    movimentos: [],
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

  const salvarMaterial = useCallback((material: Material) => {
    setEstado((s) => ({
      ...s,
      materiais: s.materiais.some((m) => m.id === material.id)
        ? s.materiais.map((m) => (m.id === material.id ? material : m))
        : [{ ...material }, ...s.materiais],
    }));
  }, []);

  const removerMaterial = useCallback((id: string) => {
    setEstado((s) => ({
      materiais: s.materiais.filter((m) => m.id !== id),
      movimentos: s.movimentos.filter((mv) => mv.materialId !== id),
    }));
  }, []);

  const movimentar = useCallback(
    (materialId: string, tipo: Movimento["tipo"], quantidade: number, observacao: string) => {
      setEstado((s) => ({
        materiais: s.materiais.map((m) =>
          m.id === materialId
            ? {
                ...m,
                quantidade: Math.max(
                  0,
                  tipo === "entrada" ? m.quantidade + quantidade : m.quantidade - quantidade,
                ),
                atualizadoEm: new Date().toISOString(),
              }
            : m,
        ),
        movimentos: [
          { id: uid(), materialId, tipo, quantidade, observacao, data: new Date().toISOString() },
          ...s.movimentos,
        ],
      }));
    },
    [],
  );

  const importar = useCallback((materiais: Material[]) => {
    setEstado((s) => ({ ...s, materiais }));
  }, []);

  return { ...estado, pronto, salvarMaterial, removerMaterial, movimentar, importar };
}
