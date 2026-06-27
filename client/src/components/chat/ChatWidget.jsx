import { useState, useRef, useEffect } from "react";
import { useChat } from "../../hooks/useChat";
import ChatWindow from "./ChatWindow";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { messages, loading, error, send, suggestedPrompts } = useChat();

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="absolute bottom-16 right-0 w-96 h-[32rem] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
          <ChatWindow
            messages={messages}
            loading={loading}
            error={error}
            onSend={send}
            suggestedPrompts={suggestedPrompts}
            onClose={() => setOpen(false)}
          />
        </div>
      )}

      <button
        onClick={() => setOpen((prev) => !prev)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-200 ${
          open ? "bg-gray-700 rotate-45" : "bg-indigo-600 hover:bg-indigo-700"
        }`}
        aria-label="Chat"
      >
        {open ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
