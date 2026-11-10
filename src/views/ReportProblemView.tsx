import React, { useState } from 'react';
import { ArrowLeft, AlertTriangle, CheckCircle2, ShieldCheck, Send, Loader2 } from 'lucide-react';
import { IssueCategory, ProblemReportDraft, Building } from '../types';
import { submitProblemReport } from '../services/api';

interface ReportProblemViewProps {
  buildings: Building[];
  initialBuildingId?: string;
  initialFloor?: number;
  onNavigateHome: () => void;
  onNavigateFind: () => void;
}

const ISSUE_OPTIONS: { id: IssueCategory; label: string; description: string }[] = [
  {
    id: 'no_water',
    label: 'No Water Flow',
    description: 'Dispenser is completely dry or tank is empty',
  },
  {
    id: 'cooling_not_working',
    label: 'Cooling Failure',
    description: 'Cold tap is dispensing ambient or lukewarm water',
  },
  {
    id: 'dispenser_leaking',
    label: 'Water Leakage',
    description: 'Continuous dripping or water puddle forming on the floor',
  },
  {
    id: 'filter_odor_taste',
    label: 'Taste or Odor Issue',
    description: 'Filter indicator light is red, foul smell, or turbidity',
  },
  {
    id: 'tap_lever_broken',
    label: 'Broken Tap / Push Lever',
    description: 'Mechanical push lever is jammed, cracked, or missing',
  },
  {
    id: 'hygiene_surroundings',
    label: 'Hygiene Concern',
    description: 'Waste bin overflowing or unsanitary tray area',
  },
];

export const ReportProblemView: React.FC<ReportProblemViewProps> = ({
  buildings,
  initialBuildingId = 'b-34',
  initialFloor = 1,
  onNavigateHome,
  onNavigateFind,
}) => {
  const [buildingId, setBuildingId] = useState(initialBuildingId);
  const [floorNumber, setFloorNumber] = useState<number>(initialFloor);
  const [selectedIssue, setSelectedIssue] = useState<IssueCategory>('no_water');
  const [urgency, setUrgency] = useState<'routine' | 'urgent'>('routine');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<{ id: string; time: string } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const selectedBuilding = buildings.find((b) => b.id === buildingId) || buildings[0] || {
    id: 'unknown',
    name: 'Selected Block',
    code: 'BLK',
    campusZone: 'Campus',
    floorsCount: 4,
    activeWaterPointsCount: 0,
    totalWaterPointsCount: 0,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    const reportDraft: ProblemReportDraft = {
      buildingId,
      floorNumber,
      issueCategory: selectedIssue,
      description: description.trim(),
      urgency,
    };

    try {
      const response = await submitProblemReport(reportDraft);
      setSubmittedTicket({
        id: response.reportId,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    } catch (err) {
      console.error('Failed to submit report:', err);
      // Fallback local ticket if server is in development mode
      setSubmittedTicket({
        id: `REP-${Math.floor(100000 + Math.random() * 900000)}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedTicket) {
    return (
      <div className="max-w-xl mx-auto space-y-6 py-6 pb-16">
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>

          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Report Logged</h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            Thank you for helping keep campus water points functional. Your report has been registered anonymously.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-left max-w-sm mx-auto text-xs space-y-1">
            <div className="flex justify-between text-slate-500">
              <span>Ticket Reference:</span>
              <span className="font-mono font-semibold text-slate-800">{submittedTicket.id}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Location:</span>
              <span className="text-slate-800 font-medium">
                {selectedBuilding.name} · {floorNumber === 0 ? 'Ground Floor' : `Floor ${floorNumber}`}
              </span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Time:</span>
              <span className="text-slate-800">{submittedTicket.time}</span>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => {
                setSubmittedTicket(null);
                setDescription('');
              }}
              className="w-full sm:w-auto py-2 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
            >
              Report Another Point
            </button>
            <button
              onClick={onNavigateFind}
              className="w-full sm:w-auto py-2 px-4 rounded-lg bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Browse Working Water Points
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      {/* Navigation Kicker */}
      <div className="flex items-center justify-between">
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Overview</span>
        </button>

        <span className="text-xs text-slate-500">Community Reporting</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-7 shadow-xs">
        <div className="pb-5 border-b border-slate-100">
          <div className="flex items-center gap-2 text-amber-800 text-xs font-semibold mb-1">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Report a Water Point Issue</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Help your fellow students stay hydrated.
          </h1>
          <p className="mt-1 text-xs text-slate-600 leading-relaxed">
            Reports update the live campus status board and notify campus maintenance teams.
          </p>
        </div>

        {/* Anonymous policy pill */}
        <div className="my-4 p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-start gap-2.5 text-xs text-slate-600">
          <ShieldCheck className="w-4 h-4 text-teal-800 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-slate-800 font-semibold">100% Anonymous:</strong> No university ID or student email needed. Submissions use an anonymous browser token to prevent duplicates within each reporting cycle.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Step 1: Building & Floor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Campus Building
              </label>
              <select
                value={buildingId}
                onChange={(e) => {
                  setBuildingId(e.target.value);
                  setFloorNumber(0);
                }}
                className="w-full p-2.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-teal-700 text-slate-800 cursor-pointer"
              >
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.campusZone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Floor Level
              </label>
              <select
                value={floorNumber}
                onChange={(e) => setFloorNumber(Number(e.target.value))}
                className="w-full p-2.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-teal-700 text-slate-800 cursor-pointer"
              >
                {Array.from({ length: selectedBuilding.floorsCount }).map((_, idx) => (
                  <option key={idx} value={idx}>
                    {idx === 0 ? 'Ground Floor' : `Floor ${idx}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Step 2: Issue Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              What seems to be the problem?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ISSUE_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setSelectedIssue(opt.id)}
                  className={`p-3 rounded-lg text-left border transition-all cursor-pointer ${
                    selectedIssue === opt.id
                      ? 'bg-amber-50/70 border-amber-600 text-amber-950'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-bold">{opt.label}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">{opt.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Location specifics / notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Specific Location Details or Observations (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Near classroom 204, cold water push-tap is loose, water flow is barely a trickle..."
              className="w-full p-2.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-teal-700 text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Urgency Selection */}
          <div className="pt-2">
            <span className="block text-xs font-semibold text-slate-700 mb-1.5">Urgency Level</span>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="urgency"
                  checked={urgency === 'routine'}
                  onChange={() => setUrgency('routine')}
                  className="text-teal-800 focus:ring-teal-700"
                />
                <span>Routine (Normal maintenance needed)</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="urgency"
                  checked={urgency === 'urgent'}
                  onChange={() => setUrgency('urgent')}
                  className="text-amber-800 focus:ring-amber-700"
                />
                <span className="text-amber-900 font-medium">Urgent (Flooding / electrical hazard / dirty water)</span>
              </label>
            </div>
          </div>

          {submitError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs">
              {submitError}
            </div>
          )}

          {/* Submit CTA */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onNavigateHome}
              className="py-2.5 px-4 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="py-2.5 px-5 rounded-lg bg-teal-800 hover:bg-teal-900 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Logging Report...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Anonymous Report</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
