import React, { useState } from 'react';
import { generateVideoContent, fetchVideoBlob } from '../services/geminiService';

const VideoLab: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);

  const checkAndGenerate = async () => {
    if (!prompt.trim()) return;

    try {
        setIsLoading(true);
        setStatus('Verificando API Key...');
        
        // Mandatory Veo check per instructions
        if (window.aistudio && window.aistudio.hasSelectedApiKey) {
            const hasKey = await window.aistudio.hasSelectedApiKey();
            if (!hasKey) {
                if(window.aistudio.openSelectKey) {
                    await window.aistudio.openSelectKey();
                    // Assume success as per instructions
                } else {
                    throw new Error("API Key selection not available.");
                }
            }
        }

        setStatus('Inicializando modelo Veo...');
        const uri = await generateVideoContent(prompt);
        
        if (uri) {
            setStatus('Descargando video generado...');
            setVideoUri(uri);
            const blobUrl = await fetchVideoBlob(uri);
            setVideoBlobUrl(blobUrl);
            setStatus('');
        }
    } catch (error: any) {
        console.error(error);
        if (error.message && error.message.includes('Requested entity was not found')) {
            // Retry logic hint
            setStatus('Error de autenticación. Por favor reintenta seleccionar tu llave.');
             if(window.aistudio && window.aistudio.openSelectKey) {
                 await window.aistudio.openSelectKey();
             }
        } else {
            setStatus(`Error: ${error.message || 'Error desconocido'}`);
        }
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      <div className="p-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <h2 className="text-2xl font-bold text-white mb-1">Veo Studio</h2>
        <div className="flex justify-between items-center">
             <p className="text-slate-400 text-sm font-mono">MODEL: veo-3.1-fast-generate-preview</p>
             <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:text-blue-300 underline">
                Billing Documentation
             </a>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center">
        
        {videoBlobUrl ? (
            <div className="w-full max-w-3xl bg-black rounded-xl overflow-hidden shadow-2xl shadow-blue-900/20 border border-slate-800">
                <video controls autoPlay loop className="w-full aspect-video">
                    <source src={videoBlobUrl} type="video/mp4" />
                    Tu navegador no soporta video.
                </video>
                <div className="p-4 bg-slate-900 flex justify-between items-center">
                    <p className="text-slate-300 text-sm italic truncate">{prompt}</p>
                    <button 
                        onClick={() => { setVideoBlobUrl(null); setVideoUri(null); }}
                        className="text-sm text-slate-500 hover:text-white"
                    >
                        Generar Nuevo
                    </button>
                </div>
            </div>
        ) : (
            <div className="text-center max-w-xl">
                 {isLoading ? (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                        <h3 className="text-xl font-bold text-white mb-2">Generando Video</h3>
                        <p className="text-slate-400 animate-pulse">{status}</p>
                        <p className="text-xs text-slate-600 mt-4 max-w-xs">Este proceso puede tomar unos minutos. Veo está creando cada frame...</p>
                    </div>
                 ) : (
                    <>
                        <div className="w-20 h-20 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-800 shadow-xl transform rotate-3">
                            <i className="fa-solid fa-clapperboard text-4xl text-blue-500"></i>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-4">Prompt a Video</h3>
                        <p className="text-slate-400 mb-8">
                            Transforma tus ideas en videos de alta calidad (1080p) usando el modelo generativo más avanzado de Google.
                        </p>
                        
                        <div className="flex flex-col gap-4 w-full">
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe una escena cinemática. Ej: Un dron futurista volando sobre una ciudad cyberpunk de neón bajo la lluvia..."
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-white focus:border-blue-500 focus:outline-none h-32 resize-none"
                            />
                            <button
                                onClick={checkAndGenerate}
                                disabled={!prompt.trim()}
                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white font-bold text-lg hover:shadow-lg hover:shadow-blue-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <i className="fa-solid fa-wand-magic-sparkles mr-2"></i>
                                Generar Video
                            </button>
                            <p className="text-xs text-slate-500">
                                * Requiere selección de llave API pagada (GCP).
                            </p>
                        </div>
                    </>
                 )}
            </div>
        )}
      </div>
    </div>
  );
};

export default VideoLab;