import React, { useState } from 'react';
import {
  Search,
  MapPin,
  Building2,
  Droplets,
  ArrowRight,
  SlidersHorizontal,
  Info,
  AlertTriangle,
  HelpCircle,
  Eye,
  Hash,
} from 'lucide-react';
import { Building, WaterPoint, MapReference } from '../types';
import { CampusMapCanvas } from '../components/CampusMapCanvas';

interface CampusMapViewProps {
  buildings: Building[];
  waterPoints?: WaterPoint[];
  mapReferences?: MapReference[];
  unconfiguredLegend?: Array<{ mapNumber: number; legendLabel: string; category: string }>;
  onNavigateFind: (buildingId?: string, floor?: number) => void;
  onNavigateAdminMap: (focusRefId?: string) => void;
}

export const CampusMapView: React.FC<CampusMapViewProps> = ({
  buildings,
  waterPoints = [],
  mapReferences = [],
  unconfiguredLegend = [],
  onNavigateFind,
  onNavigateAdminMap,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [selectedMapReference, setSelectedMapReference] = useState<MapReference | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<number>(0);
  const [showHotspots, setShowHotspots] = useState(true);
  const [showBuildingPins, setShowBuildingPins] = useState(true);

  // Filter buildings by name, code, or zone
  const filteredBuildings = buildings.filter(
    (b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.campusZone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedCount = buildings.filter((b) => Boolean(b.coordinates)).length;
  const unpinnedCount = buildings.length - pinnedCount;

  const identifiedHotspotsCount = mapReferences.filter((r) => r.identificationStatus === 'IDENTIFIED').length;
  const unidentifiedHotspotsCount = mapReferences.filter((r) => r.identificationStatus === 'UNIDENTIFIED').length;

  const handleSelectBuilding = (building: Building) => {
    setSelectedBuilding(building);
    setSelectedFloor(0);
    // Also find linked map reference if any
    const linkedRef = mapReferences.find((r) => r.linkedBuildingId === building.id);
    setSelectedMapReference(linkedRef || null);
  };

  const handleSelectMapReference = (ref: MapReference) => {
    setSelectedMapReference(ref);
    if (ref.linkedBuildingId) {
      const b = buildings.find((b) => b.id === ref.linkedBuildingId);
      if (b) {
        setSelectedBuilding(b);
        setSelectedFloor(0);
        return;
      }
    }
    // Unidentified: clear selected building so unknown panel displays
    setSelectedBuilding(null);
  };

  return (
    <div className="space-y-4 pb-16">
      {/* Header & Controls Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-800 mb-1">
            <MapPin className="w-4 h-4 text-teal-700" />
            <span>Interactive Campus Guide</span>
            <span aria-hidden="true">·</span>
            <span>Lovely Professional University</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Campus Water Map
          </h1>
        </div>

        {/* Search bar & Layer Toggles & Admin link */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search block, e.g. B34, Library..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-teal-700 text-slate-800 placeholder-slate-400 shadow-xs"
            />
          </div>

          {/* Hotspots toggle */}
          <button
            onClick={() => setShowHotspots(!showHotspots)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${
              showHotspots
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="Toggle printed number hotspots overlay"
          >
            <Hash className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Numbers</span>
          </button>

          <button
            onClick={() => onNavigateAdminMap(selectedMapReference?.id)}
            title="Open Admin Map Editor to place markers and manage hotspots"
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold whitespace-nowrap shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-teal-800" />
            <span className="hidden sm:inline">Admin Map Editor</span>
            <span className="sm:hidden">Admin</span>
          </button>
        </div>
      </div>

      {/* Main Map + Sidebar Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Map Viewport Area (8 cols on desktop) */}
        <div className="lg:col-span-8 flex flex-col h-[520px] sm:h-[600px] bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <CampusMapCanvas
            buildings={buildings}
            waterPoints={waterPoints}
            mapReferences={mapReferences}
            selectedBuildingId={selectedBuilding?.id}
            selectedMapReferenceId={selectedMapReference?.id}
            onSelectBuilding={handleSelectBuilding}
            onSelectMapReference={handleSelectMapReference}
            showHotspots={showHotspots}
            showBuildingPins={showBuildingPins}
            className="flex-1 rounded-none border-none"
          />

          {/* Map legend & status bar */}
          <div className="bg-white border-t border-slate-200 px-4 py-2 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-teal-900 inline-block" />
                <span>Building Pin</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-900 border border-cyan-400 inline-block" />
                <span>Linked # ({identifiedHotspotsCount})</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-amber-300 inline-block" />
                <span>Unconfigured # ({unidentifiedHotspotsCount})</span>
              </span>
            </div>

            <div className="text-[11px] font-mono text-slate-600">
              <span>{pinnedCount} pinned</span>
              <span aria-hidden="true" className="mx-1">·</span>
              <span>{mapReferences.length} map numbers active</span>
            </div>
          </div>
        </div>

        {/* Sidebar: Selected Building Panel or Search Results (4 cols) */}
        <div className="lg:col-span-4 flex flex-col h-[520px] sm:h-[600px] space-y-4">
          {/* Selected Building Details Drawer */}
          {selectedBuilding ? (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex-1 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                        {selectedBuilding.name}
                      </h2>
                      <span className="text-xs font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {selectedBuilding.code}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{selectedBuilding.campusZone}</p>
                  </div>

                  <button
                    onClick={() => setSelectedBuilding(null)}
                    className="text-xs text-slate-400 hover:text-slate-600 py-1 px-1.5 rounded cursor-pointer"
                  >
                    Close
                  </button>
                </div>

                {/* Building Location Coordinates */}
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span className="font-medium">Map Coordinates:</span>
                    <span className="font-mono">
                      {selectedBuilding.coordinates
                        ? `X: ${selectedBuilding.coordinates.x}%, Y: ${selectedBuilding.coordinates.y}%`
                        : 'Not yet pinned on map'}
                    </span>
                  </div>
                  {selectedBuilding.accessInfo && (
                    <div className="text-slate-500 text-[11px] pt-1 border-t border-slate-200">
                      <strong>Access info:</strong> {selectedBuilding.accessInfo}
                    </div>
                  )}
                </div>

                {/* Floor Explorer */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-700">
                      Explore Building Floors
                    </span>
                    <span className="text-xs text-slate-500">{selectedBuilding.floorsCount} levels</span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                    {Array.from({ length: selectedBuilding.floorsCount }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedFloor(idx)}
                        className={`py-1.5 px-2 text-xs font-medium rounded-md transition-colors cursor-pointer border ${
                          selectedFloor === idx
                            ? 'bg-teal-800 text-white border-teal-800'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {idx === 0 ? 'Ground' : `Floor ${idx}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Water points preview for this floor */}
                <div className="p-3 rounded-lg bg-teal-50/70 border border-teal-200 text-xs space-y-2">
                  <div className="flex items-center justify-between text-teal-950 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Droplets className="w-3.5 h-3.5 text-teal-700" />
                      <span>{selectedFloor === 0 ? 'Ground Floor' : `Floor ${selectedFloor}`} Dispensers</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    View purifier types, chilled status, and confirmation timestamps for this level.
                  </p>
                </div>
              </div>

              {/* Action CTA: Navigate to Find Water with this building and floor */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <button
                  onClick={() => onNavigateFind(selectedBuilding.id, selectedFloor)}
                  className="w-full py-2.5 px-4 rounded-lg bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                >
                  <span>View Dispensers on Floor {selectedFloor === 0 ? 'Ground' : selectedFloor}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                {!selectedBuilding.coordinates && (
                  <button
                    onClick={() => onNavigateAdminMap()}
                    className="w-full py-2 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium text-center transition-colors cursor-pointer"
                  >
                    Pin this building in Admin Editor &rarr;
                  </button>
                )}
              </div>
            </div>
          ) : selectedMapReference && !selectedBuilding ? (
            /* Unidentified Printed Map Reference Details Drawer (Step 4A) */
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex-1 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-4">
                {/* Header with printed badge representation */}
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-mono text-xs font-bold flex items-center justify-center shadow-xs shrink-0">
                      {selectedMapReference.mapNumber}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h2 className="text-base font-bold text-slate-900 tracking-tight">
                          Map Reference #{selectedMapReference.mapNumber}
                        </h2>
                        <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                          Unidentified
                        </span>
                      </div>
                      {selectedMapReference.legendLabel && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          Guide Map Label: <span className="font-semibold text-slate-700">{selectedMapReference.legendLabel}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedMapReference(null)}
                    className="text-xs text-slate-400 hover:text-slate-600 py-1 px-1.5 rounded cursor-pointer"
                  >
                    Close
                  </button>
                </div>

                {/* Primary Status Banner: Honest & Transparent */}
                <div className="p-3.5 rounded-lg bg-amber-50/90 border border-amber-200 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-950 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Building information not yet configured</span>
                  </div>
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    Printed location <strong>#{selectedMapReference.mapNumber}</strong> is marked on the official campus guide map, but no verified building record is currently linked to it in the directory.
                  </p>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Operational status, drinking water dispenser locations, floor plans, and accessibility details have not been verified. Empty Bottle does not fabricate unverified campus facilities.
                  </p>
                </div>

                {/* Physical Coordinates Info */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                  <h3 className="font-semibold text-slate-800 text-[11px]">Map Position</h3>
                  <div className="flex justify-between text-slate-600 font-mono text-[11px]">
                    <span>Normalized Coordinates:</span>
                    <span>X: {selectedMapReference.map_x}%, Y: {selectedMapReference.map_y}%</span>
                  </div>
                  {selectedMapReference.notes && (
                    <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                      <strong>Notes:</strong> {selectedMapReference.notes}
                    </div>
                  )}
                </div>

                {/* Community / Administrator note */}
                <div className="p-3 rounded-lg bg-teal-50/70 border border-teal-200 text-xs space-y-1">
                  <span className="font-semibold text-teal-950 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-teal-700" />
                    <span>Administrator Association</span>
                  </span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    To associate this printed number with a building or create a new building record for it, use the Admin Map Editor.
                  </p>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <button
                  onClick={() => onNavigateAdminMap(selectedMapReference.id)}
                  className="w-full py-2.5 px-4 rounded-lg bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                >
                  <span>Configure #{selectedMapReference.mapNumber} in Admin Editor</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setSelectedMapReference(null)}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium text-center transition-colors cursor-pointer"
                >
                  Return to Campus Directory
                </button>
              </div>
            </div>
          ) : (
            /* Searchable Building Directory List (when no building selected) */
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex-1 flex flex-col overflow-hidden">
              <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Campus Directory
                </h2>
                <span className="text-xs text-slate-500 font-mono">
                  {filteredBuildings.length} of {buildings.length}
                </span>
              </div>

              {/* Informational callout regarding coordinate verification */}
              <div className="my-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-xs flex items-start gap-2">
                <Info className="w-4 h-4 text-teal-800 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  Click any building to view floor plans or focus on the map. Buildings marked <em>Unpinned</em> can be given verified coordinates in the Admin Map Editor.
                </p>
              </div>

              <div className="divide-y divide-slate-100 overflow-y-auto flex-1 pr-1">
                {filteredBuildings.map((building) => (
                  <div
                    key={building.id}
                    onClick={() => handleSelectBuilding(building)}
                    className="py-2.5 px-2 hover:bg-slate-50/80 rounded-md transition-colors cursor-pointer flex items-center justify-between group"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-900 group-hover:text-teal-900 truncate">
                          {building.name}
                        </span>
                        <span className="text-[10px] font-mono font-medium text-slate-500">
                          ({building.code})
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {building.campusZone} · {building.floorsCount} Floors
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      {building.coordinates ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          <MapPin className="w-3 h-3 text-teal-700" />
                          <span>Pinned</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          Unpinned
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
