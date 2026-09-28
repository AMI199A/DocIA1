import React, { useState, useEffect, useRef } from "react";
import { Send, Trash2, Bot, User, FileText, Loader2 } from "lucide-react";
import { fetchWithTimeout } from "@/services/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface Document {
  id: string;
  filename: string;
  file_type: string;
}

export const ChatQA: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Cargar documentos disponibles
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await fetchWithTimeout("/api/v1/documents/");
        if (res.ok) {
          const data = await res.json();
          setDocuments(data);
          if (data.length > 0) setSelectedDocId(data[0].id);
        }
      } catch (e) {
        console.error("Error cargando documentos:", e);
      }
    };
    fetchDocs();
  }, []);

  // Cargar historial cuando cambia el documento seleccionado
  useEffect(() => {
    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        const url = selectedDocId
          ? `/api/v1/chat/history?document_id=${selectedDocId}&limit=50`
          : `/api/v1/chat/history?limit=50`;
        const res = await fetchWithTimeout(url);
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (e) {
        console.error("Error cargando historial:", e);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, [selectedDocId]);

  // Auto-scroll al último mensaje
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setLoading(true);

    // Optimistic UI — agregar mensaje del usuario antes de la respuesta
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetchWithTimeout("/api/v1/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_id: selectedDocId || null,
          content: text,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Error en el servidor");
      }

      const data = await res.json();

      // Reemplazar mensaje temporal con los reales del servidor
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMsg.id),
        data.user_message,
        data.assistant_message,
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMsg.id),
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: `❌ Error: ${err.message || "No se pudo conectar con el asistente."}`,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!confirm("¿Borrar todo el historial de esta conversación?")) return;
    try {
      const url = selectedDocId
        ? `/api/v1/chat/history?document_id=${selectedDocId}`
        : `/api/v1/chat/history`;
      await fetchWithTimeout(url, { method: "DELETE" });
      setMessages([]);
    } catch (e) {
      console.error("Error borrando historial:", e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] min-h-[500px]">
      {/* Header con selector de documento */}
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <FileText className="text-blue-400 flex-shrink-0" size={20} />
          <select
            className="flex-1 bg-panel2 border border-line text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
          >
            <option value="">— Sin documento (chat general) —</option>
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                📄 {d.filename}
              </option>
            ))}
          </select>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 transition-colors px-3 py-2 rounded-lg border border-line hover:border-red-500/40"
          >
            <Trash2 size={14} />
            Limpiar
          </button>
        )}
      </div>

      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-2 scrollbar-thin scrollbar-thumb-slate-700">
        {loadingHistory ? (
          <div className="flex items-center justify-center h-32 text-slate-400 text-sm gap-2">
            <Loader2 size={18} className="animate-spin" /> Cargando historial...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-sm gap-3">
            <Bot size={40} className="text-slate-600" />
            <p className="text-center">
              {selectedDocId
                ? "Haz una pregunta sobre el documento seleccionado."
                : "Selecciona un documento o escribe una pregunta general."}
            </p>
            <div className="grid grid-cols-1 gap-2 w-full max-w-sm mt-2">
              {["¿De qué trata este documento?", "Resume los puntos principales", "¿Cuáles son las conclusiones?"].map(
                (sugg) => (
                  <button
                    key={sugg}
                    onClick={() => setInput(sugg)}
                    className="text-xs text-left px-3 py-2 rounded-lg bg-panel2 border border-line hover:border-blue-500/40 hover:text-blue-300 transition-colors"
                  >
                    💬 {sugg}
                  </button>
                )
              )}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar */}
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs ${
                  msg.role === "user" ? "bg-blue-600" : "bg-purple-700"
                }`}
              >
                {msg.role === "user" ? <User size={14} /> : <Bot size={14} />}
              </div>

              {/* Burbuja */}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-blue-600/20 border border-blue-500/30 text-blue-100 rounded-tr-sm"
                    : "bg-panel2 border border-line text-slate-200 rounded-tl-sm"
                }`}
              >
                <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                <p className="text-xs text-slate-500 mt-1.5 text-right">
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          ))
        )}

        {/* Indicador "escribiendo..." */}
        {loading && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-700 flex items-center justify-center">
              <Bot size={14} className="text-white" />
            </div>
            <div className="bg-panel2 border border-line rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1.5 items-center h-5">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-4 flex gap-2 items-end">
        <textarea
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe tu pregunta... (Enter para enviar, Shift+Enter para nueva línea)"
          className="flex-1 bg-panel2 border border-line rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className="flex-shrink-0 w-11 h-11 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
        >
          {loading ? (
            <Loader2 size={18} className="text-white animate-spin" />
          ) : (
            <Send size={18} className="text-white" />
          )}
        </button>
      </div>
    </div>
  );
};
