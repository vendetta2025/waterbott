/**
 * Empty Bottle - Core Data Models & Types
 * Designed for community-driven campus water-point discovery and reporting.
 */

export type OperationalStatus = 'operational' | 'low_pressure' | 'maintenance' | 'offline';

export type CommunityStatus = 'verified_working' | 'unverified_today' | 'issue_flagged' | 'under_review';

export type WaterDispenserType = 'chilled_and_normal' | 'ro_purified' | 'normal_only' | 'hot_and_cold';

export type IssueCategory =
  | 'no_water'
  | 'dispenser_leaking'
  | 'cooling_not_working'
  | 'filter_odor_taste'
  | 'tap_lever_broken'
  | 'hygiene_surroundings';

/**
 * Campus Map Coordinates:
 * Normalized percentages (0.0 to 100.0%) across the supplied 1658x949 LPU image.
 * Used exclusively for SVG/HTML marker placement on the interactive map canvas.
 * Non-metric: MUST NOT be used for real-world distance or walking proximity.
 */
export interface CampusMapCoordinates {
  map_x: number;
  map_y: number;
}

/**
 * Geographic Coordinates:
 * Real-world WGS84 coordinates (decimal degrees).
 * Used for real-world distance calculation (Haversine) and navigation.
 * Strictly optional per building/dispenser.
 */
export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

/** Legacy alias for backward compatibility with existing map canvas */
export interface Coordinates {
  x: number;
  y: number;
}

/**
 * Printed Map Reference System:
 * Separates physical graphic numbers printed on the LPU campus guide
 * from digital building codes and IDs.
 */
export type IdentificationStatus = 'IDENTIFIED' | 'UNIDENTIFIED';

export interface MapReference {
  id: string; // e.g. 'ref-34'
  mapNumber: number; // Integer printed on official LPU guide map
  map_x: number; // Normalized X% across map image (0.0 to 100.0)
  map_y: number; // Normalized Y% across map image (0.0 to 100.0)
  linkedBuildingId: string | null; // Nullable building ID
  identificationStatus: IdentificationStatus; // IDENTIFIED or UNIDENTIFIED
  legendLabel?: string; // Optional label from printed map legend
  notes?: string;
}

export interface Building {
  id: string;
  name: string;
  code: string;
  campusZone: string;
  mapNumber?: number | null; // Numbered label on official LPU guide map (e.g. 34)
  floorsCount: number;
  activeWaterPointsCount: number;
  totalWaterPointsCount: number;
  accessInfo?: string;
  
  // Dual Coordinates
  mapCoordinates?: CampusMapCoordinates | null;
  geoCoordinates?: GeoCoordinates | null;
  
  // Graph relationships (Manually verified only - never fabricated)
  neighbourBuildingIds?: string[];
  
  /** Legacy alias for mapCoordinates { x, y } */
  coordinates?: Coordinates | null;
}

export interface WaterPoint {
  id: string;
  buildingId: string;
  buildingName: string;
  floorNumber: number;
  locationDetails: string;
  dispenserType: WaterDispenserType;
  operationalStatus: OperationalStatus;
  communityStatus?: CommunityStatus;
  lastVerifiedAt: string | null; // Nullable when unverified or new
  confirmationsToday: number;
  recentIssueReported: boolean;
  unresolvedIssues?: IssueCategory[];
  
  // Dual coordinates
  mapCoordinates?: CampusMapCoordinates | null;
  geoCoordinates?: GeoCoordinates | null;
  
  /** Legacy alias for mapCoordinates { x, y } */
  coordinates?: Coordinates | null;
}

export interface ProblemReportDraft {
  buildingId: string;
  floorNumber: number;
  waterPointId?: string;
  issueCategory: IssueCategory;
  description: string;
  urgency: 'routine' | 'urgent';
}

export interface HealthCheckResponse {
  status: string;
  service: string;
  version: string;
  timestamp: string;
  environment: string;
}

export type ActiveTab = 'home' | 'find' | 'map' | 'report' | 'ask_ai' | 'admin_map';

// ==========================================
// Intelligent Discovery & Recommendation Contracts
// ==========================================

export interface RecommendationQuery {
  // Location resolution
  buildingId?: string;
  buildingCode?: string;
  buildingName?: string;
  studentFloor?: number;
  geoCoordinates?: GeoCoordinates; // Explicitly shared with permission
  
  // Filter constraints
  floor?: number | 'all';
  requiresChilled?: boolean;
  requiresRoPurified?: boolean;
  operationalOnly?: boolean;
  
  // Multi-turn refinement (candidate narrowing)
  candidateWaterPointIds?: string[];
  maxResults?: number;
}

export type SpatialRelationType =
  | 'same_building'
  | 'neighbour_building'
  | 'same_zone'
  | 'geo_proximity'
  | 'other_zone';

export interface RankedWaterPoint {
  waterPoint: WaterPoint;
  building: Building;
  score: number;
  distanceMeters?: number; // Only present if real GPS coordinates exist on both student & building
  spatialRelation: SpatialRelationType;
  floorDifference: number; // |studentFloor - floorNumber|
  matchReasons: string[];
  caveats: string[];
}

export interface RecommendationResult {
  status: 'resolved' | 'needs_location' | 'no_matches';
  message: string;
  resolvedLocation?: {
    type: 'building' | 'geo_coordinates';
    building?: Building;
    geoCoordinates?: GeoCoordinates;
    distanceMeters?: number;
  };
  recommendations: RankedWaterPoint[];
  metadata: {
    totalCandidatesEvaluated: number;
    filtersApplied: {
      buildingId?: string;
      floor?: number | 'all';
      requiresChilled?: boolean;
      requiresRoPurified?: boolean;
      operationalOnly?: boolean;
    };
    queryTimestamp: string;
    engineVersion: string;
  };
}

export interface DiscoveryConversationState {
  currentLocation?: {
    type: 'building' | 'geo';
    buildingId?: string;
    buildingName?: string;
    buildingCode?: string;
    geoCoordinates?: GeoCoordinates;
  };
  selectedFloor?: number | 'all';
  preferences: {
    chilledOnly: boolean;
    roPurifiedOnly: boolean;
    operationalOnly: boolean;
  };
  lastReturnedWaterPointIds: string[];
  conversationHistory: Array<{
    role: 'student' | 'assistant';
    text: string;
    timestamp: string;
    resultSnapshot?: RecommendationResult;
  }>;
}
