import React, { useState } from 'react';
import {
  ArrowLeft,
  Bot,
  Send,
  ShieldCheck,
  Database,
  CheckCircle2,
  MapPin,
  Droplets,
  Filter,
  AlertTriangle,
  RotateCcw,
  Compass,
  ArrowRight,
  Info,
} from 'lucide-react';
import {
  Building,
  DiscoveryConversationState,
  RecommendationQuery,
  RecommendationResult,
  RankedWaterPoint,
  GeoCoordinates,
} from '../types';
import { fetchRecommendations } from '../services/api';

interface AskAiViewProps {
  buildings?: Building[];
  onNavigateHome: () => void;
  onNavigateFind: (buildingId?: string, floor?: number) => void;
}

const SAMPLE_QUESTIONS = [
  'Where is the nearest cold water dispenser in Block 34?',
  'Is the 2nd floor water dispenser in Block 28 currently operational?',
  'Which water point was verified most recently in the Central Library?',
  'Recommend working chilled dispensers near Block 38',
];

export const AskAiView: React.FC<AskAiViewProps> = ({
  buildings = [],
  onNavigateHome,
  onNavigateFind,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [latestResult, setLatestResult] = useState<RecommendationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Multi-Turn Typed Conversation State
  const [conversationState, setConversationState] = useState<DiscoveryConversationState>({
    preferences: {
      chilledOnly: false,
      roPurifiedOnly: false,
      operationalOnly: true,
    },
    lastReturnedWaterPointIds: [],
    conversationHistory: [],
  });

  // Parse natural student query into typed RecommendationQuery
  const parseQueryFromText = (
    text: string,
    existingContext?: DiscoveryConversationState
  ): RecommendationQuery => {
    const lower = text.toLowerCase();
    const query: RecommendationQuery = {
      operationalOnly: existingContext?.preferences.operationalOnly ?? true,
    };

    // 1. Check for building match
    for (const b of buildings) {
      if (
        lower.includes(b.name.toLowerCase()) ||
        lower.includes(b.code.toLowerCase()) ||
        (b.name.toLowerCase().includes('library') && lower.includes('library'))
      ) {
        query.buildingId = b.id;
        query.buildingName = b.name;
        break;
      }
    }

    // Fall back to previous building if this is a follow-up
    if (!query.buildingId && existingContext?.currentLocation?.buildingId) {
      query.buildingId = existingContext.currentLocation.buildingId;
      query.buildingName = existingContext.currentLocation.buildingName;
    }

    // 2. Check for floor level
    const floorMatch = lower.match(/(?:floor|level|flr)\s*(\d+)/i) || lower.match(/(\d+)(?:st|nd|rd|th)\s*floor/i);
    if (floorMatch && floorMatch[1]) {
      query.floor = parseInt(floorMatch[1], 10);
      query.studentFloor = query.floor;
    } else if (lower.includes('ground floor') || lower.includes('ground level')) {
      query.floor = 0;
      query.studentFloor = 0;
    } else if (existingContext?.selectedFloor !== undefined && existingContext.selectedFloor !== 'all') {
      query.floor = existingContext.selectedFloor;
      query.studentFloor = existingContext.selectedFloor;
    }

    // 3. Check for chilled/cold preferences
    if (lower.includes('cold') || lower.includes('chilled') || lower.includes('chiller')) {
      query.requiresChilled = true;
    } else if (existingContext?.preferences.chilledOnly) {
      query.requiresChilled = true;
    }

    // 4. Check for RO preference
    if (lower.includes('ro') || lower.includes('purified') || lower.includes('filter')) {
      query.requiresRoPurified = true;
    }

    // 5. If this is a refinement question and we have previous candidate IDs, pass them
    if (
      (lower.includes('which one') || lower.includes('which of') || lower.includes('from these')) &&
      existingContext &&
      existingContext.lastReturnedWaterPointIds.length > 0
    ) {
      query.candidateWaterPointIds = existingContext.lastReturnedWaterPointIds;
    }

    return query;
  };

  const executeRecommendationQuery = async (query: RecommendationQuery, userText: string) => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const result = await fetchRecommendations(query);
      setLatestResult(result);

      // Update multi-turn conversation state
      setConversationState((prev) => {
        const newIds = result.recommendations.map((r) => r.waterPoint.id);
        const resolvedBuilding = result.resolvedLocation?.building;

        return {
          ...prev,
          currentLocation: resolvedBuilding
            ? {
                type: 'building',
                buildingId: resolvedBuilding.id,
                buildingName: resolvedBuilding.name,
                buildingCode: resolvedBuilding.code,
              }
            : query.geoCoordinates
            ? {
                type: 'geo',
                geoCoordinates: query.geoCoordinates,
              }
            : prev.currentLocation,
          selectedFloor: query.floor !== undefined ? query.floor : prev.selectedFloor,
          preferences: {
            chilledOnly: query.requiresChilled ?? prev.preferences.chilledOnly,
            roPurifiedOnly: query.requiresRoPurified ?? prev.preferences.roPurifiedOnly,
            operationalOnly: query.operationalOnly ?? prev.preferences.operationalOnly,
          },
          lastReturnedWaterPointIds: newIds.length > 0 ? newIds : prev.lastReturnedWaterPointIds,
          conversationHistory: [
            ...prev.conversationHistory,
            { role: 'student', text: userText, timestamp: new Date().toLocaleTimeString() },
            {
              role: 'assistant',
              text: result.message,
              timestamp: new Date().toLocaleTimeString(),
              resultSnapshot: result,
            },
          ],
        };
      });
    } catch (err: any) {
      console.error('Recommendation fetch failed:', err);
      setErrorMessage(err?.message || 'Could not connect to recommendation engine.');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;
    const text = inputValue.trim();
    const query = parseQueryFromText(text, conversationState);
    executeRecommendationQuery(query, text);
    setInputValue('');
  };

  const handleSelectSample = (sample: string) => {
    setInputValue(sample);
    const query = parseQueryFromText(sample, conversationState);
    executeRecommendationQuery(query, sample);
  };

  // Explicit user permission geolocation request
  const handleRequestGeolocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage('Geolocation is not supported by your browser.');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const geoCoords: GeoCoordinates = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        const query: RecommendationQuery = {
          geoCoordinates: geoCoords,
          operationalOnly: true,
        };
        executeRecommendationQuery(query, 'Find water points near my current GPS location');
      },
      (err) => {
        setLoading(false);
        setErrorMessage(`Location permission declined or unavailable (${err.message}). Please select your building manually.`);
      },
      { timeout: 8000 }
    );
  };

  // Follow-up refinement actions
  const handleRefineChilled = () => {
    const query: RecommendationQuery = {
      buildingId: conversationState.currentLocation?.buildingId,
      geoCoordinates: conversationState.currentLocation?.geoCoordinates,
      floor: conversationState.selectedFloor,
      requiresChilled: true,
      candidateWaterPointIds: conversationState.lastReturnedWaterPointIds,
      operationalOnly: true,
    };
    executeRecommendationQuery(query, 'Filter for chilled water dispensers only');
  };

  const handleResetConversation = () => {
    setConversationState({
      preferences: {
        chilledOnly: false,
        roPurifiedOnly: false,
        operationalOnly: true,
      },
      lastReturnedWaterPointIds: [],
      conversationHistory: [],
    });
    setLatestResult(null);
    setErrorMessage(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      {/* Navigation Kicker */}
      <div className="flex items-center justify-between">
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Overview</span>
        </button>

        <div className="flex items-center gap-2">
          {conversationState.conversationHistory.length > 0 && (
            <button
              onClick={handleResetConversation}
              className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Context</span>
            </button>
          )}
          <span className="text-xs text-slate-400">·</span>
          <span className="text-xs text-slate-500 font-mono">Backend Engine v1.0</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-7 shadow-xs space-y-6">
        {/* Header */}
        <div className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-teal-800 text-xs font-semibold mb-1">
              <Bot className="w-4 h-4 text-teal-700" />
              <span>Intelligent Campus Water Assistant</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Find the best dispenser for your location.
            </h1>
          </div>

          {conversationState.currentLocation && (
            <div className="px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-xs text-teal-950 font-medium shrink-0 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-teal-700" />
              <span>Context: {conversationState.currentLocation.buildingName || 'Shared GPS'}</span>
            </div>
          )}
        </div>

        {/* Grounded Architecture Guarantee */}
        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5">
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <Database className="w-4 h-4 text-teal-800" />
            <span>Deterministic Scoring Engine</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Recommendations are scored mathematically on the Express backend using building proximity, floor convenience, verification freshness, and defect penalties. No simulated distances or unverified building adjacencies.
          </p>
        </div>

        {/* Error notice */}
        {errorMessage && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Sample Student Queries */}
        <div>
          <span className="block text-xs font-semibold text-slate-700 mb-2">
            Try a query:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SAMPLE_QUESTIONS.map((question, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelectSample(question)}
                className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-slate-100 text-left text-xs text-slate-700 transition-colors cursor-pointer"
              >
                &ldquo;{question}&rdquo;
              </button>
            ))}
          </div>
        </div>

        {/* Query Input with Geolocation Option */}
        <form onSubmit={handleSend} className="space-y-3">
          <label className="block text-xs font-semibold text-slate-700">
            Your Campus Question or Building
          </label>
          <div className="relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="e.g. Find cold water in Block 34, or Is Floor 2 in Block 28 working?"
              className="w-full pl-3 pr-20 py-2.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-teal-700 text-slate-800 placeholder-slate-400"
            />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                type="button"
                onClick={handleRequestGeolocation}
                title="Use current GPS location (explicit permission only)"
                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-teal-800 transition-colors cursor-pointer"
              >
                <Compass className="w-4 h-4" />
              </button>
              <button
                type="submit"
                disabled={!inputValue.trim() || loading}
                className="p-1.5 rounded-md bg-teal-800 hover:bg-teal-900 disabled:opacity-40 text-white transition-colors cursor-pointer"
                title="Submit Query"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </form>

        {/* Results Stream / Recommendations Display */}
        {loading && (
          <div className="py-8 text-center text-xs text-slate-500 space-y-2">
            <div className="w-5 h-5 border-2 border-teal-800 border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Evaluating campus proximity and verification freshness...</p>
          </div>
        )}

        {!loading && latestResult && (
          <div className="space-y-4 pt-2">
            {/* Resolution Status Header */}
            <div
              className={`p-3.5 rounded-lg border text-xs ${
                latestResult.status === 'resolved'
                  ? 'bg-teal-50/70 border-teal-200 text-teal-950'
                  : latestResult.status === 'needs_location'
                  ? 'bg-amber-50 border-amber-200 text-amber-950'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <div className="font-semibold flex items-center gap-1.5 mb-1">
                {latestResult.status === 'resolved' && <CheckCircle2 className="w-4 h-4 text-teal-700" />}
                {latestResult.status === 'needs_location' && <MapPin className="w-4 h-4 text-amber-700" />}
                {latestResult.status === 'no_matches' && <Info className="w-4 h-4 text-slate-600" />}
                <span>{latestResult.message}</span>
              </div>

              {latestResult.status === 'needs_location' && (
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-amber-800 font-medium">Quick select your building:</span>
                  {buildings.slice(0, 4).map((b) => (
                    <button
                      key={b.id}
                      onClick={() =>
                        executeRecommendationQuery(
                          { buildingId: b.id, operationalOnly: true },
                          `I am at ${b.name}`
                        )
                      }
                      className="px-2.5 py-1 rounded bg-white border border-amber-300 text-amber-950 text-xs font-semibold hover:bg-amber-100 cursor-pointer"
                    >
                      {b.name}
                    </button>
                  ))}
                  <button
                    onClick={handleRequestGeolocation}
                    className="px-2.5 py-1 rounded bg-teal-800 text-white text-xs font-semibold hover:bg-teal-900 cursor-pointer flex items-center gap-1"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Share Location</span>
                  </button>
                </div>
              )}
            </div>

            {/* Conversational Refinement Buttons (when we have results) */}
            {latestResult.recommendations.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs font-semibold text-slate-600">Refine results:</span>
                <button
                  onClick={handleRefineChilled}
                  className="px-2.5 py-1 rounded-md text-xs font-medium border border-slate-200 hover:border-teal-700 hover:bg-teal-50 text-slate-700 flex items-center gap-1 cursor-pointer"
                >
                  <Droplets className="w-3.5 h-3.5 text-teal-700" />
                  <span>Chilled Water Only</span>
                </button>
              </div>
            )}

            {/* Ranked Recommendations List */}
            <div className="space-y-3">
              {latestResult.recommendations.map((ranked, idx) => {
                const wp = ranked.waterPoint;
                return (
                  <div
                    key={wp.id}
                    className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2.5 hover:border-slate-300 transition-all"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-teal-800 text-white text-[11px] font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-900">
                            {ranked.building.name} · {wp.floorNumber === 0 ? 'Ground Floor' : `Floor ${wp.floorNumber}`}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500">
                            (Score: {ranked.score})
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 font-medium mt-1 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                          <span>{wp.locationDetails}</span>
                        </p>
                      </div>

                      <button
                        onClick={() => onNavigateFind(wp.buildingId, wp.floorNumber)}
                        className="py-1 px-2.5 rounded-md text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 transition-colors shrink-0 cursor-pointer flex items-center gap-1"
                      >
                        <span>View</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Match Reasons */}
                    <div className="pt-1 flex flex-wrap gap-1.5">
                      {ranked.matchReasons.map((reason, rIdx) => (
                        <span
                          key={rIdx}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50/80 px-2 py-0.5 rounded border border-emerald-200"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{reason}</span>
                        </span>
                      ))}

                      {ranked.caveats.map((caveat, cIdx) => (
                        <span
                          key={cIdx}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50/80 px-2 py-0.5 rounded border border-amber-200"
                        >
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>{caveat}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
