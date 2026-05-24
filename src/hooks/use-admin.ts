import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useAdmin() {
  const [state, setState] = useState<{ loading: boolean; isAdmin: boolean; email: string | null }>({
    loading: true, isAdmin: false, email: null,
  });

  useEffect(() => {
    let active = true;

    async function check() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (active) setState({ loading: false, isAdmin: false, email: null });
        return;
      }
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!active) return;
      setState({ loading: false, isAdmin: !!data && !error, email: session.user.email ?? null });
    }
    check();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => check());
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  return state;
}
