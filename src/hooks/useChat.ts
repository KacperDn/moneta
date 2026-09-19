import { useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export interface Message {
  role: "user" | "assistant";
  text: string;
}

interface UseChatReturn {
  messages: Message[];
  loading: boolean;
  send: (question: string) => Promise<void>;
  clear: () => void;
}

export function useChat(session: Session | null): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "Cześć! Zapytaj mnie o swoje wydatki. Np. \"Ile wydałem w marcu?\" albo \"Która kategoria kosztuje mnie najwięcej?\"" }
  ]);
  const [loading, setLoading] = useState(false);

  const send = async (question: string) => {
    if (!session || !question.trim()) return;
    setMessages(prev => [...prev, { role: "user", text: question }]);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("chat", {
        body: { question },
      });

      if (error) throw error;

      setMessages(prev => [...prev, { role: "assistant", text: data.answer }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: "Przepraszam, coś poszło nie tak. Spróbuj ponownie." }]);
    }

    setLoading(false);
  };

  const clear = () => setMessages([
    { role: "assistant", text: "Cześć! Zapytaj mnie o swoje wydatki." }
  ]);

  return { messages, loading, send, clear };
}