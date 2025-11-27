import React, { useState, useRef } from 'react';
import { generateVisionContent } from '../services/geminiService';
import { Message } from '../types';

const VisionLab: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const userMsg: Message = {
      role: 'user',
      content: input,
      image: selectedImage || undefined,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Extract base64 raw string
      const base64Data = selectedImage ? selectedImage.split(',')[1] : null;
      const mimeType = selectedImage ? selectedImage.split(';')[0].split(':')[1] : 'image/jpeg';
      
      const responseText = await generateVisionContent(
        userMsg.content || "Describe esta imagen en detalle.", 
        base64Data,
        mimeType
      );

      const aiMsg: Message = {
        role: 'model',
        content: responseText,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
        console.error(error);
      setMessages(prev => [...prev, { role: 'model', content: "Error al procesar la solicitud. Verifica tu conexión.", timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
      setSelectedImage(null); // Clear image after send for next turn
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Header */}
      <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div>
            <h2 className="text-2xl font-bold text-white mb-1">Análisis Visual</h2>
            <p className="text-slate-400 text-sm font-mono">MODEL: gemini-2.5-flash</p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60">
            <i className="fa-regular fa-image text-6xl mb-4"></i>
            <p className="text-lg">Sube una imagen para comenzar el análisis.</p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
             {msg.role === 'model' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 mt-1">
                    <i className="fa-solid fa-sparkles text-white text-xs"></i>
                </div>
             )}
            <div className={`max-w-3xl rounded-2xl p-5 ${
              msg.role === 'user' 
                ? 'bg-slate-800 text-white rounded-tr-none' 
                : 'bg-slate-900/80 border border-slate-800 text-slate-200 rounded-tl-none shadow-sm'
            }`}>
              {msg.image && (
                <div className="mb-4">
                  <img src={msg.image} alt="User upload" className="max-h-64 rounded-lg border border-slate-700" />
                </div>
              )}
              <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
            </div>
            {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0 mt-1">
                    <i className="fa-solid fa-user text-slate-400 text-xs"></i>
                </div>
            )}
          </div>
        ))}
        {isLoading && (
            <div className="flex gap-4 justify-start animate-pulse">
                <div className="w-8 h-8 rounded-full bg-slate-800"></div>
                <div className="space-y-2">
                    <div className="h-4 w-48 bg-slate-800 rounded"></div>
                    <div className="h-4 w-32 bg-slate-800 rounded"></div>
                </div>
            </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-slate-800 bg-slate-900/50">
        <div className="max-w-4xl mx-auto flex flex-col gap-3">
            {selectedImage && (
                <div className="relative inline-block w-fit">
                    <img src={selectedImage} alt="Preview" className="h-20 rounded-lg border border-blue-500/50 shadow-lg shadow-blue-500/20" />
                    <button 
                        onClick={() => { setSelectedImage(null); if(fileInputRef.current) fileInputRef.current.value = ''; }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                        <i className="fa-solid fa-times"></i>
                    </button>
                </div>
            )}
            
            <div className="flex gap-3">
                <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                />
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="h-12 w-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center justify-center border border-slate-700"
                    title="Subir imagen"
                >
                    <i className="fa-solid fa-paperclip"></i>
                </button>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Haz una pregunta sobre la imagen o escribe un prompt..."
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 text-white focus:outline-none focus:border-blue-500 transition-colors placeholder-slate-500"
                />
                <button 
                    onClick={handleSend}
                    disabled={isLoading || (!input && !selectedImage)}
                    className="h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <span>Analizar</span>
                    <i className="fa-solid fa-arrow-up"></i>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default VisionLab;