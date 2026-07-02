/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MessageSquare, X, Send, Sparkles, Bot, AlertCircle } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

export default function AIAssistant() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [input, setInput] = React.useState('');
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: 'init',
      sender: 'bot',
      text: "Hello! I am your **VK Applicant AI Assistant**. How can I help you prepare and track your project proposal today?\n\nI can help you:\n- **Draft & refine** your proposal submission.\n- **Understand submission guidelines** and budget limits.\n- **Track review status** and respond to administrative feedback.",
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = React.useState(false);
  const [errorText, setErrorText] = React.useState('');
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userText = input.trim();
    setInput('');
    setErrorText('');

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const chatHistory = messages.concat(userMsg).map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        content: msg.text,
      }));

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatHistory }),
      });

      if (res.ok) {
        const data = await res.json();
        const botMsg: ChatMessage = {
          id: `bot_${Date.now()}`,
          sender: 'bot',
          text: data.text || "I apologize, I didn't get a proper response.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMsg]);
        setErrorText(''); // Clear any previous warnings
      } else {
        let errMsg = 'Failed to connect to the Gemini API.';
        try {
          const text = await res.text();
          try {
            const parsed = JSON.parse(text);
            errMsg = parsed.error || errMsg;
          } catch {
            errMsg = `Server Error (${res.status}): ${text.substring(0, 120)}`;
          }
        } catch {
          // ignore
        }
        setErrorText(errMsg);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setErrorText('Server communication error. Please ensure the backend is running and the Gemini API Key is configured.');
    } finally {
      setIsTyping(false);
    }
  };

  // Helper to render markdown-like bolding safely in text
  const renderMessageText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="text-orange-300 font-bold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="fixed bottom-20 right-6 z-50 flex flex-col items-end" id="ai-assistant">
      {/* Floating Chat Window */}
      {isOpen && (
        <div className="w-80 sm:w-96 h-[480px] bg-[#0c0e14]/95 backdrop-blur-md border border-white/10 rounded-2xl flex flex-col shadow-2xl overflow-hidden mb-4 animate-fade-in">
          {/* Header */}
          <div className="bg-black/30 border-b border-white/10 p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="bg-orange-500/10 p-1.5 rounded-lg border border-orange-500/20 text-orange-400">
                <Bot className="h-4.5 w-4.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center">
                  AI Governance Guide
                  <Sparkles className="h-3 w-3 ml-1.5 text-orange-500 animate-pulse" />
                </h4>
                <p className="text-[10px] text-slate-400">Powered by Gemini AI • Active</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages body */}
          <div className="grow p-4 overflow-y-auto space-y-3 scrollbar-thin text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 whitespace-pre-line leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-orange-600 text-white rounded-tr-none'
                      : 'bg-white/5 border border-white/10 text-slate-300 rounded-tl-none'
                  }`}
                >
                  {renderMessageText(msg.text)}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white/5 border border-white/10 text-slate-300 rounded-2xl rounded-tl-none px-3.5 py-3 flex items-center space-x-1.5">
                  <span className="h-1.5 w-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="h-1.5 w-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="h-1.5 w-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}

            {errorText && (
              <div className="bg-red-950/40 border border-red-500/20 text-red-300 rounded-xl p-3 flex items-start space-x-1.5">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[10px] uppercase tracking-wider font-mono">Service Warning</p>
                  <p className="text-[10px] leading-tight mt-0.5">{errorText}</p>
                </div>
              </div>
            )}

            <div ref={chatEndRef}></div>
          </div>

          {/* Chat input form */}
          <form onSubmit={handleSend} className="p-3 border-t border-white/10 bg-black/20 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me how to use this portal..."
              className="grow bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500 placeholder-slate-500"
              disabled={isTyping}
            />
            <button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-black font-bold p-2 rounded-xl transition cursor-pointer flex items-center justify-center shrink-0 disabled:opacity-50"
              disabled={!input.trim() || isTyping}
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Trigger Bubble Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-12 w-12 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-black shadow-lg hover:shadow-orange-500/20 hover:scale-105 transition duration-150 flex items-center justify-center cursor-pointer glow-orange"
        title="Open AI Portal Assistant"
        id="ai-assistant-bubble"
      >
        {isOpen ? (
          <X className="h-5.5 w-5.5" />
        ) : (
          <MessageSquare className="h-5.5 w-5.5" />
        )}
      </button>
    </div>
  );
}
