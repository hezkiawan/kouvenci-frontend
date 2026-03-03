"use client";

import { useState, useRef, useEffect } from "react";

// Define message structure
interface Message {
  role: "user" | "ai";
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Auto-scroll to bottom of chat
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // 1. Add user message immediately
    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      // 2. Call our Go Backend via Ingress (Relative Path)
      // This routes through the K8s Ingress rule: /api -> Backend Service
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.content }),
      });

      if (!res.ok) throw new Error("Server error");

      const data = await res.json();
      
      // 3. Add AI response
      const aiMsg: Message = { role: "ai", content: data.response };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      const errorMsg: Message = { role: "ai", content: "⚠️ Error: Could not reach KouvenCI Backend. Check Ingress/Pod logs." };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100 font-sans">
      
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4 shadow-md">
        <h1 className="text-xl font-bold text-green-400 tracking-wide flex items-center gap-2">
          <span className="text-2xl">🤖</span> KouvenCI <span className="text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded-full border border-green-700">SECURE</span>
        </h1>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-60">
            <p className="text-lg">Zero-Trust Architecture Active.</p>
            <p className="text-sm">Start a conversation...</p>
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] px-5 py-3 rounded-2xl shadow-sm text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-br-none"
                  : "bg-gray-700 text-gray-200 rounded-bl-none border border-gray-600"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-700 px-4 py-2 rounded-2xl rounded-bl-none text-xs text-gray-400 animate-pulse">
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="p-4 bg-gray-800 border-t border-gray-700">
        <form onSubmit={sendMessage} className="max-w-4xl mx-auto relative flex gap-2">
          <input
            type="text"
            className="flex-1 bg-gray-900 text-white border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-500 transition-all"
            placeholder="Type your message securely..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            Send
          </button>
        </form>
      </footer>
    </div>
  );
}