import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Building2,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  AlertCircle,
  Database,
  ArrowLeft,
  Move,
  Save,
  Info,
  Hash,
  Link2,
  Unlink,
  AlertTriangle,
  CheckCircle2,
  Search,
} from 'lucide-react';
import { Building, Coordinates, MapReference } from '../types';
import { CampusMapCanvas } from '../components/CampusMapCanvas';
import {
  createBuilding,
  updateBuilding,
  updateBuildingCoordinates,
  deleteBuilding,
  createMapReference,
  updateMapReference,
  deleteMapReference,
} from '../services/api';

interface AdminMapEditorViewProps {
  buildings: Building[];
  mapReferences?: MapReference[];
  unconfiguredLegend?: Array<{ mapNumber: number; legendLabel: string; category: string }>;
  initialSelectedRefId?: string | null;
  onRefreshBuildings: () => Promise<void>;
  onRefreshMapReferences?: () => Promise<void>;
  onNavigateStudentMap: () => void;
}

export const AdminMapEditorView: React.FC<AdminMapEditorViewProps> = ({
  buildings,
  mapReferences = [],
  unconfiguredLegend = [],
  initialSelectedRefId = null,
  onRefreshBuildings,
  onRefreshMapReferences,
  onNavigateStudentMap,
}) => {
  // Tabs: 'hotspots' (printed map numbers), 'edit' (buildings), 'add' (new building)
  const [activeTab, setActiveTab] = useState<'hotspots' | 'edit' | 'add'>(
    initialSelectedRefId ? 'hotspots' : 'hotspots'
  );

  const [notification, setNotification] = useState<{ type: 'info' | 'error' | 'success'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Common Placement mode state
  const [isPlacing, setIsPlacing] = useState(false);
  const [placementCoords, setPlacementCoords] = useState<Coordinates | null>(null);
  const [placementTarget, setPlacementTarget] = useState<'building' | 'hotspot_reposition' | 'hotspot_new'>('building');

  // ==========================================
  // Tab 1: Map Hotspots (#) Management State
  // ==========================================
  const [selectedRefId, setSelectedRefId] = useState<string>(
    initialSelectedRefId || (mapReferences[0]?.id || '')
  );
  const [hotspotSearch, setHotspotSearch] = useState('');
  const [hotspotMode, setHotspotMode] = useState<'details' | 'link_existing' | 'create_and_link' | 'add_new'>('details');

  // Form states for Hotspot operations
  const [linkBuildingId, setLinkBuildingId] = useState<string>(buildings[0]?.id || '');
  const [newLinkedName, setNewLinkedName] = useState('');
  const [newLinkedCode, setNewLinkedCode] = useState('');
  const [newLinkedZone, setNewLinkedZone] = useState('Academic Core');
  const [newLinkedFloors, setNewLinkedFloors] = useState<number>(4);

  // Form states for "Add Missing Map Hotspot"
  const [addNumber, setAddNumber] = useState<string>('');
  const [addLabel, setAddLabel] = useState<string>('');
  const [addNotes, setAddNotes] = useState<string>('');

  // Active selected map reference
  const selectedRef = mapReferences.find((r) => r.id === selectedRefId) || mapReferences[0];

  // Update selectedRefId if initialSelectedRefId changes
  useEffect(() => {
    if (initialSelectedRefId) {
      setSelectedRefId(initialSelectedRefId);
      setActiveTab('hotspots');
    }
  }, [initialSelectedRefId]);

  // ==========================================
  // Tab 2 & 3: Building Management State
  // ==========================================
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>(buildings[0]?.id || '');

  // Form states for "Add Building"
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newZone, setNewZone] = useState('Academic Core');
  const [newFloors, setNewFloors] = useState<number>(4);
  const [newAccessInfo, setNewAccessInfo] = useState('');

  // Form states for "Edit Building"
  const selectedBuilding = buildings.find((b) => b.id === selectedBuildingId) || buildings[0];
  const [editName, setEditName] = useState(selectedBuilding?.name || '');
  const [editCode, setEditCode] = useState(selectedBuilding?.code || '');
  const [editZone, setEditZone] = useState(selectedBuilding?.campusZone || '');
  const [editFloors, setEditFloors] = useState<number>(selectedBuilding?.floorsCount || 4);
  const [editAccessInfo, setEditAccessInfo] = useState(selectedBuilding?.accessInfo || '');

  // Synchronize building edit fields
  useEffect(() => {
    if (selectedBuilding) {
      setEditName(selectedBuilding.name);
      setEditCode(selectedBuilding.code);
      setEditZone(selectedBuilding.campusZone);
      setEditFloors(selectedBuilding.floorsCount);
      setEditAccessInfo(selectedBuilding.accessInfo || '');
      if (activeTab === 'edit' && !isPlacing) {
        setPlacementCoords(selectedBuilding.coordinates || null);
      }
    }
  }, [selectedBuildingId, selectedBuilding, activeTab, isPlacing]);

  const showNotification = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 4500);
  };

  // ==========================================
  // Hotspot Action Handlers (Step 4A)
  // ==========================================

  // Start repositioning an existing hotspot
  const handleStartRepositionHotspot = () => {
    if (!selectedRef) return;
    setIsPlacing(true);
    setPlacementTarget('hotspot_reposition');
    setPlacementCoords({ x: selectedRef.map_x, y: selectedRef.map_y });
    showNotification(`Click on the map or drag beacon to set new position for printed #${selectedRef.mapNumber}.`);
  };

  // Save new hotspot coordinates
  const handleSaveHotspotPosition = async () => {
    if (!selectedRef || !placementCoords) return;
    setIsSubmitting(true);
    try {
      await updateMapReference(selectedRef.id, {
        map_x: placementCoords.x,
        map_y: placementCoords.y,
      });
      await onRefreshMapReferences?.();
      await onRefreshBuildings();
      setIsPlacing(false);
      showNotification(`Saved coordinates for Map Hotspot #${selectedRef.mapNumber} (X: ${placementCoords.x}%, Y: ${placementCoords.y}%).`, 'success');
    } catch (err: any) {
      showNotification(err?.message || 'Failed to update hotspot position', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Associate hotspot with existing building
  const handleAssociateWithBuilding = async () => {
    if (!selectedRef || !linkBuildingId) return;
    setIsSubmitting(true);
    try {
      const targetBuilding = buildings.find((b) => b.id === linkBuildingId);
      await updateMapReference(selectedRef.id, {
        linkedBuildingId: linkBuildingId,
        identificationStatus: 'IDENTIFIED',
      });
      await onRefreshMapReferences?.();
      await onRefreshBuildings();
      setHotspotMode('details');
      showNotification(`Linked Map Hotspot #${selectedRef.mapNumber} with ${targetBuilding?.name || linkBuildingId}.`, 'success');
    } catch (err: any) {
      showNotification(err?.message || 'Failed to associate building', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create new building and link to hotspot
  const handleCreateAndLinkBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRef) return;
    if (!newLinkedName.trim() || !newLinkedCode.trim()) {
      showNotification('Please provide both Building Name and Unique Code.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create the building at this hotspot's coordinates
      const created = await createBuilding({
        name: newLinkedName.trim(),
        code: newLinkedCode.trim().toUpperCase(),
        campusZone: newLinkedZone.trim(),
        floorsCount: Number(newLinkedFloors),
        coordinates: { x: selectedRef.map_x, y: selectedRef.map_y },
      });

      // 2. Link hotspot to this new building
      await updateMapReference(selectedRef.id, {
        linkedBuildingId: created.id,
        identificationStatus: 'IDENTIFIED',
      });

      await onRefreshBuildings();
      await onRefreshMapReferences?.();

      setNewLinkedName('');
      setNewLinkedCode('');
      setHotspotMode('details');
      showNotification(`Created ${created.name} (${created.code}) and linked to Map Hotspot #${selectedRef.mapNumber}.`, 'success');
    } catch (err: any) {
      showNotification(err?.message || 'Failed to create and link building', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove association (Unlink) without deleting the underlying building
  const handleUnlinkHotspot = async () => {
    if (!selectedRef) return;
    if (!selectedRef.linkedBuildingId) {
      showNotification('Hotspot is already unlinked.', 'info');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateMapReference(selectedRef.id, {
        linkedBuildingId: null,
        identificationStatus: 'UNIDENTIFIED',
      });
      await onRefreshMapReferences?.();
      await onRefreshBuildings();
      showNotification(`Unlinked Map Hotspot #${selectedRef.mapNumber}. The building record remains intact in directory.`, 'success');
    } catch (err: any) {
      showNotification(err?.message || 'Failed to unlink hotspot', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Start adding a missing map hotspot
  const handleStartAddHotspot = (presetNumber?: number, presetLabel?: string) => {
    setHotspotMode('add_new');
    setIsPlacing(true);
    setPlacementTarget('hotspot_new');
    setAddNumber(presetNumber !== undefined ? String(presetNumber) : '');
    setAddLabel(presetLabel || '');
    setPlacementCoords({ x: 50, y: 50 });
    showNotification('Click anywhere on the map to pinpoint the hotspot position.');
  };

  // Save brand new map hotspot
  const handleSaveNewHotspot = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(addNumber, 10);
    if (isNaN(num) || num <= 0) {
      showNotification('Please provide a valid positive integer map number.', 'error');
      return;
    }
    if (!placementCoords) {
      showNotification('Please click on the map to set the hotspot location.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createMapReference({
        mapNumber: num,
        map_x: placementCoords.x,
        map_y: placementCoords.y,
        legendLabel: addLabel.trim() || undefined,
        notes: addNotes.trim() || undefined,
      });

      await onRefreshMapReferences?.();
      setSelectedRefId(created.id);
      setIsPlacing(false);
      setHotspotMode('details');
      setAddNumber('');
      setAddLabel('');
      setAddNotes('');
      showNotification(`Added Map Hotspot #${created.mapNumber} to campus guide.`, 'success');
    } catch (err: any) {
      showNotification(err?.message || 'Failed to add map hotspot', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // Building Action Handlers (Tabs 2 & 3)
  // ==========================================

  const handleStartBuildingPlacement = () => {
    setIsPlacing(true);
    setPlacementTarget('building');
    setPlacementCoords(selectedBuilding?.coordinates || { x: 50, y: 50 });
    showNotification('Click anywhere on the map or drag beacon to set building coordinates.');
  };

  const handleSaveBuildingCoordinates = async () => {
    if (!selectedBuilding || !placementCoords) return;
    setIsSubmitting(true);
    try {
      await updateBuildingCoordinates(selectedBuilding.id, placementCoords);
      await onRefreshBuildings();
      setIsPlacing(false);
      showNotification(`Saved coordinates for ${selectedBuilding.name} (X: ${placementCoords.x}%, Y: ${placementCoords.y}%).`, 'success');
    } catch (err: any) {
      showNotification(err?.message || 'Failed to update coordinates', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveBuildingMarker = async () => {
    if (!selectedBuilding) return;
    if (!selectedBuilding.coordinates) {
      showNotification('Building has no map marker to remove.', 'info');
      return;
    }
    setIsSubmitting(true);
    try {
      await updateBuildingCoordinates(selectedBuilding.id, null);
      await onRefreshBuildings();
      setPlacementCoords(null);
      setIsPlacing(false);
      showNotification(`Removed map coordinates for ${selectedBuilding.name}. Building remains in directory.`, 'success');
    } catch (err: any) {
      showNotification(err?.message || 'Failed to remove marker', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveBuildingDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBuilding) return;
    setIsSubmitting(true);
    try {
      await updateBuilding(selectedBuilding.id, {
        name: editName,
        code: editCode,
        campusZone: editZone,
        floorsCount: editFloors,
        accessInfo: editAccessInfo,
      });
      await onRefreshBuildings();
      showNotification(`Updated details for ${editName}.`, 'success');
    } catch (err: any) {
      showNotification(err?.message || 'Failed to update building details', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBuilding = async () => {
    if (!selectedBuilding) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedBuilding.name}?`)) return;
    setIsSubmitting(true);
    try {
      await deleteBuilding(selectedBuilding.id);
      await onRefreshBuildings();
      await onRefreshMapReferences?.();
      showNotification(`Deleted ${selectedBuilding.name} from directory.`, 'info');
    } catch (err: any) {
      showNotification(err?.message || 'Failed to delete building', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateNewBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newCode.trim()) {
      showNotification('Please provide both Building Name and Unique Code.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createBuilding({
        name: newName.trim(),
        code: newCode.trim(),
        campusZone: newZone.trim(),
        floorsCount: Number(newFloors),
        accessInfo: newAccessInfo.trim(),
        coordinates: placementCoords,
      });
      await onRefreshBuildings();
      setSelectedBuildingId(created.id);
      setActiveTab('edit');
      setIsPlacing(false);
      setNewName('');
      setNewCode('');
      setNewAccessInfo('');
      showNotification(`Successfully added ${created.name} (${created.code}).`, 'success');
    } catch (err: any) {
      showNotification(err?.message || 'Failed to create building', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter hotspots for search
  const filteredReferences = mapReferences.filter(
    (r) =>
      String(r.mapNumber).includes(hotspotSearch) ||
      (r.legendLabel && r.legendLabel.toLowerCase().includes(hotspotSearch.toLowerCase()))
  );

  const identifiedCount = mapReferences.filter((r) => r.identificationStatus === 'IDENTIFIED').length;
  const unidentifiedCount = mapReferences.filter((r) => r.identificationStatus === 'UNIDENTIFIED').length;

  return (
    <div className="space-y-4 pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-800 mb-1">
            <MapPin className="w-4 h-4 text-teal-700" />
            <span>Administrator Control Center</span>
            <span aria-hidden="true">·</span>
            <span>Lovely Professional University</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Admin Map Editor
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateStudentMap}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Student Map</span>
          </button>
        </div>
      </div>

      {/* Storage & Environment Notice Banner */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-2.5">
          <Database className="w-4 h-4 text-teal-800 shrink-0 mt-0.5 sm:mt-0" />
          <p className="leading-relaxed">
            <strong className="text-slate-900 font-semibold">Step 4A Active:</strong> Printed map reference hotspots system. Configure and associate numbered map points with campus buildings without inventing details.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
            {mapReferences.length} Hotspots ({identifiedCount} Linked · {unidentifiedCount} Unconfigured)
          </span>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center justify-between transition-all shadow-xs ${
            notification.type === 'error'
              ? 'bg-rose-50 text-rose-900 border border-rose-200'
              : notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-950 border border-emerald-200'
              : 'bg-teal-50 text-teal-950 border border-teal-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            ) : notification.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-700" />
            ) : (
              <Info className="w-4 h-4 text-teal-800" />
            )}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-xs opacity-70 hover:opacity-100 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Editor Grid: Map Canvas (8 cols) + Admin Form Control Panel (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Map Canvas with Interactive Hotspots & Placement */}
        <div className="lg:col-span-8 flex flex-col h-[540px] sm:h-[620px] bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden relative">
          {/* Active Placement Banner Overlay */}
          {isPlacing && (
            <div className="absolute top-3 left-3 right-3 z-35 bg-white/95 backdrop-blur-md rounded-lg border border-amber-300 p-2.5 shadow-md flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-amber-950 font-medium">
                <Move className="w-4 h-4 text-amber-700 animate-pulse" />
                <span>
                  {placementTarget === 'hotspot_reposition' && (
                    <>Repositioning Hotspot: <strong>#{selectedRef?.mapNumber}</strong></>
                  )}
                  {placementTarget === 'hotspot_new' && (
                    <>Placing New Hotspot: <strong>#{addNumber || '?'}</strong></>
                  )}
                  {placementTarget === 'building' && (
                    <>Placing Building: <strong>{activeTab === 'add' ? newName || 'New Building' : selectedBuilding?.name}</strong></>
                  )}
                </span>
                <span className="font-mono text-[11px] text-slate-600">
                  {placementCoords ? `(X: ${placementCoords.x}%, Y: ${placementCoords.y}%)` : '(Click map to set point)'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPlacing(false)}
                  className="px-2.5 py-1 text-xs rounded-md border border-slate-300 hover:bg-slate-100 text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>

                {placementTarget === 'hotspot_reposition' && (
                  <button
                    type="button"
                    disabled={!placementCoords || isSubmitting}
                    onClick={handleSaveHotspotPosition}
                    className="px-3 py-1 text-xs font-semibold rounded-md bg-teal-800 hover:bg-teal-900 disabled:opacity-40 text-white flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Hotspot Position</span>
                  </button>
                )}

                {placementTarget === 'building' && activeTab === 'edit' && (
                  <button
                    type="button"
                    disabled={!placementCoords || isSubmitting}
                    onClick={handleSaveBuildingCoordinates}
                    className="px-3 py-1 text-xs font-semibold rounded-md bg-teal-800 hover:bg-teal-900 disabled:opacity-40 text-white flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm Coordinates</span>
                  </button>
                )}
              </div>
            </div>
          )}

          <CampusMapCanvas
            buildings={buildings}
            mapReferences={mapReferences}
            selectedBuildingId={activeTab === 'edit' ? selectedBuilding?.id : null}
            selectedMapReferenceId={activeTab === 'hotspots' ? selectedRef?.id : null}
            onSelectBuilding={(b) => {
              setSelectedBuildingId(b.id);
              if (activeTab !== 'hotspots') {
                setActiveTab('edit');
              }
            }}
            onSelectMapReference={(ref) => {
              setSelectedRefId(ref.id);
              setActiveTab('hotspots');
              setIsPlacing(false);
              setHotspotMode('details');
            }}
            placementMode={isPlacing}
            activePlacementCoords={placementCoords}
            activeBuildingName={
              placementTarget === 'hotspot_reposition'
                ? `Hotspot #${selectedRef?.mapNumber}`
                : placementTarget === 'hotspot_new'
                ? `New #${addNumber || '?'}`
                : activeTab === 'add'
                ? newName
                : selectedBuilding?.name
            }
            onMapClickPlacement={(coords) => setPlacementCoords(coords)}
            onMarkerDragEnd={(coords) => setPlacementCoords(coords)}
            draggableMarkerId={activeTab === 'edit' ? selectedBuilding?.id : null}
            className="flex-1 rounded-none border-none"
          />

          {/* Coordinate status readout */}
          <div className="bg-white border-t border-slate-200 px-4 py-2 flex items-center justify-between text-xs text-slate-500">
            <span className="font-mono">
              {placementCoords
                ? `Active Target: X=${placementCoords.x}%, Y=${placementCoords.y}%`
                : 'Click any printed number or building pin to inspect and configure'}
            </span>
            <span className="text-[11px] text-slate-400">1658x949 normalized coordinates</span>
          </div>
        </div>

        {/* Admin Sidebar Controls (4 cols) */}
        <div className="lg:col-span-4 flex flex-col h-[540px] sm:h-[620px] bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs overflow-y-auto space-y-4">
          {/* Main Mode Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-lg shrink-0 gap-1">
            <button
              onClick={() => {
                setActiveTab('hotspots');
                setIsPlacing(false);
                setHotspotMode('details');
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'hotspots' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Hash className="w-3.5 h-3.5 text-teal-800" />
              <span>Map Hotspots</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('edit');
                setIsPlacing(false);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'edit' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Buildings</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('add');
                setIsPlacing(true);
                setPlacementTarget('building');
                setPlacementCoords(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'add' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>

          {/* ============================================================== */}
          {/* TAB 1: MAP HOTSPOTS (#) MANAGEMENT                             */}
          {/* ============================================================== */}
          {activeTab === 'hotspots' && (
            <div className="space-y-4">
              {/* Hotspot selector & search */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Select Printed Map Hotspot
                  </label>
                  <button
                    onClick={() => handleStartAddHotspot()}
                    className="text-[11px] font-semibold text-teal-800 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Number</span>
                  </button>
                </div>

                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={hotspotSearch}
                    onChange={(e) => setHotspotSearch(e.target.value)}
                    placeholder="Filter by # or name, e.g. 47, Civil..."
                    className="w-full pl-8 pr-2.5 py-1 text-xs rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-teal-700"
                  />
                </div>

                <select
                  value={selectedRefId}
                  onChange={(e) => {
                    setSelectedRefId(e.target.value);
                    setIsPlacing(false);
                    setHotspotMode('details');
                  }}
                  className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-teal-700 text-slate-800 cursor-pointer font-mono"
                >
                  <optgroup label={`Configured Hotspots (${filteredReferences.length})`}>
                    {filteredReferences.map((r) => {
                      const linkedB = r.linkedBuildingId ? buildings.find((b) => b.id === r.linkedBuildingId) : null;
                      return (
                        <option key={r.id} value={r.id}>
                          #{r.mapNumber}{r.legendLabel ? ` (${r.legendLabel})` : ''} — {r.identificationStatus === 'IDENTIFIED' ? `Linked to ${linkedB?.code || 'Building'}` : 'Unidentified'}
                        </option>
                      );
                    })}
                  </optgroup>
                </select>
              </div>

              {/* Selected Hotspot Overview Card */}
              {selectedRef && hotspotMode === 'details' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-full font-mono text-xs font-bold flex items-center justify-center ${
                            selectedRef.identificationStatus === 'IDENTIFIED'
                              ? 'bg-teal-900 text-cyan-200'
                              : 'bg-amber-500 text-slate-950'
                          }`}
                        >
                          {selectedRef.mapNumber}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900">
                            Printed Map #{selectedRef.mapNumber}
                          </div>
                          {selectedRef.legendLabel && (
                            <div className="text-[11px] text-slate-500 font-sans">
                              {selectedRef.legendLabel}
                            </div>
                          )}
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                          selectedRef.identificationStatus === 'IDENTIFIED'
                            ? 'bg-teal-100 text-teal-800 border border-teal-200'
                            : 'bg-amber-100 text-amber-900 border border-amber-200'
                        }`}
                      >
                        {selectedRef.identificationStatus}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 font-mono pt-1 border-t border-slate-200 flex justify-between">
                      <span>Coordinates:</span>
                      <span>X: {selectedRef.map_x}%, Y: {selectedRef.map_y}%</span>
                    </div>

                    {selectedRef.notes && (
                      <div className="text-[11px] text-slate-500 pt-1">
                        <strong>Notes:</strong> {selectedRef.notes}
                      </div>
                    )}
                  </div>

                  {/* Association Status Card */}
                  {selectedRef.identificationStatus === 'IDENTIFIED' ? (
                    <div className="p-3 rounded-lg bg-teal-50 border border-teal-200 text-xs space-y-2">
                      <div className="flex items-center justify-between text-teal-950 font-semibold">
                        <span className="flex items-center gap-1.5">
                          <Link2 className="w-3.5 h-3.5 text-teal-700" />
                          <span>Associated Building</span>
                        </span>
                        <span className="text-[10px] font-mono bg-teal-200/80 text-teal-900 px-1.5 py-0.5 rounded">
                          Linked
                        </span>
                      </div>

                      {(() => {
                        const linkedB = buildings.find((b) => b.id === selectedRef.linkedBuildingId);
                        return linkedB ? (
                          <div className="text-[11px] text-teal-900 space-y-0.5">
                            <div className="font-bold">{linkedB.name} ({linkedB.code})</div>
                            <div>{linkedB.campusZone} · {linkedB.floorsCount} Floors</div>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-600">Building ID: {selectedRef.linkedBuildingId}</div>
                        );
                      })()}

                      <div className="pt-2 border-t border-teal-200 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setHotspotMode('link_existing')}
                          className="text-xs text-teal-800 hover:text-teal-950 font-semibold cursor-pointer underline"
                        >
                          Change Building
                        </button>

                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={handleUnlinkHotspot}
                          className="text-xs text-rose-700 hover:text-rose-900 font-medium flex items-center gap-1 cursor-pointer"
                          title="Unlinks this printed number. Does not delete the building."
                        >
                          <Unlink className="w-3.5 h-3.5" />
                          <span>Unlink (Make Unidentified)</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs space-y-2">
                      <div className="flex items-center gap-1.5 text-amber-950 font-semibold">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span>Building information not yet configured</span>
                      </div>
                      <p className="text-[11px] text-amber-900 leading-relaxed">
                        This printed location does not have a linked building record.
                      </p>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setHotspotMode('link_existing')}
                          className="py-1.5 px-2 rounded-md bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Link2 className="w-3.5 h-3.5" />
                          <span>Link Existing</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setHotspotMode('create_and_link')}
                          className="py-1.5 px-2 rounded-md border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 text-teal-800" />
                          <span>Create & Link</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Hotspot Position adjustment */}
                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleStartRepositionHotspot}
                      className="py-1.5 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Move className="w-3.5 h-3.5 text-slate-500" />
                      <span>Adjust Hotspot Position</span>
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        if (!window.confirm(`Delete hotspot #${selectedRef.mapNumber}?`)) return;
                        setIsSubmitting(true);
                        try {
                          await deleteMapReference(selectedRef.id);
                          await onRefreshMapReferences?.();
                          showNotification(`Deleted hotspot #${selectedRef.mapNumber}.`);
                        } catch (err: any) {
                          showNotification(err?.message || 'Failed to delete hotspot', 'error');
                        } finally {
                          setIsSubmitting(false);
                        }
                      }}
                      className="text-xs text-rose-600 hover:text-rose-800 cursor-pointer"
                    >
                      Delete Hotspot
                    </button>
                  </div>
                </div>
              )}

              {/* Sub-mode: Link to Existing Building */}
              {selectedRef && hotspotMode === 'link_existing' && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <h3 className="text-xs font-bold text-slate-900">
                      Link #{selectedRef.mapNumber} to Building
                    </h3>
                    <button
                      onClick={() => setHotspotMode('details')}
                      className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Select Campus Building
                    </label>
                    <select
                      value={linkBuildingId}
                      onChange={(e) => setLinkBuildingId(e.target.value)}
                      className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-teal-700 text-slate-800 cursor-pointer"
                    >
                      {buildings.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.code}) — {b.mapNumber ? `Already linked to #${b.mapNumber}` : 'Unlinked'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    disabled={isSubmitting || !linkBuildingId}
                    onClick={handleAssociateWithBuilding}
                    className="w-full py-2 px-3 rounded-lg bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm Association</span>
                  </button>
                </div>
              )}

              {/* Sub-mode: Create New Building & Link */}
              {selectedRef && hotspotMode === 'create_and_link' && (
                <form onSubmit={handleCreateAndLinkBuilding} className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <h3 className="text-xs font-bold text-slate-900">
                      Create Building for #{selectedRef.mapNumber}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setHotspotMode('details')}
                      className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Building Name *
                    </label>
                    <input
                      type="text"
                      placeholder={selectedRef.legendLabel || 'e.g. School of Hotel Management'}
                      value={newLinkedName}
                      onChange={(e) => setNewLinkedName(e.target.value)}
                      className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-teal-700"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Unique Code *
                      </label>
                      <input
                        type="text"
                        placeholder={`B${selectedRef.mapNumber}`}
                        value={newLinkedCode}
                        onChange={(e) => setNewLinkedCode(e.target.value.toUpperCase())}
                        className="w-full p-2 text-xs font-mono rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-teal-700"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Floors *
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={15}
                        value={newLinkedFloors}
                        onChange={(e) => setNewLinkedFloors(Number(e.target.value))}
                        className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-teal-700"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Campus Zone
                    </label>
                    <input
                      type="text"
                      value={newLinkedZone}
                      onChange={(e) => setNewLinkedZone(e.target.value)}
                      className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-teal-700"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !newLinkedName.trim() || !newLinkedCode.trim()}
                    className="w-full py-2 px-3 rounded-lg bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create & Link to #{selectedRef.mapNumber}</span>
                  </button>
                </form>
              )}

              {/* Sub-mode: Add New Missing Map Hotspot */}
              {hotspotMode === 'add_new' && (
                <form onSubmit={handleSaveNewHotspot} className="p-3 rounded-lg bg-teal-50/70 border border-teal-200 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-teal-200">
                    <h3 className="text-xs font-bold text-teal-950 flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5 text-teal-700" />
                      <span>Add New Map Hotspot</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setHotspotMode('details');
                        setIsPlacing(false);
                      }}
                      className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  {/* Quick Select from unconfigured legend entries */}
                  {unconfiguredLegend.length > 0 && (
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Select Unconfigured Legend Item (Optional)
                      </label>
                      <select
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) {
                            const [numStr, ...labelParts] = val.split(':');
                            setAddNumber(numStr);
                            setAddLabel(labelParts.join(':'));
                          }
                        }}
                        className="w-full p-1.5 text-xs rounded-md border border-slate-300 bg-white text-slate-700"
                      >
                        <option value="">-- Choose unplaced legend number --</option>
                        {unconfiguredLegend.map((item) => (
                          <option key={item.mapNumber} value={`${item.mapNumber}:${item.legendLabel}`}>
                            #{item.mapNumber} - {item.legendLabel} ({item.category})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        Map Number *
                      </label>
                      <input
                        type="number"
                        min={1}
                        placeholder="e.g. 20"
                        value={addNumber}
                        onChange={(e) => setAddNumber(e.target.value)}
                        className="w-full p-2 text-xs font-mono rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-teal-700"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        Guide Label
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Law & Film"
                        value={addLabel}
                        onChange={(e) => setAddLabel(e.target.value)}
                        className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-teal-700"
                      />
                    </div>
                  </div>

                  <div className="p-2 rounded bg-white/80 border border-slate-200 text-[11px] text-slate-600 font-mono">
                    Placement: {placementCoords ? `X: ${placementCoords.x}%, Y: ${placementCoords.y}%` : 'Click on map to place'}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !addNumber || !placementCoords}
                    className="w-full py-2 px-3 rounded-lg bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Hotspot to Campus Map</span>
                  </button>
                </form>
              )}

              {/* Unconfigured Legend Summary list */}
              {unconfiguredLegend.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>Unplaced Legend Items ({unconfiguredLegend.length})</span>
                    <span className="text-[10px] text-slate-400 font-mono">Click to place</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {unconfiguredLegend.map((item) => (
                      <button
                        key={item.mapNumber}
                        type="button"
                        onClick={() => handleStartAddHotspot(item.mapNumber, item.legendLabel)}
                        className="px-2 py-0.5 text-[10px] rounded bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 hover:border-amber-300 cursor-pointer transition-colors"
                        title={`Place #${item.mapNumber} (${item.legendLabel}) on map`}
                      >
                        #{item.mapNumber} · {item.legendLabel}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: EDIT EXISTING BUILDING                                  */}
          {/* ============================================================== */}
          {activeTab === 'edit' && (
            <div className="space-y-4">
              {/* Building selector dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Building to Manage
                </label>
                <select
                  value={selectedBuildingId}
                  onChange={(e) => {
                    setSelectedBuildingId(e.target.value);
                    setIsPlacing(false);
                  }}
                  className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-teal-700 text-slate-800 cursor-pointer"
                >
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code}) — {b.coordinates ? 'Pinned' : 'Unpinned'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Marker placement action cards */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">Map Coordinates:</span>
                  <span className="font-mono text-slate-600">
                    {selectedBuilding?.coordinates
                      ? `X: ${selectedBuilding.coordinates.x}%, Y: ${selectedBuilding.coordinates.y}%`
                      : 'None (Unpinned)'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleStartBuildingPlacement}
                    className="py-1.5 px-2 rounded-md bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <Move className="w-3.5 h-3.5" />
                    <span>{selectedBuilding?.coordinates ? 'Reposition Pin' : 'Pin Marker'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRemoveBuildingMarker}
                    disabled={!selectedBuilding?.coordinates || isSubmitting}
                    className="py-1.5 px-2 rounded-md border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-700 text-xs font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    title="Removes marker without deleting building record"
                  >
                    <X className="w-3.5 h-3.5 text-slate-500" />
                    <span>Remove Pin</span>
                  </button>
                </div>
              </div>

              {/* Edit Building Metadata Form */}
              <form onSubmit={handleSaveBuildingDetails} className="space-y-3">
                <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Building Information
                </h3>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Building Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-teal-700"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Unique Code
                    </label>
                    <input
                      type="text"
                      value={editCode}
                      onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                      className="w-full p-2 text-xs font-mono rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-teal-700"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Floors Count
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={15}
                      value={editFloors}
                      onChange={(e) => setEditFloors(Number(e.target.value))}
                      className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-teal-700"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Campus Zone
                  </label>
                  <input
                    type="text"
                    value={editZone}
                    onChange={(e) => setEditZone(e.target.value)}
                    className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-teal-700"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Access Information / Notes
                  </label>
                  <textarea
                    rows={2}
                    value={editAccessInfo}
                    onChange={(e) => setEditAccessInfo(e.target.value)}
                    placeholder="e.g. Ramp entrance on North side, lift access in central foyer"
                    className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-teal-700"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleDeleteBuilding}
                    className="text-xs text-rose-700 hover:text-rose-900 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Details</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: ADD NEW BUILDING                                        */}
          {/* ============================================================== */}
          {activeTab === 'add' && (
            <form onSubmit={handleCreateNewBuilding} className="space-y-3">
              <div className="p-2.5 rounded-lg bg-teal-50 border border-teal-200 text-xs text-teal-950 space-y-1">
                <span className="font-semibold flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-teal-700" />
                  Building Placement Active
                </span>
                <p className="text-[11px] text-teal-900 leading-snug">
                  Fill in the building details, then click on the campus map to set its coordinates.
                </p>
                <div className="font-mono text-[11px] font-medium pt-1">
                  Location: {placementCoords ? `X: ${placementCoords.x}%, Y: ${placementCoords.y}%` : 'Not placed yet'}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Building Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. School of Architecture & Design"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-teal-700"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Unique Code *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. B06"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    className="w-full p-2 text-xs font-mono rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-teal-700"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Floors Count *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={newFloors}
                    onChange={(e) => setNewFloors(Number(e.target.value))}
                    className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-teal-700"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Campus Zone
                </label>
                <input
                  type="text"
                  placeholder="e.g. Academic Core (East)"
                  value={newZone}
                  onChange={(e) => setNewZone(e.target.value)}
                  className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-teal-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Access Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Near pedestrian walkway, ramp access available"
                  value={newAccessInfo}
                  onChange={(e) => setNewAccessInfo(e.target.value)}
                  className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-teal-700"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('edit');
                    setIsPlacing(false);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !newName.trim() || !newCode.trim()}
                  className="py-2 px-4 rounded-lg bg-teal-800 hover:bg-teal-900 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Building</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
