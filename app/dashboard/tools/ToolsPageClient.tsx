'use client';

import { useState } from 'react';
import { lusitana } from '@/app/ui/fonts';
import ChordGenerator from '@/app/ui/tools/ChordGenerator';
import Metronome from '@/app/ui/tools/Metronome';
import InstrumentAssistant from '@/app/ui/tools/InstrumentAssistant';
import FretboardDetector from '@/app/ui/tools/FretboardDetector';
import {
  MusicalNoteIcon,
  ClockIcon,
  SpeakerWaveIcon,
  WrenchScrewdriverIcon,
  CameraIcon,
} from '@heroicons/react/24/outline';

type ToolType = 'chord-generator' | 'metronome' | 'instrument-assistant' | 'fretboard-detector' | null;

interface Tool {
  id: ToolType;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const tools: Tool[] = [
  {
    id: 'chord-generator',
    name: 'Chord Generator',
    description: 'Generate chord progressions and explore harmonic relationships',
    icon: MusicalNoteIcon,
    color: 'from-blue-500 to-purple-600',
  },
  {
    id: 'metronome',
    name: 'Metronome',
    description: 'Keep perfect timing with our digital metronome',
    icon: ClockIcon,
    color: 'from-green-500 to-teal-600',
  },
  {
    id: 'instrument-assistant',
    name: 'Instrument Assistant',
    description: 'Get help with various instruments, scales, and techniques',
    icon: SpeakerWaveIcon,
    color: 'from-orange-500 to-red-600',
  },
  {
    id: 'fretboard-detector',
    name: 'Fretboard Scale Detector',
    description: 'Use AI to detect guitar fretboards and visualize scales',
    icon: CameraIcon,
    color: 'from-purple-500 to-pink-600',
  },
];

export default function ToolsPageClient() {
  const [activeTool, setActiveTool] = useState<ToolType>(null);

  const renderActiveTool = () => {
    switch (activeTool) {
      case 'chord-generator':
        return <ChordGenerator />;
      case 'metronome':
        return <Metronome />;
      case 'instrument-assistant':
        return <InstrumentAssistant />;
      case 'fretboard-detector':
        return <FretboardDetector />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {!activeTool ? (
        // Tools Grid
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => {
            const IconComponent = tool.icon;
            return (
              <div
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className="group relative overflow-hidden rounded-xl bg-gray-800 p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl border border-gray-700 hover:border-gray-500"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${tool.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                
                <div className="relative z-10">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br ${tool.color} mb-4`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors">
                    {tool.name}
                  </h3>
                  
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {tool.description}
                  </p>
                  
                  <div className="mt-4 inline-flex items-center text-blue-400 text-sm font-medium group-hover:text-blue-300 transition-colors">
                    Open Tool
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Active Tool View
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className={`${lusitana.className} text-xl text-white`}>
              {tools.find(tool => tool.id === activeTool)?.name}
            </h2>
            <button
              onClick={() => setActiveTool(null)}
              className="px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
            >
              <WrenchScrewdriverIcon className="w-4 h-4" />
              <span>Back to Tools</span>
            </button>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            {renderActiveTool()}
          </div>
        </div>
      )}
    </div>
  );
}
