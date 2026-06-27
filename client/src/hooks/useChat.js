import { useState, useCallback } from "react";
import { sendChatMessage } from "../services/chat";

const SUGGESTED_PROMPTS = [
  "How much did I spend this month?",
  "Am I on track with my goals?",
  "How are my budgets doing?",
  "What were my top expenses last month?",
];

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const send = useCallback(async (text) => {
    const userMessage = { role: "user", text, id: Date.now() };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setError(null);

    try {
      const { reply } = await sendChatMessage(text);
      const assistantMessage = { role: "assistant", text: reply, id: Date.now() + 1 };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err.message || "Failed to get a response. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  return { messages, loading, error, send, suggestedPrompts: SUGGESTED_PROMPTS };
}
