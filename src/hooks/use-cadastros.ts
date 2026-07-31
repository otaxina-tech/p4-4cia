import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PolicialCadastro = {
  id: string;
  re: string;
  nome: string;
  posto: string;
  ordem: number;
};

export type MaterialCadastro = { id: string; nome: string; ordem: number };

async function buscarPoliciais(): Promise<PolicialCadastro[]> {
  const { data, error } = await supabase
    .from("policiais")
    .select("id, re, nome, posto, ordem")
    .order("ordem", { ascending: true });
  if (error) throw error;
  return (data ?? []) as PolicialCadastro[];
}

async function buscarMateriais(): Promise<MaterialCadastro[]> {
  const { data, error } = await supabase
    .from("materiais")
    .select("id, nome, ordem")
    .order("ordem", { ascending: true });
  if (error) throw error;
  return (data ?? []) as MaterialCadastro[];
}

export function useCadastros() {
  const queryClient = useQueryClient();

  const policiaisQuery = useQuery({ queryKey: ["policiais"], queryFn: buscarPoliciais });
  const materiaisQuery = useQuery({ queryKey: ["materiais"], queryFn: buscarMateriais });

  const invalidarPoliciais = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["policiais"] });
    queryClient.invalidateQueries({ queryKey: ["entregas"] });
  }, [queryClient]);

  const invalidarMateriais = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["materiais"] });
    queryClient.invalidateQueries({ queryKey: ["entregas"] });
  }, [queryClient]);

  const adicionarPolicial = useMutation({
    mutationFn: async (dados: { re: string; nome: string; posto: string }) => {
      const atual = policiaisQuery.data ?? [];
      const ordem = atual.reduce((max, p) => Math.max(max, p.ordem), -1) + 1;
      const { error } = await supabase.from("policiais").insert({ ...dados, ordem });
      if (error) throw error;
    },
    onSuccess: invalidarPoliciais,
  });

  const removerPolicial = useMutation({
    mutationFn: async (re: string) => {
      const { error } = await supabase.from("policiais").delete().eq("re", re);
      if (error) throw error;
      await supabase.from("entregas").delete().eq("re", re);
    },
    onSuccess: invalidarPoliciais,
  });

  const adicionarMaterial = useMutation({
    mutationFn: async (nome: string) => {
      const atual = materiaisQuery.data ?? [];
      const ordem = atual.reduce((max, m) => Math.max(max, m.ordem), -1) + 1;
      const { error } = await supabase.from("materiais").insert({ nome, ordem });
      if (error) throw error;
    },
    onSuccess: invalidarMateriais,
  });

  const removerMaterial = useMutation({
    mutationFn: async (nome: string) => {
      const { error } = await supabase.from("materiais").delete().eq("nome", nome);
      if (error) throw error;
      await supabase.from("entregas").delete().eq("material", nome);
    },
    onSuccess: invalidarMateriais,
  });

  return {
    policiaisCadastro: policiaisQuery.data ?? [],
    materiais: (materiaisQuery.data ?? []).map((m) => m.nome),
    carregando: policiaisQuery.isLoading || materiaisQuery.isLoading,
    adicionarPolicial: (dados: { re: string; nome: string; posto: string }) =>
      adicionarPolicial.mutateAsync(dados),
    removerPolicial: (re: string) => removerPolicial.mutateAsync(re),
    adicionarMaterial: (nome: string) => adicionarMaterial.mutateAsync(nome),
    removerMaterial: (nome: string) => removerMaterial.mutateAsync(nome),
  };
}
