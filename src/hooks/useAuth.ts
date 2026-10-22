import { useState, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface UseAuthReturn {
  session: Session | null;
  ready: boolean;
  isRecovery: boolean;
  logout: () => Promise<void>;
}

/** Recovery links land with ?type=recovery&token=... before any session exists. */
function isRecoveryUrl(): boolean {
  const params = new URLSearchParams(window.location.search);
  return params.get("type") === "recovery" && !!params.get("token");
}

export function useAuth(): UseAuthReturn {
  const [recoveryFromUrl] = useState(isRecoveryUrl);
  const [session, setSession]       = useState<Session | null>(null);
  const [ready, setReady]           = useState(recoveryFromUrl);
  const [isRecovery, setIsRecovery] = useState(recoveryFromUrl);

  useEffect(() => {
    if (recoveryFromUrl) return;

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
  }, [recoveryFromUrl]);

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return { session, ready, isRecovery, logout };
}