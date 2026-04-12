import { useState, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface UseAuthReturn {
  session: Session | null;
  ready: boolean;
  isRecovery: boolean;
  logout: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [session, setSession]       = useState<Session | null>(null);
  const [ready, setReady]           = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type   = params.get("type");
    const token  = params.get("token");

    if (type === "recovery" && token) {
      setIsRecovery(true);
      setReady(true);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      } else {
        setIsRecovery(false);
      }
      setSession(session);
      setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return { session, ready, isRecovery, logout };
}