import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';

// Body parser
app.use(express.json());

// CORS configuration - allows independent frontend deployment (e.g. on Vercel)
app.use((req, res, next) => {
  const allowedOrigin = process.env.CORS_ORIGIN || '*';
  res.header('Access-Control-Allow-Origin', allowedOrigin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// API Routes
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Empty Bottle API',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

import { evaluateRecommendations } from './server/recommendationService.ts';
import { INITIAL_MAP_REFERENCES, UNCONFIGURED_LEGEND_NUMBERS } from './server/mapReferences.ts';
import { Building, WaterPoint, RecommendationQuery, MapReference } from './src/types/index.ts';

// In-memory unified map references state
let mapReferences: MapReference[] = JSON.parse(JSON.stringify(INITIAL_MAP_REFERENCES));

// In-memory unified building state (Express API)
// Supabase PostgreSQL integration will be activated in Phase 3
let buildings: Building[] = [
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
    mapCoordinates: { map_x: 32.45, map_y: 47.42 },
    geoCoordinates: null,
    neighbourBuildingIds: [], // Manually verified only - never fabricated
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
    mapCoordinates: { map_x: 30.28, map_y: 46.79 },
    geoCoordinates: null,
    neighbourBuildingIds: [],
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
    mapCoordinates: { map_x: 30.10, map_y: 47.21 },
    geoCoordinates: null,
    neighbourBuildingIds: [],
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
    mapCoordinates: { map_x: 31.24, map_y: 51.32 },
    geoCoordinates: null,
    neighbourBuildingIds: [],
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
    mapCoordinates: { map_x: 33.29, map_y: 50.37 },
    geoCoordinates: null,
    neighbourBuildingIds: [],
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
    mapCoordinates: { map_x: 35.10, map_y: 59.33 },
    geoCoordinates: null,
    neighbourBuildingIds: [],
    coordinates: { x: 35.10, y: 59.33 },
  },
];

// In-memory unified water points state
let waterPoints: WaterPoint[] = [
  {
    id: 'wp-34-g1',
    buildingId: 'b-34',
    buildingName: 'Block 34',
    floorNumber: 0,
    locationDetails: 'Ground Floor, East Wing near Staircase 1 & Washrooms',
    dispenserType: 'chilled_and_normal',
    operationalStatus: 'operational',
    communityStatus: 'verified_working',
    lastVerifiedAt: '25 mins ago',
    confirmationsToday: 6,
    recentIssueReported: false,
    unresolvedIssues: [],
    mapCoordinates: null,
    geoCoordinates: null,
  },
  {
    id: 'wp-34-1a',
    buildingId: 'b-34',
    buildingName: 'Block 34',
    floorNumber: 1,
    locationDetails: 'Floor 1, North Corridor outside Lecture Hall 104',
    dispenserType: 'chilled_and_normal',
    operationalStatus: 'operational',
    communityStatus: 'verified_working',
    lastVerifiedAt: '12 mins ago',
    confirmationsToday: 8,
    recentIssueReported: false,
    unresolvedIssues: [],
    mapCoordinates: null,
    geoCoordinates: null,
  },
  {
    id: 'wp-34-2a',
    buildingId: 'b-34',
    buildingName: 'Block 34',
    floorNumber: 2,
    locationDetails: 'Floor 2, Central Elevator lobby',
    dispenserType: 'ro_purified',
    operationalStatus: 'operational',
    communityStatus: 'verified_working',
    lastVerifiedAt: '1 hour ago',
    confirmationsToday: 4,
    recentIssueReported: false,
    unresolvedIssues: [],
    mapCoordinates: null,
    geoCoordinates: null,
  },
  {
    id: 'wp-34-3a',
    buildingId: 'b-34',
    buildingName: 'Block 34',
    floorNumber: 3,
    locationDetails: 'Floor 3, East Wing near Faculty Cabins',
    dispenserType: 'chilled_and_normal',
    operationalStatus: 'low_pressure',
    communityStatus: 'issue_flagged',
    lastVerifiedAt: '45 mins ago',
    confirmationsToday: 2,
    recentIssueReported: true,
    unresolvedIssues: ['cooling_not_working'],
    mapCoordinates: null,
    geoCoordinates: null,
  },
  {
    id: 'wp-28-g1',
    buildingId: 'b-28',
    buildingName: 'Block 28',
    floorNumber: 0,
    locationDetails: 'Ground Floor, Main Entrance Foyer near Security Desk',
    dispenserType: 'chilled_and_normal',
    operationalStatus: 'operational',
    communityStatus: 'verified_working',
    lastVerifiedAt: '18 mins ago',
    confirmationsToday: 9,
    recentIssueReported: false,
    unresolvedIssues: [],
    mapCoordinates: null,
    geoCoordinates: null,
  },
  {
    id: 'wp-28-2a',
    buildingId: 'b-28',
    buildingName: 'Block 28',
    floorNumber: 2,
    locationDetails: 'Floor 2, Computer Labs wing near Lab 206',
    dispenserType: 'chilled_and_normal',
    operationalStatus: 'operational',
    communityStatus: 'verified_working',
    lastVerifiedAt: '35 mins ago',
    confirmationsToday: 5,
    recentIssueReported: false,
    unresolvedIssues: [],
    mapCoordinates: null,
    geoCoordinates: null,
  },
  {
    id: 'wp-lib-g1',
    buildingId: 'b-lib',
    buildingName: 'Central Library',
    floorNumber: 0,
    locationDetails: 'Ground Floor, Circulation Desk left corridor',
    dispenserType: 'chilled_and_normal',
    operationalStatus: 'operational',
    communityStatus: 'verified_working',
    lastVerifiedAt: '10 mins ago',
    confirmationsToday: 14,
    recentIssueReported: false,
    unresolvedIssues: [],
    mapCoordinates: null,
    geoCoordinates: null,
  },
  {
    id: 'wp-lib-1a',
    buildingId: 'b-lib',
    buildingName: 'Central Library',
    floorNumber: 1,
    locationDetails: 'Floor 1, Quiet Reading Hall adjacent to Stacks 12-16',
    dispenserType: 'ro_purified',
    operationalStatus: 'operational',
    communityStatus: 'verified_working',
    lastVerifiedAt: '40 mins ago',
    confirmationsToday: 7,
    recentIssueReported: false,
    unresolvedIssues: [],
    mapCoordinates: null,
    geoCoordinates: null,
  },
];

// Unified Building API Endpoints
app.get('/api/buildings', (req, res) => {
  res.status(200).json({
    data: buildings,
    storageMode: 'express_in_memory_preview',
    message: 'Loaded from Express API store. Supabase PostgreSQL persistence planned for Phase 3.',
  });
});

app.post('/api/buildings', (req, res) => {
  const { name, code, campusZone, floorsCount, accessInfo, coordinates } = req.body;
  if (!name || !code) {
    return res.status(400).json({ error: 'Building name and code are required' });
  }

  // Validate unique code
  if (buildings.some((b) => b.code.toLowerCase() === String(code).toLowerCase())) {
    return res.status(409).json({ error: `Building code "${code}" is already in use` });
  }

  const newBuilding: Building = {
    id: `b-${code.toLowerCase().replace(/[^a-z0-9]/g, '') || Date.now()}`,
    name: String(name).trim(),
    code: String(code).trim().toUpperCase(),
    campusZone: String(campusZone || 'Campus Central').trim(),
    floorsCount: Math.max(1, parseInt(floorsCount || '1', 10)),
    activeWaterPointsCount: 0,
    totalWaterPointsCount: 0,
    accessInfo: accessInfo ? String(accessInfo).trim() : undefined,
    coordinates: coordinates && typeof coordinates.x === 'number' && typeof coordinates.y === 'number'
      ? { x: Number(coordinates.x), y: Number(coordinates.y) }
      : null,
  };

  buildings.push(newBuilding);
  res.status(201).json({
    data: newBuilding,
    storageMode: 'express_in_memory_preview',
    message: 'Building created in Express API session store.',
  });
});

app.put('/api/buildings/:id', (req, res) => {
  const { id } = req.params;
  const index = buildings.findIndex((b) => b.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Building not found' });
  }

  const existing = buildings[index];
  const { name, code, campusZone, floorsCount, accessInfo, coordinates } = req.body;

  const updated: Building = {
    ...existing,
    name: name !== undefined ? String(name).trim() : existing.name,
    code: code !== undefined ? String(code).trim().toUpperCase() : existing.code,
    campusZone: campusZone !== undefined ? String(campusZone).trim() : existing.campusZone,
    floorsCount: floorsCount !== undefined ? Math.max(1, parseInt(floorsCount, 10)) : existing.floorsCount,
    accessInfo: accessInfo !== undefined ? String(accessInfo).trim() : existing.accessInfo,
    coordinates: coordinates !== undefined ? coordinates : existing.coordinates,
  };

  buildings[index] = updated;
  res.status(200).json({
    data: updated,
    storageMode: 'express_in_memory_preview',
    message: 'Building updated in Express API session store.',
  });
});

app.patch('/api/buildings/:id/coordinates', (req, res) => {
  const { id } = req.params;
  const index = buildings.findIndex((b) => b.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Building not found' });
  }

  const { coordinates } = req.body;
  if (coordinates === null || (typeof coordinates?.x === 'number' && typeof coordinates?.y === 'number')) {
    buildings[index].coordinates = coordinates;
    return res.status(200).json({
      data: buildings[index],
      storageMode: 'express_in_memory_preview',
      message: coordinates ? 'Coordinates updated.' : 'Marker coordinates removed.',
    });
  }

  res.status(400).json({ error: 'Invalid coordinates format. Expected { x, y } or null' });
});

app.delete('/api/buildings/:id', (req, res) => {
  const { id } = req.params;
  const index = buildings.findIndex((b) => b.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Building not found' });
  }
  const removed = buildings.splice(index, 1)[0];
  res.status(200).json({
    data: removed,
    storageMode: 'express_in_memory_preview',
    message: 'Building deleted from Express API session store.',
  });
});

app.get('/api/water-points', (req, res) => {
  res.status(200).json({
    data: waterPoints,
    storageMode: 'express_in_memory_preview',
    message: 'Loaded from Express API store. Supabase PostgreSQL persistence planned for Phase 3.',
  });
});

// ==========================================
// Map References Endpoints (Step 4A)
// ==========================================

app.get('/api/map-references', (req, res) => {
  const identifiedCount = mapReferences.filter((r) => r.identificationStatus === 'IDENTIFIED').length;
  const unidentifiedCount = mapReferences.filter((r) => r.identificationStatus === 'UNIDENTIFIED').length;

  res.status(200).json({
    data: mapReferences,
    unconfiguredLegend: UNCONFIGURED_LEGEND_NUMBERS,
    counts: {
      totalConfigured: mapReferences.length,
      identified: identifiedCount,
      unidentified: unidentifiedCount,
      unconfiguredLegend: UNCONFIGURED_LEGEND_NUMBERS.length,
    },
    storageMode: 'express_in_memory_preview',
  });
});

app.post('/api/map-references', (req, res) => {
  const { mapNumber, map_x, map_y, linkedBuildingId, legendLabel, notes } = req.body;

  const num = parseInt(mapNumber, 10);
  if (isNaN(num) || num <= 0) {
    return res.status(400).json({ error: 'Valid positive integer mapNumber is required' });
  }

  if (mapReferences.some((r) => r.mapNumber === num)) {
    return res.status(409).json({ error: `Map reference #${num} is already configured` });
  }

  const x = parseFloat(map_x);
  const y = parseFloat(map_y);
  if (isNaN(x) || isNaN(y) || x < 0 || x > 100 || y < 0 || y > 100) {
    return res.status(400).json({ error: 'Normalized coordinates map_x and map_y must be numbers between 0 and 100' });
  }

  let finalLinkedBuildingId: string | null = null;
  let status: 'IDENTIFIED' | 'UNIDENTIFIED' = 'UNIDENTIFIED';

  if (linkedBuildingId) {
    const building = buildings.find((b) => b.id === linkedBuildingId);
    if (!building) {
      return res.status(400).json({ error: `Building ID ${linkedBuildingId} not found` });
    }
    finalLinkedBuildingId = building.id;
    status = 'IDENTIFIED';
    building.mapNumber = num;
    building.coordinates = { x, y };
    building.mapCoordinates = { map_x: x, map_y: y };
  }

  const newRef: MapReference = {
    id: `ref-${num}`,
    mapNumber: num,
    map_x: x,
    map_y: y,
    linkedBuildingId: finalLinkedBuildingId,
    identificationStatus: status,
    legendLabel: legendLabel ? String(legendLabel).trim() : undefined,
    notes: notes ? String(notes).trim() : undefined,
  };

  mapReferences.push(newRef);
  res.status(201).json({
    data: newRef,
    storageMode: 'express_in_memory_preview',
    message: `Created map reference #${num}.`,
  });
});

app.patch('/api/map-references/:id', (req, res) => {
  const { id } = req.params;
  const index = mapReferences.findIndex((r) => r.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Map reference not found' });
  }

  const existing = mapReferences[index];
  const { map_x, map_y, linkedBuildingId, legendLabel, notes, identificationStatus } = req.body;

  let updatedX = existing.map_x;
  let updatedY = existing.map_y;
  if (typeof map_x === 'number' && !isNaN(map_x) && map_x >= 0 && map_x <= 100) {
    updatedX = Number(map_x.toFixed(2));
  }
  if (typeof map_y === 'number' && !isNaN(map_y) && map_y >= 0 && map_y <= 100) {
    updatedY = Number(map_y.toFixed(2));
  }

  let updatedBuildingId = existing.linkedBuildingId;
  let updatedStatus = existing.identificationStatus;

  // Handle association / unlinking
  if (linkedBuildingId !== undefined) {
    if (linkedBuildingId === null || linkedBuildingId === '') {
      // Unlink: Preserve the underlying building, do NOT delete it!
      if (existing.linkedBuildingId) {
        const prevBuilding = buildings.find((b) => b.id === existing.linkedBuildingId);
        if (prevBuilding && prevBuilding.mapNumber === existing.mapNumber) {
          prevBuilding.mapNumber = null;
        }
      }
      updatedBuildingId = null;
      updatedStatus = 'UNIDENTIFIED';
    } else {
      // Link to an existing building
      const targetBuilding = buildings.find((b) => b.id === linkedBuildingId);
      if (!targetBuilding) {
        return res.status(400).json({ error: `Building ID ${linkedBuildingId} not found` });
      }
      updatedBuildingId = targetBuilding.id;
      updatedStatus = 'IDENTIFIED';
      targetBuilding.mapNumber = existing.mapNumber;
      targetBuilding.coordinates = { x: updatedX, y: updatedY };
      targetBuilding.mapCoordinates = { map_x: updatedX, map_y: updatedY };
    }
  } else if (identificationStatus !== undefined) {
    updatedStatus = identificationStatus;
    if (identificationStatus === 'UNIDENTIFIED') {
      updatedBuildingId = null;
    }
  }

  // If coordinates moved and building is linked, update building coordinates too
  if (updatedBuildingId) {
    const linkedB = buildings.find((b) => b.id === updatedBuildingId);
    if (linkedB) {
      linkedB.coordinates = { x: updatedX, y: updatedY };
      linkedB.mapCoordinates = { map_x: updatedX, map_y: updatedY };
    }
  }

  const updated: MapReference = {
    ...existing,
    map_x: updatedX,
    map_y: updatedY,
    linkedBuildingId: updatedBuildingId,
    identificationStatus: updatedStatus,
    legendLabel: legendLabel !== undefined ? (legendLabel ? String(legendLabel).trim() : undefined) : existing.legendLabel,
    notes: notes !== undefined ? (notes ? String(notes).trim() : undefined) : existing.notes,
  };

  mapReferences[index] = updated;
  res.status(200).json({
    data: updated,
    storageMode: 'express_in_memory_preview',
    message: `Updated map reference #${updated.mapNumber}.`,
  });
});

app.delete('/api/map-references/:id', (req, res) => {
  const { id } = req.params;
  const index = mapReferences.findIndex((r) => r.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Map reference not found' });
  }

  const removed = mapReferences.splice(index, 1)[0];
  // Unlink from building if linked
  if (removed.linkedBuildingId) {
    const b = buildings.find((b) => b.id === removed.linkedBuildingId);
    if (b && b.mapNumber === removed.mapNumber) {
      b.mapNumber = null;
    }
  }

  res.status(200).json({
    data: removed,
    storageMode: 'express_in_memory_preview',
    message: `Deleted map reference #${removed.mapNumber}.`,
  });
});

app.post('/api/recommendations', (req, res) => {
  try {
    const query: RecommendationQuery = req.body || {};
    const result = evaluateRecommendations(query, buildings, waterPoints);
    res.status(200).json(result);
  } catch (err: any) {
    console.error('[Empty Bottle] Recommendation error:', err);
    res.status(500).json({
      error: 'Failed to compute water recommendations',
      details: err?.message || 'Internal engine failure',
    });
  }
});

app.post('/api/reports', (req, res) => {
  res.status(200).json({
    status: 'received',
    message: 'Community reporting endpoint ready for Supabase persistence',
  });
});

// Full-stack serving setup:
// In dev: mount Vite middleware for instant HMR-free full-stack development on port 3000
// In prod: serve built frontend from dist
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Empty Bottle] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Empty Bottle] Failed to start server:', err);
  process.exit(1);
});
