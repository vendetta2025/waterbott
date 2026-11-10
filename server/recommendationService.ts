/**
 * Empty Bottle - Backend Recommendation Engine
 *
 * Deterministic location-aware campus water-point discovery service.
 * Enforces strict non-hallucination rules:
 * - Never invents physical distances without real GPS coordinates.
 * - Never invents building adjacencies unless manually verified in `neighbourBuildingIds`.
 * - Uses transparent numerical scoring weights documented below.
 */

import {
  Building,
  WaterPoint,
  RecommendationQuery,
  RecommendationResult,
  RankedWaterPoint,
  GeoCoordinates,
  SpatialRelationType,
} from '../src/types';

// ==========================================
// Numerical Scoring Constants & Weights
// ==========================================

export const SCORING_WEIGHTS = {
  // Spatial Proximity Tier
  SAME_BUILDING: 100,
  VERIFIED_NEIGHBOUR_BUILDING: 60,
  SAME_CAMPUS_ZONE: 30,
  DIFFERENT_ZONE: 10,
  GEO_MAX_BONUS: 100, // Scaled down as distance increases up to 500m

  // Vertical (Floor) Convenience Tier
  SAME_FLOOR: 40,
  ADJACENT_FLOOR: 25, // 1 floor difference (staircase walking)
  FAR_FLOOR: 10,      // 2+ floors difference

  // Operational State Tier
  STATUS_OPERATIONAL: 30,
  STATUS_LOW_PRESSURE: 10,
  STATUS_MAINTENANCE: -100,
  STATUS_OFFLINE: -200,

  // Verification & Community Feedback Tier
  FRESH_VERIFICATION_RECENT: 20, // Verified within last 2 hours or >= 5 confirmations
  VERIFIED_TODAY: 10,            // Has at least 1 confirmation today
  UNVERIFIED_STALE: 0,           // Null lastVerifiedAt or unverified today

  // Penalties for Reported Defects
  PENALTY_RECENT_ISSUE: -30,
  PENALTY_COOLING_DEFECT: -70,
  PENALTY_UNRESOLVED_LEAK_OR_FILTER: -40,
};

// ==========================================
// Geodetic Distance Utility (Haversine)
// ==========================================

/**
 * Calculates great-circle distance between two WGS84 coordinates in meters.
 * Returns null if coordinates are missing or invalid.
 */
export function calculateHaversineMeters(
  coord1?: GeoCoordinates | null,
  coord2?: GeoCoordinates | null
): number | null {
  if (!coord1 || !coord2) return null;
  const { latitude: lat1, longitude: lon1 } = coord1;
  const { latitude: lat2, longitude: lon2 } = coord2;

  if (typeof lat1 !== 'number' || typeof lon1 !== 'number' || typeof lat2 !== 'number' || typeof lon2 !== 'number') {
    return null;
  }

  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371000; // Earth radius in meters

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// ==========================================
// Core Recommendation Engine Function
// ==========================================

export function evaluateRecommendations(
  query: RecommendationQuery,
  allBuildings: Building[],
  allWaterPoints: WaterPoint[]
): RecommendationResult {
  const queryTimestamp = new Date().toISOString();
  const maxResults = query.maxResults || 5;

  // 1. Resolve Location
  let resolvedBuilding: Building | undefined;
  let resolvedGeoLocation: GeoCoordinates | undefined;
  let resolvedDistanceMeters: number | undefined;

  // Case A: Student specifies building by ID, code, or name
  if (query.buildingId || query.buildingCode || query.buildingName) {
    const searchId = query.buildingId?.toLowerCase();
    const searchCode = query.buildingCode?.toLowerCase();
    const searchName = query.buildingName?.toLowerCase();

    resolvedBuilding = allBuildings.find(
      (b) =>
        (searchId && b.id.toLowerCase() === searchId) ||
        (searchCode && b.code.toLowerCase() === searchCode) ||
        (searchName && b.name.toLowerCase().includes(searchName))
    );
  }

  // Case B: Student explicitly shared browser GPS location
  if (!resolvedBuilding && query.geoCoordinates) {
    resolvedGeoLocation = query.geoCoordinates;

    // Find closest building with verified GPS coordinates
    const buildingsWithGeo = allBuildings
      .map((b) => ({
        building: b,
        distance: calculateHaversineMeters(query.geoCoordinates, b.geoCoordinates),
      }))
      .filter((item): item is { building: Building; distance: number } => item.distance !== null)
      .sort((a, b) => a.distance - b.distance);

    if (buildingsWithGeo.length > 0) {
      resolvedBuilding = buildingsWithGeo[0].building;
      resolvedDistanceMeters = buildingsWithGeo[0].distance;
    }
  }

  // Case C (Refinement context): If follow-up candidateWaterPointIds are provided, inherit building from candidate pool
  if (!resolvedBuilding && !resolvedGeoLocation && query.candidateWaterPointIds && query.candidateWaterPointIds.length > 0) {
    const matchedCandidate = allWaterPoints.find((wp) => query.candidateWaterPointIds!.includes(wp.id));
    if (matchedCandidate) {
      resolvedBuilding = allBuildings.find((b) => b.id === matchedCandidate.buildingId);
    }
  }

  // Case D: No location provided or unable to resolve location
  if (!resolvedBuilding && !resolvedGeoLocation) {
    return {
      status: 'needs_location',
      message:
        'Please specify your current campus building (e.g. Block 34, Central Library) or grant permission to share your location so I can recommend nearby water points.',
      recommendations: [],
      metadata: {
        totalCandidatesEvaluated: 0,
        filtersApplied: {
          floor: query.floor,
          requiresChilled: query.requiresChilled,
          requiresRoPurified: query.requiresRoPurified,
          operationalOnly: query.operationalOnly,
        },
        queryTimestamp,
        engineVersion: '1.0.0-deterministic',
      },
    };
  }

  // 2. Candidate Filtering
  // If query provides candidateWaterPointIds (e.g. conversational follow-up), scope to those
  let candidates = allWaterPoints;
  if (query.candidateWaterPointIds && query.candidateWaterPointIds.length > 0) {
    candidates = candidates.filter((wp) => query.candidateWaterPointIds!.includes(wp.id));
  }

  // Filter: Floor filter
  if (query.floor !== undefined && query.floor !== 'all') {
    candidates = candidates.filter((wp) => wp.floorNumber === query.floor);
  }

  // Filter: Chilled water requirement
  if (query.requiresChilled) {
    candidates = candidates.filter((wp) => {
      // Must support chilled water
      if (wp.dispenserType === 'normal_only') return false;
      // Must not have an active cooling failure issue
      if (wp.unresolvedIssues?.includes('cooling_not_working')) return false;
      return true;
    });
  }

  // Filter: RO purified requirement
  if (query.requiresRoPurified) {
    candidates = candidates.filter((wp) => wp.dispenserType === 'ro_purified' || wp.dispenserType === 'chilled_and_normal');
  }

  // Filter: Operational only requirement
  if (query.operationalOnly !== false) {
    // By default, exclude completely offline or undergoing maintenance dispensers
    candidates = candidates.filter((wp) => wp.operationalStatus !== 'offline' && wp.operationalStatus !== 'maintenance');
  }

  if (candidates.length === 0) {
    return {
      status: 'no_matches',
      message: `No active water dispensers matched your criteria in or around ${
        resolvedBuilding ? resolvedBuilding.name : 'your shared location'
      }.`,
      resolvedLocation: resolvedBuilding
        ? {
            type: 'building',
            building: resolvedBuilding,
            geoCoordinates: resolvedBuilding.geoCoordinates || undefined,
            distanceMeters: resolvedDistanceMeters,
          }
        : undefined,
      recommendations: [],
      metadata: {
        totalCandidatesEvaluated: 0,
        filtersApplied: {
          buildingId: resolvedBuilding?.id,
          floor: query.floor,
          requiresChilled: query.requiresChilled,
          requiresRoPurified: query.requiresRoPurified,
          operationalOnly: query.operationalOnly,
        },
        queryTimestamp,
        engineVersion: '1.0.0-deterministic',
      },
    };
  }

  // 3. Scoring & Deterministic Ranking
  const rankedResults: RankedWaterPoint[] = candidates.map((wp) => {
    const parentBuilding = allBuildings.find((b) => b.id === wp.buildingId) || {
      id: wp.buildingId,
      name: wp.buildingName,
      code: 'UNK',
      campusZone: 'Campus',
      floorsCount: 4,
      activeWaterPointsCount: 1,
      totalWaterPointsCount: 1,
    };

    let score = 0;
    const matchReasons: string[] = [];
    const caveats: string[] = [];

    // Spatial relationship calculation
    let spatialRelation: SpatialRelationType = 'other_zone';
    let distanceMeters: number | undefined;

    if (resolvedBuilding && parentBuilding.id === resolvedBuilding.id) {
      spatialRelation = 'same_building';
      score += SCORING_WEIGHTS.SAME_BUILDING;
      matchReasons.push(`Located inside your current building (${parentBuilding.name})`);
    } else if (
      resolvedBuilding &&
      resolvedBuilding.neighbourBuildingIds &&
      resolvedBuilding.neighbourBuildingIds.includes(parentBuilding.id)
    ) {
      spatialRelation = 'neighbour_building';
      score += SCORING_WEIGHTS.VERIFIED_NEIGHBOUR_BUILDING;
      matchReasons.push(`In adjacent building (${parentBuilding.name})`);
    } else if (resolvedBuilding && parentBuilding.campusZone === resolvedBuilding.campusZone) {
      spatialRelation = 'same_zone';
      score += SCORING_WEIGHTS.SAME_CAMPUS_ZONE;
      matchReasons.push(`In nearby ${parentBuilding.campusZone} (${parentBuilding.name})`);
    } else {
      score += SCORING_WEIGHTS.DIFFERENT_ZONE;
      caveats.push(`Located in ${parentBuilding.name} (${parentBuilding.campusZone})`);
    }

    // Geographic GPS Distance (if available on both sides)
    if (resolvedGeoLocation && parentBuilding.geoCoordinates) {
      const geoDist = calculateHaversineMeters(resolvedGeoLocation, parentBuilding.geoCoordinates);
      if (geoDist !== null) {
        distanceMeters = geoDist;
        const geoBonus = Math.max(0, Math.round(SCORING_WEIGHTS.GEO_MAX_BONUS - geoDist / 5));
        score += geoBonus;
        matchReasons.push(`Approximately ${geoDist}m walking distance`);
      }
    }

    // Floor convenience calculation
    const studentFloor = query.studentFloor !== undefined ? query.studentFloor : query.floor;
    const floorDifference =
      typeof studentFloor === 'number' ? Math.abs(studentFloor - wp.floorNumber) : 0;

    if (typeof studentFloor === 'number') {
      if (floorDifference === 0) {
        score += SCORING_WEIGHTS.SAME_FLOOR;
        matchReasons.push(`On your exact floor (${wp.floorNumber === 0 ? 'Ground Floor' : `Floor ${wp.floorNumber}`})`);
      } else if (floorDifference === 1) {
        score += SCORING_WEIGHTS.ADJACENT_FLOOR;
        matchReasons.push(
          wp.floorNumber > studentFloor
            ? '1 floor above (quick stairs climb)'
            : '1 floor below (quick stairs walk)'
        );
      } else {
        score += SCORING_WEIGHTS.FAR_FLOOR;
        caveats.push(`${floorDifference} floors away from your current level`);
      }
    }

    // Operational Status
    if (wp.operationalStatus === 'operational') {
      score += SCORING_WEIGHTS.STATUS_OPERATIONAL;
      matchReasons.push('Fully operational with normal water pressure');
    } else if (wp.operationalStatus === 'low_pressure') {
      score += SCORING_WEIGHTS.STATUS_LOW_PRESSURE;
      caveats.push('Low water pressure reported');
    } else if (wp.operationalStatus === 'maintenance') {
      score += SCORING_WEIGHTS.STATUS_MAINTENANCE;
      caveats.push('Currently marked for maintenance');
    } else if (wp.operationalStatus === 'offline') {
      score += SCORING_WEIGHTS.STATUS_OFFLINE;
      caveats.push('Currently offline or empty tank');
    }

    // Dispenser Capabilities
    if (wp.dispenserType === 'chilled_and_normal') {
      matchReasons.push('Chilled & ambient RO drinking water');
    } else if (wp.dispenserType === 'ro_purified') {
      matchReasons.push('RO purified drinking water');
    }

    // Community Verification Freshness
    if (wp.lastVerifiedAt) {
      if (wp.confirmationsToday >= 5) {
        score += SCORING_WEIGHTS.FRESH_VERIFICATION_RECENT;
        matchReasons.push(`High community reliability (${wp.confirmationsToday} confirmations today)`);
      } else if (wp.confirmationsToday > 0) {
        score += SCORING_WEIGHTS.VERIFIED_TODAY;
        matchReasons.push(`Confirmed working today by students`);
      } else {
        score += SCORING_WEIGHTS.UNVERIFIED_STALE;
        caveats.push(`Last verified: ${wp.lastVerifiedAt}`);
      }
    } else {
      score += SCORING_WEIGHTS.UNVERIFIED_STALE;
      caveats.push('Awaiting community verification today');
    }

    // Issue Penalties
    if (wp.recentIssueReported) {
      score += SCORING_WEIGHTS.PENALTY_RECENT_ISSUE;
      caveats.push('Recent community issue flag pending review');
    }
    if (wp.unresolvedIssues && wp.unresolvedIssues.length > 0) {
      if (wp.unresolvedIssues.includes('cooling_not_working')) {
        score += SCORING_WEIGHTS.PENALTY_COOLING_DEFECT;
        caveats.push('Chilling unit reported defective');
      }
      if (
        wp.unresolvedIssues.includes('dispenser_leaking') ||
        wp.unresolvedIssues.includes('filter_odor_taste')
      ) {
        score += SCORING_WEIGHTS.PENALTY_UNRESOLVED_LEAK_OR_FILTER;
        caveats.push('Maintenance notice logged for dispenser surroundings/filter');
      }
    }

    return {
      waterPoint: wp,
      building: parentBuilding,
      score,
      distanceMeters,
      spatialRelation,
      floorDifference,
      matchReasons,
      caveats,
    };
  });

  // Sort descending by score; if tied, sort by floor difference ascending, then confirmations
  rankedResults.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.floorDifference !== b.floorDifference) return a.floorDifference - b.floorDifference;
    return b.waterPoint.confirmationsToday - a.waterPoint.confirmationsToday;
  });

  const topRecommendations = rankedResults.slice(0, maxResults);

  return {
    status: 'resolved',
    message: `Found ${topRecommendations.length} recommended water dispenser${
      topRecommendations.length === 1 ? '' : 's'
    } near ${resolvedBuilding ? resolvedBuilding.name : 'your shared location'}.`,
    resolvedLocation: resolvedBuilding
      ? {
          type: 'building',
          building: resolvedBuilding,
          geoCoordinates: resolvedBuilding.geoCoordinates || undefined,
          distanceMeters: resolvedDistanceMeters,
        }
      : resolvedGeoLocation
      ? {
          type: 'geo_coordinates',
          geoCoordinates: resolvedGeoLocation,
        }
      : undefined,
    recommendations: topRecommendations,
    metadata: {
      totalCandidatesEvaluated: candidates.length,
      filtersApplied: {
        buildingId: resolvedBuilding?.id,
        floor: query.floor,
        requiresChilled: query.requiresChilled,
        requiresRoPurified: query.requiresRoPurified,
        operationalOnly: query.operationalOnly,
      },
      queryTimestamp,
      engineVersion: '1.0.0-deterministic',
    },
  };
}
