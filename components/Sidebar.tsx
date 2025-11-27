import React from 'react';
import { Tab } from '../types';

interface SidebarProps {
  currentTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange }) => {
  const menuItems = [
    { 
      id: Tab.VISION, 
      label: 'Visión Multimodal', 
      icon: 'fa-eye', 
      desc: 'Análisis de imágenes con Gemini 2.5 Flash' 
    },
    { 
      id: Tab.REASONING, 
      label: 'Razonamiento Profundo', 
      icon: 'fa-brain', 
      desc: 'Lógica compleja con Gemini 3 Pro (Thinking)' 
    },
    { 
        id: Tab.TRAINING, 
        label: 'Lab. de Entrenamiento', 
        icon: 'fa-network-wired', 
        desc: 'Aprendizaje en Contexto (Few-Shot Learning)' 
    },
    { 
      id: Tab.VIDEO, 
      label: 'Generación de Video', 
      icon: 'fa-film', 
      desc: 'Creación cinemática con Veo 3.1' 
    },
  ];

  return (
    <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col h-full shrink-0">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-900/50">
            <i className="fa-solid fa-shapes"></i>
          </div>
          <div>
            <h1 className="text-white font-bold text-lg tracking-tight">Vertex AI</h1>
            <p className="text-xs text-blue-400 font-medium">DEMO LAB</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full text-left p-4 rounded-xl transition-all duration-200 group border ${
              currentTab === item.id
                ? 'bg-blue-900/20 border-blue-500/50 shadow-inner'
                : 'bg-transparent border-transparent hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`mt-1 ${currentTab === item.id ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
                <i className={`fa-solid ${item.icon} text-lg`}></i>
              </div>
              <div>
                <div className={`font-semibold ${currentTab === item.id ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                  {item.label}
                </div>
                <div className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {item.desc}
                </div>
              </div>
            </div>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/50 rounded-lg p-3 text-xs text-slate-400 flex items-center gap-2">
           <i className="fa-solid fa-circle-info text-blue-500"></i>
           <span>Modelo seleccionado automáticamente según la tarea.</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;