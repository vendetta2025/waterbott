import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { HomeView } from './views/HomeView';
import { FindWaterView } from './views/FindWaterView';
import { CampusMapView } from './views/CampusMapView';
import { AdminMapEditorView } from './views/AdminMapEditorView';
import { ReportProblemView } from './views/ReportProblemView';
import { AskAiView } from './views/AskAiView';
import { ActiveTab, Building, MapReference } from './types';
import { checkBackendHealth, fetchBuildings, fetchMapReferences } from './services/api';

// Initial fallback building records if network request is pending
const INITIAL_BUILDINGS: Building[] = [
  {
    id: 'b-34',
    name: 'Block 34',
    code: 'B34',
    campusZone: 'Academic Core (East)',
    mapNumber: 34,
    floorsCount: 6,
    activeWaterPointsCount: 11,
    totalWaterPointsCount: 12,
    accessInfo: 'Near central academic plaza, accessible via east and west lobbies',
    coordinates: { x: 32.45, y: 47.42 },
  },
  {
    id: 'b-28',
    name: 'Block 28',
    code: 'B28',
    campusZone: 'Engineering & Computing',
    mapNumber: 28,
    floorsCount: 5,
    activeWaterPointsCount: 9,
    totalWaterPointsCount: 10,
    accessInfo: 'Adjacent to computing labs corridor',
    coordinates: { x: 30.28, y: 46.79 },
  },
  {
    id: 'b-38',
    name: 'Block 38',
    code: 'B38',
    campusZone: 'Management & Arts',
    mapNumber: 38,
    floorsCount: 4,
    activeWaterPointsCount: 7,
    totalWaterPointsCount: 8,
    accessInfo: 'South entrance with elevator access',
    coordinates: { x: 30.10, y: 47.21 },
  },
  {
    id: 'b-14',
    name: 'Block 14',
    code: 'B14',
    campusZone: 'Sciences Wing',
    mapNumber: 14,
    floorsCount: 4,
    activeWaterPointsCount: 6,
    totalWaterPointsCount: 6,
    accessInfo: 'Near central sciences lawn',
    coordinates: { x: 31.24, y: 51.32 },
  },
  {
    id: 'b-lib',
    name: 'Central Library',
    code: 'LIB',
    campusZone: 'Central Spine',
    mapNumber: 35,
    floorsCount: 4,
    activeWaterPointsCount: 8,
    totalWaterPointsCount: 8,
    accessInfo: 'Main library foyer with turnstiles',
    coordinates: { x: 33.29, y: 50.37 },
  },
  {
    id: 'b-umall',
    name: 'Student Centre / Uni-Mall',
    code: 'UMALL',
    campusZone: 'Commercial & Student Services',
    mapNumber: 13,
    floorsCount: 3,
    activeWaterPointsCount: 5,
    totalWaterPointsCount: 6,
    accessInfo: 'Food court and student retail hub',
    coordinates: { x: 35.10, y: 59.33 },
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [buildings, setBuildings] = useState<Building[]>(INITIAL_BUILDINGS);
  const [mapReferences, setMapReferences] = useState<MapReference[]>([]);
  const [unconfiguredLegend, setUnconfiguredLegend] = useState<
    Array<{ mapNumber: number; legendLabel: string; category: string }>
  >([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('b-34');
  const [selectedFloor, setSelectedFloor] = useState<number | 'all'>('all');
  const [selectedRefId, setSelectedRefId] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<{ ok: boolean; version?: string } | null>(null);

  // Load buildings from Express backend
  const loadBuildings = async () => {
    try {
      const result = await fetchBuildings();
      if (result.buildings && result.buildings.length > 0) {
        setBuildings(result.buildings);
      }
    } catch (err) {
      console.warn('Could not fetch buildings from backend, using current state:', err);
    }
  };

  // Load map references from Express backend
  const loadMapReferences = async () => {
    try {
      const result = await fetchMapReferences();
      if (result.data) {
        setMapReferences(result.data);
      }
      if (result.unconfiguredLegend) {
        setUnconfiguredLegend(result.unconfiguredLegend);
      }
    } catch (err) {
      console.warn('Could not fetch map references from backend:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Check URL path on mount (e.g. direct load of /admin/map or #admin-map)
    const currentPath = window.location.pathname;
    const currentHash = window.location.hash;
    if (currentPath === '/admin/map' || currentHash === '#admin-map' || currentHash === '#/admin/map') {
      setActiveTab('admin_map');
    } else if (currentPath === '/map' || currentHash === '#map') {
      setActiveTab('map');
    }

    // Health check
    checkBackendHealth()
      .then((data) => {
        if (isMounted) {
          setServerStatus({ ok: data.status === 'ok', version: data.version });
        }
      })
      .catch((err) => {
        console.warn('Backend health check error:', err);
        if (isMounted) {
          setServerStatus({ ok: false });
        }
      });

    // Initial data load
    loadBuildings();
    loadMapReferences();

    // Listen for browser popstate
    const handlePopState = () => {
      if (window.location.pathname === '/admin/map') {
        setActiveTab('admin_map');
      } else if (window.location.pathname === '/map') {
        setActiveTab('map');
      }
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      isMounted = false;
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleNavigate = (tab: ActiveTab, preselectedBuilding?: string) => {
    if (preselectedBuilding) {
      setSelectedBuildingId(preselectedBuilding);
    }
    setActiveTab(tab);

    // Update browser URL history without page reload
    if (tab === 'admin_map') {
      window.history.pushState({}, '', '/admin/map');
    } else if (tab === 'map') {
      window.history.pushState({}, '', '/map');
    } else if (window.location.pathname === '/admin/map' || window.location.pathname === '/map') {
      window.history.pushState({}, '', '/');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateReportWithContext = (buildingId?: string, floor?: number) => {
    if (buildingId) setSelectedBuildingId(buildingId);
    if (typeof floor === 'number') setSelectedFloor(floor);
    setActiveTab('report');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateFindWithContext = (buildingId?: string, floor?: number) => {
    if (buildingId) setSelectedBuildingId(buildingId);
    if (typeof floor === 'number') setSelectedFloor(floor);
    setActiveTab('find');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateAdminMap = (refId?: string) => {
    if (refId) {
      setSelectedRefId(refId);
    }
    handleNavigate('admin_map');
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col font-sans selection:bg-teal-100 selection:text-teal-900">
      {/* Top Bar - Hide standard top bar if in full-screen admin editor */}
      <Navbar activeTab={activeTab} onNavigate={handleNavigate} />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'home' && (
          <HomeView
            buildings={buildings}
            onNavigate={handleNavigate}
            serverStatus={serverStatus}
          />
        )}

        {activeTab === 'find' && (
          <FindWaterView
            buildings={buildings}
            initialBuildingId={selectedBuildingId}
            initialFloor={selectedFloor}
            onNavigateHome={() => handleNavigate('home')}
            onNavigateReport={handleNavigateReportWithContext}
          />
        )}

        {activeTab === 'map' && (
          <CampusMapView
            buildings={buildings}
            mapReferences={mapReferences}
            unconfiguredLegend={unconfiguredLegend}
            onNavigateFind={handleNavigateFindWithContext}
            onNavigateAdminMap={handleNavigateAdminMap}
          />
        )}

        {activeTab === 'admin_map' && (
          <AdminMapEditorView
            buildings={buildings}
            mapReferences={mapReferences}
            unconfiguredLegend={unconfiguredLegend}
            initialSelectedRefId={selectedRefId}
            onRefreshBuildings={loadBuildings}
            onRefreshMapReferences={loadMapReferences}
            onNavigateStudentMap={() => handleNavigate('map')}
          />
        )}

        {activeTab === 'report' && (
          <ReportProblemView
            buildings={buildings}
            initialBuildingId={selectedBuildingId}
            initialFloor={typeof selectedFloor === 'number' ? selectedFloor : 1}
            onNavigateHome={() => handleNavigate('home')}
            onNavigateFind={() => handleNavigate('find')}
          />
        )}

        {activeTab === 'ask_ai' && (
          <AskAiView
            buildings={buildings}
            onNavigateHome={() => handleNavigate('home')}
            onNavigateFind={handleNavigateFindWithContext}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav activeTab={activeTab} onNavigate={handleNavigate} />

      {/* Quiet, Human-Engineered Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mb-16 md:mb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">Empty Bottle</span>
            <span aria-hidden="true">·</span>
            <span>Lovely Professional University</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleNavigate('admin_map')}
              className="text-slate-500 hover:text-teal-800 underline decoration-slate-300 hover:decoration-teal-800 transition-colors cursor-pointer"
            >
              Admin Map Portal (/admin/map)
            </button>
            <span aria-hidden="true">·</span>
            <span>Zero Tracking</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
