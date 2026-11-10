import React from 'react';
import { Droplets } from 'lucide-react';
import { ActiveTab } from '../types';

interface NavbarProps {
  activeTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onNavigate }) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 text-left text-slate-900 font-bold text-lg tracking-tight hover:opacity-85 transition-opacity shrink-0 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-teal-800 text-teal-50 flex items-center justify-center shadow-xs">
            <Droplets className="w-4 h-4 text-cyan-200" />
          </div>
          <span className="whitespace-nowrap">Empty Bottle</span>
        </button>

        {/* Zone 2: Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <button
            onClick={() => onNavigate('home')}
            className={`whitespace-nowrap transition-colors py-1 cursor-pointer border-b-2 ${
              activeTab === 'home'
                ? 'text-teal-900 border-teal-800 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => onNavigate('find')}
            className={`whitespace-nowrap transition-colors py-1 cursor-pointer border-b-2 ${
              activeTab === 'find'
                ? 'text-teal-900 border-teal-800 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Find Water
          </button>
          <button
            onClick={() => onNavigate('map')}
            className={`whitespace-nowrap transition-colors py-1 cursor-pointer border-b-2 ${
              activeTab === 'map'
                ? 'text-teal-900 border-teal-800 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Campus Map
          </button>
          <button
            onClick={() => onNavigate('report')}
            className={`whitespace-nowrap transition-colors py-1 cursor-pointer border-b-2 ${
              activeTab === 'report'
                ? 'text-teal-900 border-teal-800 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Report
          </button>
          <button
            onClick={() => onNavigate('ask_ai')}
            className={`whitespace-nowrap transition-colors py-1 cursor-pointer border-b-2 ${
              activeTab === 'ask_ai'
                ? 'text-teal-900 border-teal-800 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Ask AI
          </button>
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate('find')}
            className="px-4 py-2 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 active:scale-[0.98] transition-all rounded-lg shadow-xs whitespace-nowrap cursor-pointer"
          >
            Quick Locate
          </button>
        </div>
      </div>
    </header>
  );
};
