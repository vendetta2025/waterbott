import React from 'react';
import { Home, Search, MapPin, AlertCircle, Bot } from 'lucide-react';
import { ActiveTab } from '../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onNavigate }) => {
  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg pb-safe"
    >
      <div className="grid grid-cols-5 h-16 max-w-md mx-auto">
        <button
          onClick={() => onNavigate('home')}
          className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] transition-colors cursor-pointer ${
            activeTab === 'home' ? 'text-teal-800 font-semibold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Home className="w-5 h-5 mb-1" />
          <span className="text-[10px] tracking-tight">Home</span>
        </button>

        <button
          onClick={() => onNavigate('find')}
          className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] transition-colors cursor-pointer ${
            activeTab === 'find' ? 'text-teal-800 font-semibold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Search className="w-5 h-5 mb-1" />
          <span className="text-[10px] tracking-tight">Find</span>
        </button>

        <button
          onClick={() => onNavigate('map')}
          className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] transition-colors cursor-pointer ${
            activeTab === 'map' ? 'text-teal-800 font-semibold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <MapPin className="w-5 h-5 mb-1" />
          <span className="text-[10px] tracking-tight">Map</span>
        </button>

        <button
          onClick={() => onNavigate('report')}
          className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] transition-colors cursor-pointer ${
            activeTab === 'report' ? 'text-teal-800 font-semibold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <AlertCircle className="w-5 h-5 mb-1" />
          <span className="text-[10px] tracking-tight">Report</span>
        </button>

        <button
          onClick={() => onNavigate('ask_ai')}
          className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] transition-colors cursor-pointer ${
            activeTab === 'ask_ai' ? 'text-teal-800 font-semibold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Bot className="w-5 h-5 mb-1" />
          <span className="text-[10px] tracking-tight">Ask AI</span>
        </button>
      </div>
    </nav>
  );
};
