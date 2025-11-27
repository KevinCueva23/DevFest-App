import React, { useState, useEffect, useRef } from 'react';
import { generateReasoningContent } from '../services/geminiService';
import { Message } from '../types';

const ReasoningLab: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await generateReasoningContent(userMsg.content);

      const aiMsg: Message = {
        role: 'model',
        content: responseText,
        timestamp: Date.now(),
        thinking: true 
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
        console.error(error);
      setMessages(prev => [...prev, { role: 'model', content: "Hubo un error en el proceso de razonamiento.", timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-indigo-900/10 rounded-full blur-3xl -z-0 pointer-events-none"></div>

      {/* Header */}
      <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-sm z-10">
        <div>
            <h2 className="text-2xl font-bold text-white mb-1">Laboratorio de Razonamiento</h2>
            <div className="flex items-center gap-2">
                <span className="text-slate-400 text-sm font-mono">MODEL: gemini-3-pro-preview</span>
                <span className="bg-indigo-500/20 text-indigo-300 text-[10px] px-2 py-0.5 rounded border border-indigo-500/30 uppercase tracking-wider">Thinking Enabled</span>
            </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 z-0">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60 max-w-lg mx-auto text-center">
            <i className="fa-solid fa-brain text-6xl mb-6 text-indigo-500/50"></i>
            <h3 className="text-xl font-bold text-slate-300 mb-2">Razonamiento Profundo</h3>
            <p className="text-sm">
                Diseñado para problemas complejos de STEM, lógica y codificación. 
                El modelo "piensa" antes de responder para aumentar la precisión.
            </p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className="flex items-center gap-2 mb-1">
                {msg.role === 'model' ? (
                     <>
                        <span className="text-indigo-400 font-mono text-xs font-bold">VERTEX AGENT</span>
                        {msg.thinking && <span className="text-[10px] text-slate-500 border border-slate-700 rounded px-1">THINKING BUDGET: 2048</span>}
                     </>
                ) : (
                    <span className="text-slate-400 font-mono text-xs">USER</span>
                )}
            </div>
            
            <div className={`max-w-4xl rounded-xl p-6 ${
              msg.role === 'user' 
                ? 'bg-slate-800 text-white' 
                : 'bg-slate-900 border border-slate-700 text-slate-200 shadow-xl'
            }`}>
              <div className="prose prose-invert prose-sm max-w-none">
                 {/* Simple formatting for demo purposes */}
                 {msg.content.split('\n').map((line, i) => <p key={i} className="min-h-[1rem]">{line}</p>)}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
            <div className="max-w-4xl mr-auto ml-0">
                <div className="flex items-center gap-3 text-indigo-400 mb-2">
                    <i className="fa-solid fa-circle-notch fa-spin"></i>
                    <span className="text-xs font-mono tracking-widest uppercase">Analizando cadena de pensamiento...</span>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 w-96">
                    <div className="h-2 w-full bg-slate-800 rounded overflow-hidden">
                        <div className="h-full bg-indigo-500 animate-progress"></div>
                    </div>
                    <div className="mt-2 text-xs text-slate-500 font-mono">Consuming tokens...</div>
                </div>
            </div>
        )}
        <div ref={bottomRef}></div>
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-slate-800 bg-slate-900/50 backdrop-blur z-10">
        <div className="max-w-4xl mx-auto flex gap-3">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Plantea un problema complejo de lógica, matemáticas o código..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder-slate-500 font-mono text-sm"
            />
            <button 
                onClick={handleSend}
                disabled={isLoading || !input}
                className="px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-900/50"
            >
                <i className="fa-solid fa-paper-plane"></i>
            </button>
        </div>
      </div>
      
      <style>{`
        @keyframes progress {
            0% { width: 0%; }
            50% { width: 70%; }
            100% { width: 95%; }
        }
        .animate-progress {
            animation: progress 2s infinite ease-out;
        }
      `}</style>
    </div>
  );
};

export default ReasoningLab;