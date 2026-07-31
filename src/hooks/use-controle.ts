import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCadastros } from "@/hooks/use-cadastros";
import { type Entrega, type MaterialTipo, type Policial, type Registro } from "@/lib/controle";

type LinhaEntrega = {
  id: string;
  re: string;
  nome: string;
  posto: string;
  material: string;
  entrega: string;
  validade: string;
  responsavel: string;
  observacoes: string;
  recibo: string;
};

async function buscarEntregas(): Promise<LinhaEntrega[]> {
  const { data, error } = await supabase
    .from("entregas")
    .select("id, re, nome, posto, material, entrega, validade, responsavel, observacoes, recibo");
  if (error) throw error;
  return (data ?? []) as LinhaEntrega[];
}

async function buscarHistorico(): Promise<Registro[]> {
  const { data, error } = await supabase
    .from("historico")
    .select("id, data, re, nome, material, entrega, validade, responsavel, observacoes, recibo")
    .order("data", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as unknown as Registro[];
}

export function useControle() {
  const queryClient = useQueryClient();
  const cadastros = useCadastros();
  const { policiaisCadastro, materiais } = cadastros;

  const entregasQuery = useQuery({ queryKey: ["entregas"], queryFn: buscarEntregas });
  const historicoQuery = useQuery({ queryKey: ["historico"], queryFn: buscarHistorico });

  const policiais = useMemo<Policial[]>(() => {
    const linhas = entregasQuery.data ?? [];
    const validos = new Set(materiais);
    return policiaisCadastro.map((p) => {
      const itens: Partial<Record<MaterialTipo, Entrega>> = {};
      for (const l of linhas.filter((l) => l.re === p.re)) {
        if (!validos.has(l.material)) continue;
        itens[l.material] = {
          entrega: l.entrega,
          validade: l.validade,
          responsavel: l.responsavel,
          observacoes: l.observacoes,
          recibo: l.recibo,
        };
      }
      return { id: p.id, posto: p.posto, re: p.re, nome: p.nome, itens };
    });
  }, [entregasQuery.data, policiaisCadastro, materiais]);

  const invalidar = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["entregas"] });
    queryClient.invalidateQueries({ queryKey: ["historico"] });
  }, [queryClient]);

  const registrar = useMutation({
    mutationFn: async ({
      policial,
      material,
      dados,
    }: {
      policial: Policial;
      material: MaterialTipo;
      dados: Entrega;
    }) => {
      const linha = {
        re: policial.re,
        nome: policial.nome,
        posto: policial.posto,
        material,
        entrega: dados.entrega,
        validade: dados.validade,
        responsavel: dados.responsavel ?? "",
        observacoes: dados.observacoes ?? "",
        recibo: dados.recibo ?? "",
      };
      const { error } = await supabase.from("entregas").upsert(linha, { onConflict: "re,material" });
      if (error) throw error;
      const { error: erroHist } = await supabase.from("historico").insert({
        re: linha.re,
        nome: linha.nome,
        material: linha.material,
        entrega: linha.entrega,
        validade: linha.validade,
        responsavel: linha.responsavel,
        observacoes: linha.observacoes,
        recibo: linha.recibo,
      });
      if (erroHist) throw erroHist;
    },
    onSuccess: invalidar,
  });

  const remover = useMutation({
    mutationFn: async ({ re, material }: { re: string; material: MaterialTipo }) => {
      const { error } = await supabase
        .from("entregas")
        .delete()
        .eq("re", re)
        .eq("material", material);
      if (error) throw error;
    },
    onSuccess: invalidar,
  });

  const registrarEntrega = useCallback(
    (policial: Policial, material: MaterialTipo, dados: Entrega) =>
      registrar.mutateAsync({ policial, material, dados }),
    [registrar],
  );

  const removerEntrega = useCallback(
    (re: string, material: MaterialTipo) => remover.mutateAsync({ re, material }),
    [remover],
  );

  return {
    policiais,
    materiais,
    historico: historicoQuery.data ?? [],
    carregando: entregasQuery.isLoading || historicoQuery.isLoading || cadastros.carregando,
    registrarEntrega,
    removerEntrega,
    adicionarPolicial: cadastros.adicionarPolicial,
    removerPolicial: cadastros.removerPolicial,
    adicionarMaterial: cadastros.adicionarMaterial,
    removerMaterial: cadastros.removerMaterial,
  };
}
