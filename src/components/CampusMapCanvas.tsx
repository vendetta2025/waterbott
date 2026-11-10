import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, MapPin, Building2, Droplets } from 'lucide-react';
import { Building, Coordinates, WaterPoint, MapReference } from '../types';

export const LPU_MAP_IMAGE_SRC = '/assets/aistudio/LPU_Isometric_Campus_Guide_Map_1aba8aec.png';

interface CampusMapCanvasProps {
  buildings: Building[];
  waterPoints?: WaterPoint[];
  mapReferences?: MapReference[];
  selectedBuildingId?: string | null;
  selectedMapReferenceId?: string | null;
  onSelectBuilding?: (building: Building) => void;
  onSelectMapReference?: (ref: MapReference) => void;
  showHotspots?: boolean;
  showBuildingPins?: boolean;
  // Admin Placement Mode Props
  placementMode?: boolean;
  activePlacementCoords?: Coordinates | null;
  activeBuildingName?: string;
  onMapClickPlacement?: (coords: Coordinates) => void;
  onMarkerDragEnd?: (coords: Coordinates) => void;
  draggableMarkerId?: string | null;
  interactive?: boolean;
  className?: string;
}

export const CampusMapCanvas: React.FC<CampusMapCanvasProps> = ({
  buildings,
  waterPoints = [],
  mapReferences = [],
  selectedBuildingId,
  selectedMapReferenceId,
  onSelectBuilding,
  onSelectMapReference,
  showHotspots = true,
  showBuildingPins = true,
  placementMode = false,
  activePlacementCoords = null,
  activeBuildingName = '',
  onMapClickPlacement,
  onMarkerDragEnd,
  draggableMarkerId = null,
  interactive = true,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapImageRef = useRef<HTMLDivElement>(null);

  // Zoom & Pan State
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Admin marker dragging state
  const [draggingMarker, setDraggingMarker] = useState<boolean>(false);
  const [previewCoords, setPreviewCoords] = useState<Coordinates | null>(activePlacementCoords);

  useEffect(() => {
    setPreviewCoords(activePlacementCoords);
  }, [activePlacementCoords]);

  // Clamp zoom limits
  const minZoom = 0.6;
  const maxZoom = 3.5;

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(maxZoom, Number((prev + 0.25).toFixed(2))));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(minZoom, Number((prev - 0.25).toFixed(2))));
  };

  const handleResetView = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  // Convert viewport client coords into 0-100% normalized map coordinates
  const calculateNormalizedCoords = useCallback((clientX: number, clientY: number): Coordinates | null => {
    if (!mapImageRef.current) return null;
    const rect = mapImageRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;

    const rawX = ((clientX - rect.left) / rect.width) * 100;
    const rawY = ((clientY - rect.top) / rect.height) * 100;

    return {
      x: Number(Math.max(0, Math.min(100, rawX)).toFixed(2)),
      y: Number(Math.max(0, Math.min(100, rawY)).toFixed(2)),
    };
  }, []);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!interactive) return;
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 0.15 : -0.15;
    setZoom((prev) => Math.max(minZoom, Math.min(maxZoom, Number((prev + zoomFactor).toFixed(2)))));
  };

  // Pan start
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive) return;
    // If clicking on a draggable marker or button, do not pan
    if ((e.target as HTMLElement).closest('.map-marker-interactive')) return;

    if (placementMode && onMapClickPlacement) {
      const coords = calculateNormalizedCoords(e.clientX, e.clientY);
      if (coords) {
        onMapClickPlacement(coords);
        return;
      }
    }

    setIsPanning(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (draggingMarker) {
      const coords = calculateNormalizedCoords(e.clientX, e.clientY);
      if (coords) {
        setPreviewCoords(coords);
      }
      return;
    }

    if (!isPanning) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (draggingMarker) {
      setDraggingMarker(false);
      if (previewCoords && onMarkerDragEnd) {
        onMarkerDragEnd(previewCoords);
      }
    }
    if (isPanning) {
      setIsPanning(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Safe ignore
      }
    }
  };

  // Center on a selected building or map reference when requested
  useEffect(() => {
    let targetCoords: { x: number; y: number } | null = null;

    if (selectedMapReferenceId && mapReferences.length > 0) {
      const ref = mapReferences.find((r) => r.id === selectedMapReferenceId);
      if (ref) {
        targetCoords = { x: ref.map_x, y: ref.map_y };
      }
    } else if (selectedBuildingId) {
      const b = buildings.find((b) => b.id === selectedBuildingId);
      if (b?.coordinates) {
        targetCoords = b.coordinates;
      }
    }

    if (targetCoords && containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      const baseWidth = Math.max(containerWidth, 900);
      const baseHeight = baseWidth * (949 / 1658);

      const targetX = (targetCoords.x / 100) * baseWidth;
      const targetY = (targetCoords.y / 100) * baseHeight;

      setPan({
        x: Math.round(containerWidth / 2 - targetX * zoom),
        y: Math.round(containerHeight / 2 - targetY * zoom),
      });
    }
  }, [selectedBuildingId, selectedMapReferenceId, buildings, mapReferences, zoom]);

  // Only render buildings that have verified coordinates
  const pinnedBuildings = buildings.filter(
    (b): b is Building & { coordinates: Coordinates } =>
      Boolean(b.coordinates && typeof b.coordinates.x === 'number' && typeof b.coordinates.y === 'number')
  );

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`relative w-full h-full min-h-[500px] overflow-hidden select-none bg-stone-100/90 border border-slate-200 rounded-xl cursor-${
        placementMode ? 'crosshair' : isPanning ? 'grabbing' : 'grab'
      } ${className}`}
      aria-label="Campus Interactive Map"
    >
      {/* Pan & Zoom Transform Layer */}
      <div
        className="w-full h-full flex items-center justify-center transition-transform duration-75 ease-out origin-center"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          touchAction: 'none',
        }}
      >
        {/* Map Image Container preserving original 1658 x 949 aspect ratio */}
        <div
          ref={mapImageRef}
          className="relative shadow-md shrink-0 select-none pointer-events-auto"
          style={{
            width: '1000px',
            maxWidth: 'none',
            aspectRatio: '1658 / 949',
          }}
        >
          {/* LPU Campus Map Image Asset */}
          <img
            src={LPU_MAP_IMAGE_SRC}
            alt="Lovely Professional University Campus Map"
            className="w-full h-full object-contain pointer-events-none block rounded-sm"
            draggable={false}
          />

          {/* Placement Crosshair Guideline Overlay in Admin Mode */}
          {placementMode && (
            <div className="absolute inset-0 bg-teal-900/5 pointer-events-none border border-teal-600/20" />
          )}

          {/* Interactive Printed Building Number Hotspots Overlay (Step 4A) */}
          {showHotspots &&
            mapReferences.map((ref) => {
              const isSelected = selectedMapReferenceId === ref.id;
              const isIdentified = ref.identificationStatus === 'IDENTIFIED';
              const linkedBuilding = ref.linkedBuildingId
                ? buildings.find((b) => b.id === ref.linkedBuildingId)
                : null;

              return (
                <div
                  key={ref.id}
                  style={{
                    left: `${ref.map_x}%`,
                    top: `${ref.map_y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className={`absolute z-15 group map-marker-interactive cursor-pointer select-none ${
                    isSelected ? 'z-35' : ''
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectMapReference?.(ref);
                    if (linkedBuilding) {
                      onSelectBuilding?.(linkedBuilding);
                    }
                  }}
                  onPointerDown={(e) => {
                    // Stop pointer down propagation so clicking doesn't trigger map dragging
                    e.stopPropagation();
                  }}
                  aria-label={`Printed Map Location #${ref.mapNumber}`}
                >
                  {/* Hotspot Target Hitbox (compact 24px x 24px) */}
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] font-bold transition-all duration-150 shadow-sm ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 ring-4 ring-cyan-300 ring-offset-2 ring-offset-slate-900 scale-125 shadow-lg'
                        : isIdentified
                        ? 'bg-teal-900/90 text-cyan-200 border border-teal-400 hover:bg-teal-800 hover:scale-115 shadow-xs'
                        : 'bg-amber-500/95 text-slate-950 border border-amber-300 hover:bg-amber-400 hover:scale-115 shadow-xs'
                    }`}
                  >
                    <span>{ref.mapNumber}</span>
                  </div>

                  {/* Floating Tooltip Popover */}
                  <div
                    className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-0.5 rounded text-[10px] whitespace-nowrap shadow-md pointer-events-none transition-all duration-150 z-40 ${
                      isSelected
                        ? 'opacity-100 bg-slate-900 text-cyan-200 ring-1 ring-cyan-400'
                        : 'opacity-0 group-hover:opacity-100 bg-slate-900/95 text-white'
                    }`}
                  >
                    <span className="font-bold font-mono">#{ref.mapNumber}</span>
                    {ref.legendLabel && <span className="opacity-80"> · {ref.legendLabel}</span>}
                    <span
                      className={`ml-1.5 text-[9px] px-1 py-0.2 rounded font-sans ${
                        isIdentified
                          ? 'bg-teal-800 text-teal-200'
                          : 'bg-amber-800/80 text-amber-200'
                      }`}
                    >
                      {isIdentified ? (linkedBuilding ? linkedBuilding.code : 'Linked') : 'Unconfigured'}
                    </span>
                  </div>
                </div>
              );
            })}

          {/* Render Pinned Building Markers */}
          {showBuildingPins &&
            pinnedBuildings.map((building) => {
              const isSelected = building.id === selectedBuildingId;
              const isDraggable = draggableMarkerId === building.id;

              return (
                <div
                  key={building.id}
                  style={{
                    left: `${building.coordinates.x}%`,
                    top: `${building.coordinates.y}%`,
                    transform: 'translate(-50%, -100%)',
                  }}
                  className={`absolute z-20 group map-marker-interactive cursor-pointer ${
                    isSelected ? 'z-30' : ''
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectBuilding?.(building);
                  }}
                  onPointerDown={(e) => {
                    if (isDraggable) {
                      e.stopPropagation();
                      setDraggingMarker(true);
                    }
                  }}
                >
                  {/* Visual Marker Pin - Distinct Building Style */}
                  <div
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold transition-all shadow-md ${
                      isSelected
                        ? 'bg-teal-900 text-white ring-2 ring-white ring-offset-2 ring-offset-teal-900 scale-110'
                        : 'bg-white/95 text-slate-800 border border-slate-300 hover:bg-teal-800 hover:text-white'
                    }`}
                  >
                    <Building2 className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-200' : 'text-teal-700 group-hover:text-cyan-200'}`} />
                    <span className="whitespace-nowrap font-mono text-[11px]">{building.code}</span>
                  </div>

                  {/* Pin stem */}
                  <div className="w-0.5 h-2 bg-slate-800 mx-auto -mt-0.5" />
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-900 mx-auto -mt-0.5" />

                  {/* Building Label popover */}
                  <div
                    className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-0.5 rounded bg-slate-900/90 text-white text-[10px] whitespace-nowrap shadow-sm pointer-events-none transition-opacity ${
                      isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {building.name} · {building.floorsCount} Fl
                  </div>
                </div>
              );
            })}

          {/* Render Water Point Markers (if coordinates present) */}
          {waterPoints
            .filter((wp): wp is WaterPoint & { coordinates: Coordinates } => Boolean(wp.coordinates))
            .map((wp) => (
              <div
                key={wp.id}
                style={{
                  left: `${wp.coordinates.x}%`,
                  top: `${wp.coordinates.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                className="absolute z-10 group map-marker-interactive cursor-pointer"
                title={`${wp.buildingName} - Floor ${wp.floorNumber} (${wp.locationDetails})`}
              >
                <div className="w-5 h-5 rounded-full bg-cyan-600 border-2 border-white text-white flex items-center justify-center shadow-sm hover:scale-125 transition-transform">
                  <Droplets className="w-3 h-3" />
                </div>
              </div>
            ))}

          {/* Admin Placement Preview Marker */}
          {placementMode && previewCoords && (
            <div
              style={{
                left: `${previewCoords.x}%`,
                top: `${previewCoords.y}%`,
                transform: 'translate(-50%, -100%)',
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                setDraggingMarker(true);
              }}
              className="absolute z-40 map-marker-interactive cursor-move animate-bounce-short"
            >
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500 text-slate-950 font-bold text-xs shadow-lg ring-2 ring-white">
                <MapPin className="w-3.5 h-3.5 text-slate-950" />
                <span className="whitespace-nowrap">{activeBuildingName || 'New Placement'}</span>
                <span className="text-[10px] opacity-80 font-mono">
                  ({previewCoords.x}%, {previewCoords.y}%)
                </span>
              </div>
              <div className="w-0.5 h-2.5 bg-amber-600 mx-auto" />
              <div className="w-2 h-2 rounded-full bg-amber-700 ring-4 ring-amber-400/40 mx-auto -mt-0.5" />
            </div>
          )}
        </div>
      </div>

      {/* Floating Apple Maps-style Controls */}
      <div className="absolute bottom-4 right-4 z-30 flex flex-col items-center gap-1 bg-white/95 backdrop-blur-md rounded-lg border border-slate-200 p-1 shadow-md">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="w-8 h-8 rounded-md flex items-center justify-center text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="w-8 h-8 rounded-md flex items-center justify-center text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <div className="w-5 h-[1px] bg-slate-200 my-0.5" />

        <button
          onClick={handleResetView}
          title="Reset View"
          className="w-8 h-8 rounded-md flex items-center justify-center text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Reset map position and zoom"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Floating Zoom & Pan Indicator */}
      <div className="absolute bottom-4 left-4 z-30 bg-white/90 backdrop-blur-md rounded-md border border-slate-200 px-2.5 py-1 text-[11px] text-slate-600 font-mono shadow-xs flex items-center gap-2">
        <span>Zoom: {Math.round(zoom * 100)}%</span>
        <span aria-hidden="true" className="text-slate-300">·</span>
        <span>Drag to pan · Scroll to zoom</span>
      </div>
    </div>
  );
};
