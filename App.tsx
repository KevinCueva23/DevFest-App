import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import VisionLab from './components/VisionLab';
import ReasoningLab from './components/ReasoningLab';
import VideoLab from './components/VideoLab';
import TrainingLab from './components/TrainingLab';
import { Tab } from './types';

const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<Tab>(Tab.VISION);

  const renderContent = () => {
    switch (currentTab) {
      case Tab.VISION:
        return <VisionLab />;
      case Tab.REASONING:
        return <ReasoningLab />;
      case Tab.TRAINING:
        return <TrainingLab />;
      case Tab.VIDEO:
        return <VideoLab />;
      default:
        return <VisionLab />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-200">
      <Sidebar currentTab={currentTab} onTabChange={setCurrentTab} />
      <main className="flex-1 h-full relative">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;