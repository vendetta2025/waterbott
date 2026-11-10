import React, { useState } from 'react';
import { Search, AlertTriangle, Bot, ArrowRight, CheckCircle2, MapPin, Building2, ShieldCheck, Clock } from 'lucide-react';
import { ActiveTab, Building } from '../types';

interface HomeViewProps {
  buildings: Building[];
  onNavigate: (tab: ActiveTab, preselectedBuilding?: string) => void;
  serverStatus: { ok: boolean; version?: string } | null;
}

export const HomeView: React.FC<HomeViewProps> = ({ buildings, onNavigate, serverStatus }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBuildings = buildings.filter(
    (b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.campusZone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-10 pb-16">
      {/* Editorial Header - Clean, Apple Maps / Linear restraint */}
      <section className="pt-2 sm:pt-4">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-medium text-teal-800 mb-2">
            <span>Lovely Professional University</span>
            <span aria-hidden="true">·</span>
            <span>Campus Water Network</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 text-balance">
            Find clean drinking water anywhere on campus.
          </h1>
          <p className="mt-3 text-base text-slate-600 leading-relaxed max-w-2xl">
            A public, community-maintained directory of campus water dispensers. No student sign-in, no university credentials, and no QR codes required.
          </p>
        </div>
      </section>

      {/* 3 Primary Action Cards - Core Focus */}
      <section aria-label="Primary Actions">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Action 1: Find Water */}
          <div className="group bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:border-teal-700/50 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-800 border border-teal-100 flex items-center justify-center mb-4">
                <Search className="w-5 h-5 text-teal-700" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Find Water</h2>
              <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                Browse water dispensers across campus blocks and floors. Check purifier types and real-time operational status.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => onNavigate('find')}
                className="w-full py-2.5 px-4 rounded-lg bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Browse Buildings & Floors</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Action 2: Report a Problem */}
          <div className="group bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:border-amber-600/50 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-800 border border-amber-100 flex items-center justify-center mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-700" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Report a Problem</h2>
              <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                Notice an empty tank, leak, or warm dispenser? Submit a 30-second anonymous report to alert fellow students.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => onNavigate('report')}
                className="w-full py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Submit Issue Report</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Action 3: Ask AI */}
          <div className="group bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:border-cyan-700/50 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-cyan-50 text-cyan-800 border border-cyan-100 flex items-center justify-center mb-4">
                <Bot className="w-5 h-5 text-cyan-700" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Ask AI</h2>
              <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                Natural-language campus assistant. Query verified dispenser locations and report issues through conversational chat.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => onNavigate('ask_ai')}
                className="w-full py-2.5 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-200"
              >
                <span>Open Assistant</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Campus Building Discovery */}
      <section aria-label="Campus Building Directory" className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900 tracking-tight">Quick Campus Discovery</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select your academic block or facility to inspect water points by floor
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search block or zone..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700 transition-colors"
            />
          </div>
        </div>

        {/* Building List Rows */}
        <div className="divide-y divide-slate-100 mt-2">
          {filteredBuildings.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No campus buildings match &ldquo;{searchQuery}&rdquo;.
            </div>
          ) : (
            filteredBuildings.map((building) => (
              <div
                key={building.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50/70 px-2 rounded-lg transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Building2 className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{building.name}</span>
                      <span className="text-[11px] font-mono text-slate-500 uppercase">({building.code})</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span>{building.campusZone}</span>
                      <span aria-hidden="true">·</span>
                      <span>{building.floorsCount} floors</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 ml-12 sm:ml-0">
                  <div className="text-right">
                    <div className="text-xs font-medium text-slate-800">
                      <span className="tabular-nums font-semibold text-teal-800">{building.activeWaterPointsCount}</span>
                      <span className="text-slate-500"> / {building.totalWaterPointsCount} working</span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 sm:justify-end">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 inline" />
                      <span>Regularly verified</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigate('find', building.id)}
                    className="py-1.5 px-3 rounded-md text-xs font-medium text-teal-800 hover:text-teal-900 hover:bg-teal-50 border border-slate-200 transition-colors shrink-0 cursor-pointer"
                  >
                    View Floors
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Community Operating Model - Transparency without marketing fluff */}
      <section aria-label="Operating Principles" className="border-t border-slate-200 pt-8">
        <h2 className="text-xs font-semibold text-slate-500 tracking-wider uppercase mb-4">
          How Empty Bottle Works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-slate-600">
          <div>
            <div className="flex items-center gap-2 text-slate-900 font-medium mb-1">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              <span>Zero-Barrier Access</span>
            </div>
            <p className="leading-relaxed">
              No registration or university login required. Students can instantly check operational status before walking across campus.
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 text-slate-900 font-medium mb-1">
              <Clock className="w-4 h-4 text-teal-700" />
              <span>Daily Verification Cycle</span>
            </div>
            <p className="leading-relaxed">
              Water point statuses reset each reporting cycle. Confirmation from fellow students keeps the campus directory trustworthy.
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 text-slate-900 font-medium mb-1">
              <MapPin className="w-4 h-4 text-teal-700" />
              <span>Grounded Coordinates</span>
            </div>
            <p className="leading-relaxed">
              Only real physical dispensers with verified floor locations are listed. No generated or unverified map markers.
            </p>
          </div>
        </div>

        {/* Backend health verification strip */}
        <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <span>API Gateway:</span>
            <span className={serverStatus?.ok ? 'text-emerald-700 font-medium' : 'text-slate-600'}>
              {serverStatus ? (serverStatus.ok ? `Express Connected (v${serverStatus.version || '0.1.0'})` : 'Offline') : 'Connecting...'}
            </span>
            <span aria-hidden="true">·</span>
            <span>Database: Supabase PostgreSQL (Ready)</span>
          </div>
          <div>
            <span>Campus: Lovely Professional University</span>
          </div>
        </div>
      </section>
    </div>
  );
};
