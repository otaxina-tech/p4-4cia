import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Policial } from "@/lib/controle";

export type ItemRecibo = {
  material: string;
  entrega: string;
  validade: string;
  observacoes?: string;
};

export type Recibo = {
  id: string;
  numero: number;
  codigo: string;
  re: string;
  nome: string;
  posto: string;
  data: string;
  responsavel: string;
  observacoes: string;
  itens: ItemRecibo[];
};

async function buscarRecibos(): Promise<Recibo[]> {
  const { data, error } = await supabase
    .from("recibos")
    .select("id, numero, codigo, re, nome, posto, data, responsavel, observacoes, itens")
    .order("numero", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    ...r,
    itens: (Array.isArray(r.itens) ? r.itens : []) as ItemRecibo[],
  })) as Recibo[];
}

export function useRecibos() {
  const queryClient = useQueryClient();
  const recibosQuery = useQuery({ queryKey: ["recibos"], queryFn: buscarRecibos });

  const criar = useMutation({
    mutationFn: async ({
      policial,
      itens,
      data,
      responsavel,
      observacoes,
    }: {
      policial: Policial;
      itens: ItemRecibo[];
      data: string;
      responsavel: string;
      observacoes: string;
    }) => {
      const { data: criado, error } = await supabase
        .from("recibos")
        .insert({
          re: policial.re,
          nome: policial.nome,
          posto: policial.posto,
          data,
          responsavel,
          observacoes,
          itens: itens as unknown as never,
        })
        .select("id, numero, codigo, re, nome, posto, data, responsavel, observacoes, itens")
        .single();
      if (error) throw error;

      // grava o número do recibo em cada entrega correspondente do policial
      for (const item of itens) {
        await supabase
          .from("entregas")
          .upsert(
            {
              re: policial.re,
              nome: policial.nome,
              posto: policial.posto,
              material: item.material,
              entrega: item.entrega,
              validade: item.validade,
              responsavel,
              observacoes: item.observacoes ?? "",
              recibo: criado.codigo,
            },
            { onConflict: "re,material" },
          );
      }
      return criado as unknown as Recibo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recibos"] });
      queryClient.invalidateQueries({ queryKey: ["entregas"] });
      queryClient.invalidateQueries({ queryKey: ["historico"] });
    },
  });

  const remover = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("recibos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recibos"] }),
  });

  return {
    recibos: recibosQuery.data ?? [],
    carregando: recibosQuery.isLoading,
    criarRecibo: useCallback(
      (v: Parameters<typeof criar.mutateAsync>[0]) => criar.mutateAsync(v),
      [criar],
    ),
    removerRecibo: useCallback((id: string) => remover.mutateAsync(id), [remover]),
  };
}
