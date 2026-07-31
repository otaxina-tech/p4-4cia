import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Perfil = {
  id: string;
  email: string;
  status: string;
  created_at: string;
};

async function carregarAcesso() {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return { perfil: null as Perfil | null, admin: false };

  let { data: perfil } = await supabase
    .from("profiles")
    .select("id, email, status, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!perfil) {
    const { data: criado, error } = await supabase
      .from("profiles")
      .insert({ id: user.id, email: user.email ?? "" })
      .select("id, email, status, created_at")
      .maybeSingle();
    if (error) throw error;
    perfil = criado;
  }

  const { data: papeis } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  return {
    perfil: (perfil ?? null) as Perfil | null,
    admin: (papeis ?? []).some((p) => p.role === "admin"),
  };
}

export function useAcesso() {
  const query = useQuery({ queryKey: ["acesso"], queryFn: carregarAcesso });
  return {
    perfil: query.data?.perfil ?? null,
    admin: query.data?.admin ?? false,
    aprovado: query.data?.perfil?.status === "aprovado",
    carregando: query.isLoading,
  };
}
