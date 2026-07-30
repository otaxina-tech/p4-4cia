import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth(): { session: Session | null; usuario: User | null; carregando: boolean } {
  const [session, setSession] = useState<Session | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_evento, nova) => {
      setSession(nova);
      setCarregando(false);
    });
    supabase.auth.getSession().then(({ data: atual }) => {
      setSession(atual.session);
      setCarregando(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return { session, usuario: session?.user ?? null, carregando };
}
