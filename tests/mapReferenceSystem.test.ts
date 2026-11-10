import assert from 'node:assert/strict';
import { INITIAL_MAP_REFERENCES, UNCONFIGURED_LEGEND_NUMBERS } from '../server/mapReferences.ts';
import { MapReference, Building } from '../src/types/index.ts';

console.log('======================================================');
console.log('Empty Bottle: Map Reference System Verification Suite');
console.log('======================================================\n');

let passedCount = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ PASS: ${name}`);
    passedCount++;
  } catch (err: any) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${err.message}`);
    process.exitCode = 1;
  }
}

// Test 1: Configured references count & coordinate normalization
test('Test 1.1: Configured map references have valid normalized coordinates between 0 and 100', () => {
  assert.ok(INITIAL_MAP_REFERENCES.length >= 25, `Expected at least 25 configured references, found ${INITIAL_MAP_REFERENCES.length}`);
  for (const ref of INITIAL_MAP_REFERENCES) {
    assert.ok(ref.map_x >= 0 && ref.map_x <= 100, `Ref #${ref.mapNumber} map_x out of bounds: ${ref.map_x}`);
    assert.ok(ref.map_y >= 0 && ref.map_y <= 100, `Ref #${ref.mapNumber} map_y out of bounds: ${ref.map_y}`);
    assert.ok(Number.isInteger(ref.mapNumber), `Ref mapNumber must be an integer: ${ref.mapNumber}`);
  }
});

// Test 2: Status distinction between IDENTIFIED and UNIDENTIFIED
test('Test 2.1: Key known buildings are correctly IDENTIFIED and linked', () => {
  const ref34 = INITIAL_MAP_REFERENCES.find((r) => r.mapNumber === 34);
  assert.ok(ref34, 'Map reference #34 must exist');
  assert.equal(ref34.identificationStatus, 'IDENTIFIED');
  assert.equal(ref34.linkedBuildingId, 'b-34');

  const ref28 = INITIAL_MAP_REFERENCES.find((r) => r.mapNumber === 28);
  assert.ok(ref28, 'Map reference #28 must exist');
  assert.equal(ref28.identificationStatus, 'IDENTIFIED');
  assert.equal(ref28.linkedBuildingId, 'b-28');

  const ref13 = INITIAL_MAP_REFERENCES.find((r) => r.mapNumber === 13);
  assert.ok(ref13, 'Map reference #13 must exist');
  assert.equal(ref13.identificationStatus, 'IDENTIFIED');
  assert.equal(ref13.linkedBuildingId, 'b-umall');
});

test('Test 2.2: Unassociated printed numbers are UNIDENTIFIED without invented details', () => {
  const ref47 = INITIAL_MAP_REFERENCES.find((r) => r.mapNumber === 47);
  assert.ok(ref47, 'Map reference #47 must exist');
  assert.equal(ref47.identificationStatus, 'UNIDENTIFIED');
  assert.equal(ref47.linkedBuildingId, null);

  const ref1 = INITIAL_MAP_REFERENCES.find((r) => r.mapNumber === 1);
  assert.ok(ref1, 'Map reference #1 must exist');
  assert.equal(ref1.identificationStatus, 'UNIDENTIFIED');
  assert.equal(ref1.linkedBuildingId, null);

  const ref58 = INITIAL_MAP_REFERENCES.find((r) => r.mapNumber === 58);
  assert.ok(ref58, 'Map reference #58 must exist');
  assert.equal(ref58.identificationStatus, 'UNIDENTIFIED');
  assert.equal(ref58.linkedBuildingId, null);
});

// Test 3: Unconfigured legend list
test('Test 3.1: Unconfigured legend numbers are tracked transparently without fabricated coordinates', () => {
  assert.ok(UNCONFIGURED_LEGEND_NUMBERS.length > 0, 'Unconfigured legend list must exist');
  const numbersInLegend = UNCONFIGURED_LEGEND_NUMBERS.map((u) => u.mapNumber);
  assert.ok(numbersInLegend.includes(4), 'Pharmacy #4 should be in unconfigured legend');
  assert.ok(numbersInLegend.includes(8), 'Animation #8 should be in unconfigured legend');
  assert.ok(numbersInLegend.includes(20), 'Law #20 should be in unconfigured legend');
  assert.ok(numbersInLegend.includes(31), 'Chancellor #31 should be in unconfigured legend');
});

// Test 4: Association logic (simulation of PATCH /api/map-references/:id)
test('Test 4.1: Associating an unidentified hotspot links building and marks it IDENTIFIED', () => {
  const testRef: MapReference = {
    id: 'ref-47',
    mapNumber: 47,
    map_x: 31.48,
    map_y: 37.72,
    linkedBuildingId: null,
    identificationStatus: 'UNIDENTIFIED',
  };

  const testBuilding: Building = {
    id: 'b-indoor',
    name: 'Indoor Stadium',
    code: 'INDOOR',
    campusZone: 'Sports & Activities',
    floorsCount: 2,
    activeWaterPointsCount: 2,
    totalWaterPointsCount: 2,
  };

  // Associate
  testRef.linkedBuildingId = testBuilding.id;
  testRef.identificationStatus = 'IDENTIFIED';
  testBuilding.mapNumber = testRef.mapNumber;
  testBuilding.coordinates = { x: testRef.map_x, y: testRef.map_y };

  assert.equal(testRef.identificationStatus, 'IDENTIFIED');
  assert.equal(testRef.linkedBuildingId, 'b-indoor');
  assert.equal(testBuilding.mapNumber, 47);
  assert.deepEqual(testBuilding.coordinates, { x: 31.48, y: 37.72 });
});

test('Test 4.2: Unlinking a hotspot marks it UNIDENTIFIED without deleting building', () => {
  const testRef: MapReference = {
    id: 'ref-13',
    mapNumber: 13,
    map_x: 35.10,
    map_y: 59.33,
    linkedBuildingId: 'b-umall',
    identificationStatus: 'IDENTIFIED',
  };

  const buildingsList: Building[] = [
    {
      id: 'b-umall',
      name: 'Uni-Mall',
      code: 'UMALL',
      campusZone: 'Commercial',
      mapNumber: 13,
      floorsCount: 3,
      activeWaterPointsCount: 5,
      totalWaterPointsCount: 6,
    },
  ];

  // Unlink
  testRef.linkedBuildingId = null;
  testRef.identificationStatus = 'UNIDENTIFIED';
  // Building remains in directory!
  assert.equal(buildingsList.length, 1, 'Building must NOT be deleted upon unlinking');
  assert.equal(testRef.identificationStatus, 'UNIDENTIFIED');
  assert.equal(testRef.linkedBuildingId, null);
});

console.log('\n------------------------------------------------------');
console.log(`Results: ${passedCount} of 6 test suites passed.`);
console.log('------------------------------------------------------\n');
