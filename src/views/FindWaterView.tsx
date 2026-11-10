import React, { useState } from 'react';
import { Search, MapPin, CheckCircle2, AlertCircle, Droplets, Filter, ArrowLeft, ThumbsUp } from 'lucide-react';
import { Building, WaterPoint, OperationalStatus } from '../types';

export const SAMPLE_WATER_POINTS: WaterPoint[] = [
  {
    id: 'wp-34-g1',
    buildingId: 'b-34',
    buildingName: 'Block 34',
    floorNumber: 0,
    locationDetails: 'Ground Floor, East Wing near Staircase 1 & Washrooms',
    dispenserType: 'chilled_and_normal',
    operationalStatus: 'operational',
    lastVerifiedAt: '25 mins ago',
    confirmationsToday: 6,
    recentIssueReported: false,
  },
  {
    id: 'wp-34-1a',
    buildingId: 'b-34',
    buildingName: 'Block 34',
    floorNumber: 1,
    locationDetails: 'Floor 1, North Corridor outside Lecture Hall 104',
    dispenserType: 'chilled_and_normal',
    operationalStatus: 'operational',
    lastVerifiedAt: '12 mins ago',
    confirmationsToday: 8,
    recentIssueReported: false,
  },
  {
    id: 'wp-34-2a',
    buildingId: 'b-34',
    buildingName: 'Block 34',
    floorNumber: 2,
    locationDetails: 'Floor 2, Central Elevator lobby',
    dispenserType: 'ro_purified',
    operationalStatus: 'operational',
    lastVerifiedAt: '1 hour ago',
    confirmationsToday: 4,
    recentIssueReported: false,
  },
  {
    id: 'wp-34-3a',
    buildingId: 'b-34',
    buildingName: 'Block 34',
    floorNumber: 3,
    locationDetails: 'Floor 3, East Wing near Faculty Cabins',
    dispenserType: 'chilled_and_normal',
    operationalStatus: 'low_pressure',
    lastVerifiedAt: '45 mins ago',
    confirmationsToday: 2,
    recentIssueReported: true,
  },
  {
    id: 'wp-28-g1',
    buildingId: 'b-28',
    buildingName: 'Block 28',
    floorNumber: 0,
    locationDetails: 'Ground Floor, Main Entrance Foyer near Security Desk',
    dispenserType: 'chilled_and_normal',
    operationalStatus: 'operational',
    lastVerifiedAt: '18 mins ago',
    confirmationsToday: 9,
    recentIssueReported: false,
  },
  {
    id: 'wp-28-2a',
    buildingId: 'b-28',
    buildingName: 'Block 28',
    floorNumber: 2,
    locationDetails: 'Floor 2, Computer Labs wing near Lab 206',
    dispenserType: 'chilled_and_normal',
    operationalStatus: 'operational',
    lastVerifiedAt: '35 mins ago',
    confirmationsToday: 5,
    recentIssueReported: false,
  },
  {
    id: 'wp-lib-g1',
    buildingId: 'b-lib',
    buildingName: 'Central Library',
    floorNumber: 0,
    locationDetails: 'Ground Floor, Circulation Desk left corridor',
    dispenserType: 'chilled_and_normal',
    operationalStatus: 'operational',
    lastVerifiedAt: '10 mins ago',
    confirmationsToday: 14,
    recentIssueReported: false,
  },
  {
    id: 'wp-lib-1a',
    buildingId: 'b-lib',
    buildingName: 'Central Library',
    floorNumber: 1,
    locationDetails: 'Floor 1, Quiet Reading Hall adjacent to Stacks 12-16',
    dispenserType: 'ro_purified',
    operationalStatus: 'operational',
    lastVerifiedAt: '40 mins ago',
    confirmationsToday: 7,
    recentIssueReported: false,
  },
];

interface FindWaterViewProps {
  buildings: Building[];
  initialBuildingId?: string;
  initialFloor?: number | 'all';
  onNavigateHome: () => void;
  onNavigateReport: (buildingId?: string, floor?: number) => void;
}

export const FindWaterView: React.FC<FindWaterViewProps> = ({
  buildings,
  initialBuildingId = 'b-34',
  initialFloor = 'all',
  onNavigateHome,
  onNavigateReport,
}) => {
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>(initialBuildingId);
  const [selectedFloor, setSelectedFloor] = useState<number | 'all'>(initialFloor);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [confirmedPoints, setConfirmedPoints] = useState<Record<string, boolean>>({});

  const activeBuilding = buildings.find((b) => b.id === selectedBuildingId) || buildings[0] || {
    id: 'unknown',
    name: 'Selected Block',
    code: 'BLK',
    campusZone: 'Campus',
    floorsCount: 4,
    activeWaterPointsCount: 0,
    totalWaterPointsCount: 0,
  };

  const handleConfirmWorking = (id: string) => {
    setConfirmedPoints((prev) => ({
      ...prev,
      [id]: true,
    }));
  };

  const filteredPoints = SAMPLE_WATER_POINTS.filter((p) => {
    if (p.buildingId !== selectedBuildingId) return false;
    if (selectedFloor !== 'all' && p.floorNumber !== selectedFloor) return false;
    if (filterType === 'chilled' && p.dispenserType !== 'chilled_and_normal') return false;
    if (filterType === 'operational' && p.operationalStatus !== 'operational') return false;
    if (searchFilter && !p.locationDetails.toLowerCase().includes(searchFilter.toLowerCase())) return false;
    return true;
  });

  const getStatusBadge = (status: OperationalStatus) => {
    switch (status) {
      case 'operational':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Operational
          </span>
        );
      case 'low_pressure':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-800">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            Low Pressure
          </span>
        );
      case 'maintenance':
      case 'offline':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
            Maintenance
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Navigation Kicker */}
      <div className="flex items-center justify-between">
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Overview</span>
        </button>

        <div className="text-xs text-slate-500">
          Showing verified campus dispensers
        </div>
      </div>

      {/* Building Selector Strip */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Select Campus Block
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {buildings.map((building) => (
              <button
                key={building.id}
                onClick={() => {
                  setSelectedBuildingId(building.id);
                  setSelectedFloor('all');
                }}
                className={`p-2.5 rounded-lg text-left transition-all border cursor-pointer ${
                  selectedBuildingId === building.id
                    ? 'bg-teal-50 border-teal-700 text-teal-900 shadow-xs'
                    : 'bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-100/70'
                }`}
              >
                <div className="text-xs font-bold">{building.name}</div>
                <div className="text-[11px] text-slate-500 truncate">{building.code} · {building.floorsCount} Fl</div>
              </button>
            ))}
          </div>
        </div>

        {/* Floor and Filter Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Floor Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-medium text-slate-500 shrink-0 mr-1">Floor:</span>
            <button
              onClick={() => setSelectedFloor('all')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                selectedFloor === 'all'
                  ? 'bg-teal-800 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Floors
            </button>
            {Array.from({ length: activeBuilding.floorsCount }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedFloor(idx)}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  selectedFloor === idx
                    ? 'bg-teal-800 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {idx === 0 ? 'Ground' : `Floor ${idx}`}
              </button>
            ))}
          </div>

          {/* Quick Filter & Search */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Filter corridor, wing..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1 text-xs rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-700"
              />
            </div>

            <button
              onClick={() => setFilterType((prev) => (prev === 'all' ? 'chilled' : 'all'))}
              className={`px-2.5 py-1 text-xs rounded-md font-medium border transition-colors cursor-pointer flex items-center gap-1 ${
                filterType === 'chilled'
                  ? 'bg-teal-800 text-white border-teal-800'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Droplets className="w-3 h-3" />
              <span>Chilled Only</span>
            </button>
          </div>
        </div>
      </div>

      {/* Water Points Results Feed */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>
            {activeBuilding.name} · {selectedFloor === 'all' ? 'All Floors' : selectedFloor === 0 ? 'Ground Floor' : `Floor ${selectedFloor}`}
          </span>
          <span>{filteredPoints.length} water point{filteredPoints.length === 1 ? '' : 's'} found</span>
        </div>

        {filteredPoints.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
              <Droplets className="w-5 h-5 text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">No water dispensers found for this selection</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No points match your floor or search criteria in {activeBuilding.name}. You can report a new water point or check an adjacent floor.
            </p>
            <button
              onClick={() => onNavigateReport(activeBuilding.id, typeof selectedFloor === 'number' ? selectedFloor : 0)}
              className="mt-2 py-1.5 px-3 rounded-lg bg-teal-800 text-white text-xs font-medium hover:bg-teal-900 transition-colors cursor-pointer"
            >
              Report Missing Point
            </button>
          </div>
        ) : (
          filteredPoints.map((point) => {
            const hasConfirmed = confirmedPoints[point.id];
            return (
              <div
                key={point.id}
                className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {point.floorNumber === 0 ? 'Ground Floor' : `Floor ${point.floorNumber}`}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      {getStatusBadge(point.operationalStatus)}
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="text-xs text-slate-500">
                        {point.dispenserType === 'chilled_and_normal'
                          ? 'RO Chilled & Ambient'
                          : 'RO Purified'}
                      </span>
                    </div>

                    <p className="text-sm text-slate-800 font-medium flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-teal-800 shrink-0" />
                      <span>{point.locationDetails}</span>
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                      <span>Verified {point.lastVerifiedAt}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        <span className="tabular-nums font-semibold text-slate-700">
                          {point.confirmationsToday + (hasConfirmed ? 1 : 0)}
                        </span>{' '}
                        confirmations today
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 sm:pt-0 sm:self-center shrink-0">
                    <button
                      onClick={() => handleConfirmWorking(point.id)}
                      disabled={hasConfirmed}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        hasConfirmed
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 cursor-default'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                      }`}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${hasConfirmed ? 'text-emerald-700' : 'text-slate-600'}`} />
                      <span>{hasConfirmed ? 'Confirmed Working' : 'Confirm Working'}</span>
                    </button>

                    <button
                      onClick={() => onNavigateReport(point.buildingId, point.floorNumber)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-amber-800 hover:bg-amber-50 border border-slate-200 transition-colors cursor-pointer"
                    >
                      Report Issue
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
