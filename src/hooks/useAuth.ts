import { useState, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface UseAuthReturn {
  session: Session | null;
  ready: boolean;
  logout: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady]     = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return { session, ready, logout };
}