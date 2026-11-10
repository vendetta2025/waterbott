/**
 * Empty Bottle - Recommendation Engine Test Suite
 *
 * NOTE: Uses clearly labelled synthetic test fixtures only.
 * These test fixtures are NOT actual LPU campus records.
 */

import { evaluateRecommendations, calculateHaversineMeters } from '../server/recommendationService';
import { Building, WaterPoint, RecommendationQuery } from '../src/types';

// ==========================================
// Synthetic Test Fixtures (Clearly Labelled)
// ==========================================

const TEST_BUILDINGS: Building[] = [
  {
    id: 'test-bldg-alpha',
    name: '[TEST FIXTURE] Building Alpha',
    code: 'ALPHA',
    campusZone: 'Test Zone North',
    mapNumber: 101,
    floorsCount: 4,
    activeWaterPointsCount: 3,
    totalWaterPointsCount: 3,
    accessInfo: 'Test building primary entrance',
    mapCoordinates: { map_x: 20, map_y: 30 },
    geoCoordinates: { latitude: 31.2500, longitude: 75.7000 },
    neighbourBuildingIds: ['test-bldg-beta'], // Manually verified test neighbour
  },
  {
    id: 'test-bldg-beta',
    name: '[TEST FIXTURE] Building Beta',
    code: 'BETA',
    campusZone: 'Test Zone North',
    mapNumber: 102,
    floorsCount: 3,
    activeWaterPointsCount: 2,
    totalWaterPointsCount: 2,
    mapCoordinates: { map_x: 25, map_y: 35 },
    geoCoordinates: { latitude: 31.2508, longitude: 75.7008 },
    neighbourBuildingIds: ['test-bldg-alpha'],
  },
  {
    id: 'test-bldg-gamma',
    name: '[TEST FIXTURE] Building Gamma (Same Zone, Non-Neighbour)',
    code: 'GAMMA',
    campusZone: 'Test Zone North',
    mapNumber: 103,
    floorsCount: 4,
    activeWaterPointsCount: 1,
    totalWaterPointsCount: 1,
    mapCoordinates: null,
    geoCoordinates: null, // Test missing coordinates
    neighbourBuildingIds: [],
  },
  {
    id: 'test-bldg-delta',
    name: '[TEST FIXTURE] Building Delta (Other Zone, Missing GPS)',
    code: 'DELTA',
    campusZone: 'Test Zone South',
    mapNumber: 104,
    floorsCount: 3,
    activeWaterPointsCount: 1,
    totalWaterPointsCount: 1,
    mapCoordinates: null,
    geoCoordinates: null,
    neighbourBuildingIds: [],
  },
];

const TEST_WATER_POINTS: WaterPoint[] = [
  // Building Alpha - Floor 2, Chilled, Freshly Verified
  {
    id: 'wp-alpha-f2-chilled',
    buildingId: 'test-bldg-alpha',
    buildingName: '[TEST FIXTURE] Building Alpha',
    floorNumber: 2,
    locationDetails: 'Test Alpha Floor 2 Corridor',
    dispenserType: 'chilled_and_normal',
    operationalStatus: 'operational',
    communityStatus: 'verified_working',
    lastVerifiedAt: '10 mins ago',
    confirmationsToday: 7,
    recentIssueReported: false,
    unresolvedIssues: [],
  },
  // Building Alpha - Floor 1, Ambient Only, Verified Today
  {
    id: 'wp-alpha-f1-ambient',
    buildingId: 'test-bldg-alpha',
    buildingName: '[TEST FIXTURE] Building Alpha',
    floorNumber: 1,
    locationDetails: 'Test Alpha Floor 1 Foyer',
    dispenserType: 'normal_only',
    operationalStatus: 'operational',
    communityStatus: 'verified_working',
    lastVerifiedAt: '2 hours ago',
    confirmationsToday: 2,
    recentIssueReported: false,
    unresolvedIssues: [],
  },
  // Building Alpha - Floor 3, Offline / Broken Tank
  {
    id: 'wp-alpha-f3-offline',
    buildingId: 'test-bldg-alpha',
    buildingName: '[TEST FIXTURE] Building Alpha',
    floorNumber: 3,
    locationDetails: 'Test Alpha Floor 3',
    dispenserType: 'chilled_and_normal',
    operationalStatus: 'offline',
    communityStatus: 'issue_flagged',
    lastVerifiedAt: '5 hours ago',
    confirmationsToday: 0,
    recentIssueReported: true,
    unresolvedIssues: ['no_water'],
  },
  // Building Beta (Verified Neighbour) - Floor 1, Chilled, Operational
  {
    id: 'wp-beta-f1-chilled',
    buildingId: 'test-bldg-beta',
    buildingName: '[TEST FIXTURE] Building Beta',
    floorNumber: 1,
    locationDetails: 'Test Beta Floor 1',
    dispenserType: 'chilled_and_normal',
    operationalStatus: 'operational',
    communityStatus: 'verified_working',
    lastVerifiedAt: '30 mins ago',
    confirmationsToday: 4,
    recentIssueReported: false,
    unresolvedIssues: [],
  },
  // Building Gamma (Same Zone, Non-Neighbour) - Floor 1, Chilled, Stale Verification (null)
  {
    id: 'wp-gamma-f1-stale',
    buildingId: 'test-bldg-gamma',
    buildingName: '[TEST FIXTURE] Building Gamma',
    floorNumber: 1,
    locationDetails: 'Test Gamma Floor 1',
    dispenserType: 'chilled_and_normal',
    operationalStatus: 'operational',
    communityStatus: 'unverified_today',
    lastVerifiedAt: null, // Null lastVerifiedAt as required by contract
    confirmationsToday: 0,
    recentIssueReported: false,
    unresolvedIssues: [],
  },
  // Building Delta (Other Zone) - Floor 1, Cooling Failure Issue
  {
    id: 'wp-delta-f1-warm',
    buildingId: 'test-bldg-delta',
    buildingName: '[TEST FIXTURE] Building Delta',
    floorNumber: 1,
    locationDetails: 'Test Delta Floor 1',
    dispenserType: 'chilled_and_normal',
    operationalStatus: 'operational',
    communityStatus: 'issue_flagged',
    lastVerifiedAt: '1 hour ago',
    confirmationsToday: 1,
    recentIssueReported: true,
    unresolvedIssues: ['cooling_not_working'],
  },
];

// ==========================================
// Test Runner Harness
// ==========================================

let testsRun = 0;
let testsPassed = 0;

function assert(condition: boolean, testName: string, details?: string) {
  testsRun++;
  if (condition) {
    testsPassed++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    if (details) console.error(`    Details: ${details}`);
  }
}

console.log('\n======================================================');
console.log('Empty Bottle: Recommendation Engine Verification Suite');
console.log('======================================================\n');

// 1. Same-Building Recommendations
{
  const query: RecommendationQuery = {
    buildingId: 'test-bldg-alpha',
    studentFloor: 2,
    operationalOnly: true,
  };
  const res = evaluateRecommendations(query, TEST_BUILDINGS, TEST_WATER_POINTS);

  assert(
    res.status === 'resolved',
    'Test 1.1: Same-building query resolves status successfully'
  );
  assert(
    res.recommendations.length > 0 && res.recommendations[0].waterPoint.id === 'wp-alpha-f2-chilled',
    'Test 1.2: Same-building, same-floor dispenser is ranked first (#1)',
    `Top result: ${res.recommendations[0]?.waterPoint.id}`
  );
  assert(
    res.recommendations[0].spatialRelation === 'same_building',
    'Test 1.3: Spatial relation is classified as same_building'
  );
}

// 2. Verified Neighbouring-Building Recommendations
{
  // Student at Building Alpha, but only query for dispensers on Floor 1
  const query: RecommendationQuery = {
    buildingId: 'test-bldg-alpha',
    studentFloor: 1,
    operationalOnly: true,
  };
  const res = evaluateRecommendations(query, TEST_BUILDINGS, TEST_WATER_POINTS);

  // Find candidate from Beta and candidate from Gamma
  const betaRec = res.recommendations.find((r) => r.waterPoint.id === 'wp-beta-f1-chilled');
  const gammaRec = res.recommendations.find((r) => r.waterPoint.id === 'wp-gamma-f1-stale');

  assert(
    Boolean(betaRec && gammaRec && betaRec.score > gammaRec.score),
    'Test 2.1: Verified neighbour (Building Beta) scores higher than same-zone non-neighbour (Building Gamma)',
    `Beta score=${betaRec?.score}, Gamma score=${gammaRec?.score}`
  );
  assert(
    betaRec?.spatialRelation === 'neighbour_building',
    'Test 2.2: Verified neighbour has spatialRelation neighbour_building'
  );
}

// 3. Same-Zone Recommendations
{
  const query: RecommendationQuery = {
    buildingId: 'test-bldg-alpha',
    operationalOnly: true,
  };
  const res = evaluateRecommendations(query, TEST_BUILDINGS, TEST_WATER_POINTS);

  const gammaRec = res.recommendations.find((r) => r.waterPoint.id === 'wp-gamma-f1-stale');
  const deltaRec = res.recommendations.find((r) => r.waterPoint.id === 'wp-delta-f1-warm');

  assert(
    Boolean(gammaRec && deltaRec && gammaRec.score > deltaRec.score),
    'Test 3.1: Same-zone dispenser (Gamma) scores higher than other-zone dispenser (Delta)',
    `Gamma score=${gammaRec?.score}, Delta score=${deltaRec?.score}`
  );
  assert(
    gammaRec?.spatialRelation === 'same_zone',
    'Test 3.2: Same-zone non-neighbour has spatialRelation same_zone'
  );
}

// 4. Chilled-Water Filtering
{
  const query: RecommendationQuery = {
    buildingId: 'test-bldg-alpha',
    requiresChilled: true,
    operationalOnly: true,
  };
  const res = evaluateRecommendations(query, TEST_BUILDINGS, TEST_WATER_POINTS);

  const hasAmbientOnly = res.recommendations.some((r) => r.waterPoint.id === 'wp-alpha-f1-ambient');
  const hasCoolingDefect = res.recommendations.some((r) => r.waterPoint.id === 'wp-delta-f1-warm');

  assert(
    !hasAmbientOnly,
    'Test 4.1: Chilled-water filter excludes ambient-only dispensers (normal_only)'
  );
  assert(
    !hasCoolingDefect,
    'Test 4.2: Chilled-water filter excludes dispensers with unresolved cooling_not_working issue'
  );
}

// 5. Offline Dispenser Exclusion
{
  const query: RecommendationQuery = {
    buildingId: 'test-bldg-alpha',
    operationalOnly: true,
  };
  const res = evaluateRecommendations(query, TEST_BUILDINGS, TEST_WATER_POINTS);

  const hasOffline = res.recommendations.some((r) => r.waterPoint.id === 'wp-alpha-f3-offline');

  assert(
    !hasOffline,
    'Test 5.1: Operational-only filter excludes offline / broken dispensers'
  );
}

// 6. Stale Verification Scoring
{
  const query: RecommendationQuery = {
    buildingId: 'test-bldg-gamma',
    operationalOnly: true,
  };
  const res = evaluateRecommendations(query, TEST_BUILDINGS, TEST_WATER_POINTS);

  const staleRec = res.recommendations.find((r) => r.waterPoint.id === 'wp-gamma-f1-stale');

  assert(
    Boolean(staleRec && staleRec.caveats.some((c) => c.toLowerCase().includes('awaiting community verification'))),
    'Test 6.1: Null or stale lastVerifiedAt includes an explicit caveat warning'
  );
}

// 7. Missing Coordinates Handling
{
  const query: RecommendationQuery = {
    buildingId: 'test-bldg-gamma', // Gamma has null geoCoordinates and null mapCoordinates
    operationalOnly: true,
  };
  const res = evaluateRecommendations(query, TEST_BUILDINGS, TEST_WATER_POINTS);

  const gammaRec = res.recommendations.find((r) => r.waterPoint.id === 'wp-gamma-f1-stale');

  assert(
    res.status === 'resolved',
    'Test 7.1: Recommends successfully even when building has null map and geo coordinates'
  );
  assert(
    gammaRec?.distanceMeters === undefined,
    'Test 7.2: Distance in meters is undefined (never fabricated) when coordinates are missing'
  );
}

// 8. Missing Student Location Handling
{
  const query: RecommendationQuery = {
    // Neither buildingId nor geoCoordinates provided
    requiresChilled: true,
  };
  const res = evaluateRecommendations(query, TEST_BUILDINGS, TEST_WATER_POINTS);

  assert(
    res.status === 'needs_location',
    'Test 8.1: Query without student location returns status needs_location'
  );
  assert(
    res.recommendations.length === 0,
    'Test 8.2: Returns empty recommendations array instead of inventing random proximity'
  );
  assert(
    res.message.includes('specify your current campus building') || res.message.includes('permission'),
    'Test 8.3: Friendly explanation prompts user for building or permission'
  );
}

// 9. Follow-Up Filter Refinement
{
  // Step 1: Initial broad query near Building Alpha
  const queryStep1: RecommendationQuery = {
    buildingId: 'test-bldg-alpha',
    operationalOnly: true,
  };
  const res1 = evaluateRecommendations(queryStep1, TEST_BUILDINGS, TEST_WATER_POINTS);
  const candidateIds = res1.recommendations.map((r) => r.waterPoint.id);

  assert(
    candidateIds.length >= 2,
    'Test 9.1: Step 1 returns multiple initial candidates'
  );

  // Step 2: Student asks follow-up refinement: "Which one has chilled water on Floor 2?"
  const queryStep2: RecommendationQuery = {
    candidateWaterPointIds: candidateIds,
    requiresChilled: true,
    floor: 2,
    operationalOnly: true,
  };
  const res2 = evaluateRecommendations(queryStep2, TEST_BUILDINGS, TEST_WATER_POINTS);

  assert(
    res2.recommendations.length === 1 && res2.recommendations[0].waterPoint.id === 'wp-alpha-f2-chilled',
    'Test 9.2: Step 2 accurately narrows candidate set to wp-alpha-f2-chilled',
    `Step 2 count: ${res2.recommendations.length}`
  );
}

// 10. Geodetic Distance Verification (Haversine)
{
  const coordA = { latitude: 31.2500, longitude: 75.7000 };
  const coordB = { latitude: 31.2508, longitude: 75.7008 };
  const dist = calculateHaversineMeters(coordA, coordB);

  assert(
    typeof dist === 'number' && dist > 80 && dist < 150,
    'Test 10.1: Haversine distance calculates accurate physical meters between GPS pairs',
    `Calculated distance: ${dist}m`
  );

  const missingDist = calculateHaversineMeters(coordA, null);
  assert(
    missingDist === null,
    'Test 10.2: Haversine returns null when either coordinate is missing'
  );
}

console.log('\n------------------------------------------------------');
console.log(`Results: ${testsPassed} of ${testsRun} assertions passed.`);
console.log('------------------------------------------------------\n');

if (testsPassed === testsRun) {
  process.exit(0);
} else {
  process.exit(1);
}
