import React, { useState, useRef, useEffect } from 'react';
import { chatWithTrainedModel } from '../services/geminiService';
import { saveExamples, loadExamples, saveDocuments, loadDocuments, saveChatHistory, loadChatHistory, clearAllData } from '../services/storageService';
import { TrainingExample, TrainingDocument, Message } from '../types';

const TrainingLab: React.FC = () => {
  // --- Training Data State ---
  const [examples, setExamples] = useState<TrainingExample[]>([]);
  const [documents, setDocuments] = useState<TrainingDocument[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Inputs for adding examples
  const [newInput, setNewInput] = useState('');
  const [newOutput, setNewOutput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Chat State ---
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // --- Persistence & Initialization ---
  
  // Load data on mount
  useEffect(() => {
    const initData = async () => {
        try {
            const savedExamples = loadExamples();
            const savedChat = loadChatHistory();
            const savedDocs = await loadDocuments();

            setExamples(savedExamples);
            setMessages(savedChat);
            setDocuments(savedDocs);
        } catch (error) {
            console.error("Error loading saved data:", error);
        } finally {
            setIsInitialized(true);
        }
    };
    initData();
  }, []);

  // Save on changes (only after initialization to avoid overwriting with empty state)
  useEffect(() => {
    if (!isInitialized) return;
    saveExamples(examples);
  }, [examples, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    saveDocuments(documents);
  }, [documents, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    saveChatHistory(messages);
  }, [messages, isInitialized]);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- Handlers: Examples ---
  const addExample = () => {
    if (!newInput.trim() || !newOutput.trim()) return;
    const example: TrainingExample = {
      id: Date.now().toString(),
      input: newInput.trim(),
      output: newOutput.trim()
    };
    setExamples([...examples, example]);
    setNewInput('');
    setNewOutput('');
  };

  const removeExample = (id: string) => {
    setExamples(examples.filter(ex => ex.id !== id));
  };

  // --- Handlers: Documents ---
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert("Por favor sube solo archivos PDF.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        const newDoc: TrainingDocument = {
            id: Date.now().toString(),
            name: file.name,
            mimeType: file.type,
            base64: base64String,
            size: file.size
        };
        setDocuments([...documents, newDoc]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeDocument = (id: string) => {
      setDocuments(documents.filter(d => d.id !== id));
  };

  // --- Handlers: Chat ---
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
        const responseText = await chatWithTrainedModel(
            userMsg.content,
            messages, // Send previous history
            examples,
            documents
        );

        const aiMsg: Message = {
            role: 'model',
            content: responseText,
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
        console.error(error);
        setMessages(prev => [...prev, {
            role: 'model',
            content: "Error: No pude conectar con el modelo entrenado.",
            timestamp: Date.now()
        }]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleReset = async () => {
      if (window.confirm("¿Estás seguro de que quieres borrar todo el entrenamiento y el historial?")) {
          setExamples([]);
          setDocuments([]);
          setMessages([]);
          await clearAllData();
      }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200">
      
      {/* Header */}
      <div className="p-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm flex justify-between items-center shrink-0">
        <div>
            <h2 className="text-2xl font-bold text-white mb-1">Entrenamiento y Chat (RAG)</h2>
            <div className="flex items-center gap-2">
                <span className="text-slate-400 text-sm font-mono">MODEL: gemini-2.5-flash</span>
                <span className="bg-green-500/20 text-green-400 text-[10px] px-2 py-0.5 rounded border border-green-500/30 uppercase tracking-wider">Online Learning</span>
                {isInitialized && <span className="text-[10px] text-slate-500"><i className="fa-solid fa-save mr-1"></i>Auto-save on</span>}
            </div>
        </div>
        <button 
            onClick={handleReset}
            className="text-xs text-red-400 hover:text-red-300 border border-red-900/30 px-3 py-1 rounded-lg bg-red-900/10 transition-colors"
        >
            Resetear Todo
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* --- LEFT PANEL: Configuration (The Brain) --- */}
        <div className="w-96 border-r border-slate-800 flex flex-col bg-slate-900/20 overflow-hidden shrink-0">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                
                {/* Section: Documents */}
                <div className="p-5 border-b border-slate-800">
                    <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <i className="fa-solid fa-file-pdf"></i> Base de Conocimiento
                    </h3>
                    
                    <div className="space-y-3 mb-4">
                        {documents.map(doc => (
                            <div key={doc.id} className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs group">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <i className="fa-regular fa-file-pdf text-red-400"></i>
                                    <span className="truncate max-w-[150px] text-slate-300">{doc.name}</span>
                                </div>
                                <button onClick={() => removeDocument(doc.id)} className="text-slate-500 hover:text-red-400">
                                    <i className="fa-solid fa-times"></i>
                                </button>
                            </div>
                        ))}
                        {documents.length === 0 && (
                            <div className="text-center py-4 border-2 border-dashed border-slate-800 rounded-lg text-slate-600 text-xs">
                                Sin documentos
                            </div>
                        )}
                    </div>

                    <input 
                        type="file" 
                        accept="application/pdf" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleFileUpload} 
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <i className="fa-solid fa-upload"></i> Subir PDF (Info Empresa)
                    </button>
                </div>

                {/* Section: Examples */}
                <div className="p-5">
                    <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <i className="fa-solid fa-graduation-cap"></i> Ajuste de Comportamiento
                    </h3>
                    
                    <div className="space-y-3 bg-slate-900/50 p-3 rounded-xl border border-slate-800 mb-4">
                        <div>
                            <label className="text-[10px] text-slate-500 font-mono block mb-1">ENTRADA (USUARIO)</label>
                            <input 
                                type="text" 
                                value={newInput}
                                onChange={(e) => setNewInput(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs focus:border-purple-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-500 font-mono block mb-1">SALIDA (IDEAL)</label>
                            <textarea 
                                value={newOutput}
                                onChange={(e) => setNewOutput(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs focus:border-purple-500 focus:outline-none h-14 resize-none"
                            />
                        </div>
                        <button 
                            onClick={addExample}
                            disabled={!newInput || !newOutput}
                            className="w-full py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-600/30 rounded text-xs font-medium transition-colors disabled:opacity-50"
                        >
                            <i className="fa-solid fa-plus mr-1"></i> Añadir Patrón
                        </button>
                    </div>

                    <div className="space-y-2">
                        {examples.map(ex => (
                            <div key={ex.id} className="bg-slate-800/50 border border-slate-700/50 rounded p-2 text-[10px] relative group hover:border-purple-500/30 transition-colors">
                                <div className="flex gap-1 mb-1">
                                    <span className="text-slate-500 font-bold">Q:</span>
                                    <span className="text-slate-300 truncate">{ex.input}</span>
                                </div>
                                <div className="flex gap-1">
                                    <span className="text-purple-400 font-bold">A:</span>
                                    <span className="text-slate-400 truncate">{ex.output}</span>
                                </div>
                                <button onClick={() => removeExample(ex.id)} className="absolute top-1 right-1 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100">
                                    <i className="fa-solid fa-times"></i>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* --- RIGHT PANEL: Chat Interface --- */}
        <div className="flex-1 flex flex-col bg-slate-950 relative">
            
            {/* Visual Header for Chat */}
            <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 opacity-50"></div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {!isInitialized ? (
                     <div className="h-full flex items-center justify-center">
                        <i className="fa-solid fa-circle-notch fa-spin text-3xl text-blue-500"></i>
                     </div>
                ) : messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60 max-w-md mx-auto text-center">
                        <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4 border border-slate-800">
                             <i className="fa-solid fa-robot text-2xl text-blue-500"></i>
                        </div>
                        <p className="text-sm">
                            El modelo está listo. <br/>
                            Tiene acceso a <b>{documents.length} documentos</b> y <b>{examples.length} patrones de comportamiento</b>.
                        </p>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'model' && (
                            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 mt-1 shadow-lg shadow-indigo-900/50">
                                <i className="fa-solid fa-brain text-white text-xs"></i>
                            </div>
                        )}
                        <div className={`max-w-2xl rounded-2xl p-4 text-sm ${
                            msg.role === 'user' 
                                ? 'bg-slate-800 text-white rounded-tr-none' 
                                : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-md'
                        }`}>
                            <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                        </div>
                        {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-1">
                                <i className="fa-solid fa-user text-slate-400 text-xs"></i>
                            </div>
                        )}
                    </div>
                ))}

                {isLoading && (
                    <div className="flex gap-3 justify-start animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-slate-800"></div>
                        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                                <i className="fa-solid fa-circle-notch fa-spin text-blue-500"></i>
                                <span>Leyendo PDF y aplicando estilos...</span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={chatBottomRef}></div>
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/30">
                <div className="max-w-4xl mx-auto flex gap-3 relative">
                     {/* Context Indicators */}
                     <div className="absolute -top-8 left-0 flex gap-2">
                        {documents.length > 0 && (
                            <span className="text-[10px] bg-red-900/20 text-red-400 px-2 py-0.5 rounded border border-red-900/30 flex items-center gap-1">
                                <i className="fa-solid fa-file-pdf"></i> {documents.length} Docs
                            </span>
                        )}
                        {examples.length > 0 && (
                            <span className="text-[10px] bg-purple-900/20 text-purple-400 px-2 py-0.5 rounded border border-purple-900/30 flex items-center gap-1">
                                <i className="fa-solid fa-graduation-cap"></i> {examples.length} Rules
                            </span>
                        )}
                     </div>

                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Conversa con tu modelo personalizado..."
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors placeholder-slate-500 text-sm shadow-inner"
                    />
                    <button 
                        onClick={handleSend}
                        disabled={isLoading || !input}
                        className="h-12 w-12 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all disabled:opacity-50 disabled:bg-slate-800 flex items-center justify-center shadow-lg shadow-blue-900/20"
                    >
                        <i className="fa-solid fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingLab;