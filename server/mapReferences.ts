import { MapReference } from '../src/types/index.ts';

/**
 * Initial dataset of printed map references on the LPU Isometric Campus Guide Map.
 *
 * Coordinates are normalized X/Y percentages (0.0% to 100.0%) verified against
 * the supplied 1658x949 pixel image asset.
 *
 * References without verified map coordinates are NOT fabricated.
 * They are tracked as unconfigured legend references that administrators
 * can place using the interactive Admin Map Editor.
 */

export const INITIAL_MAP_REFERENCES: MapReference[] = [
  {
    id: 'ref-1',
    mapNumber: 1,
    map_x: 35.65,
    map_y: 87.14,
    linkedBuildingId: null,
    identificationStatus: 'UNIDENTIFIED',
    legendLabel: 'Fashion',
    notes: 'South entrance academic block near main gate'
  },
  {
    id: 'ref-2',
    mapNumber: 2,
    map_x: 36.13,
    map_y: 75.66,
    linkedBuildingId: null,
    identificationStatus: 'UNIDENTIFIED',
    legendLabel: 'Baldev Raj Auditorium',
    notes: 'Near central avenue curve'
  },
  {
    id: 'ref-3',
    mapNumber: 3,
    map_x: 49.03,
    map_y: 78.82,
    linkedBuildingId: null,
    identificationStatus: 'UNIDENTIFIED',
    legendLabel: 'Physiotherapy',
    notes: 'Large modern grey curved building complex'
  },
  {
    id: 'ref-6',
    mapNumber: 6,
    map_x: 34.74,
    map_y: 72.60,
    linkedBuildingId: null,
    identificationStatus: 'UNIDENTIFIED',
    legendLabel: 'Architecture',
    notes: 'Red building cluster west of main avenue'
  },
  {
    id: 'ref-11',
    mapNumber: 11,
    map_x: 46.68,
    map_y: 58.69,
    linkedBuildingId: null,
    identificationStatus: 'UNIDENTIFIED',
    legendLabel: 'Block 11',
    notes: 'East cluster near education pavilion'
  },
  {
    id: 'ref-12',
    mapNumber: 12,
    map_x: 42.10,
    map_y: 55.85,
    linkedBuildingId: null,
    identificationStatus: 'UNIDENTIFIED',
    legendLabel: 'Block 12',
    notes: 'Adjacent to Block 11 corridor'
  },
  {
    id: 'ref-13',
    mapNumber: 13,
    map_x: 35.10,
    map_y: 59.33,
    linkedBuildingId: 'b-umall',
    identificationStatus: 'IDENTIFIED',
    legendLabel: 'Business / Student Welfare (Uni-Mall)',
    notes: 'Multi-level student retail and dining centre'
  },
  {
    id: 'ref-14',
    mapNumber: 14,
    map_x: 31.24,
    map_y: 51.32,
    linkedBuildingId: 'b-14',
    identificationStatus: 'IDENTIFIED',
    legendLabel: 'Block 14',
    notes: 'Sciences wing building along the central spine'
  },
  {
    id: 'ref-15',
    mapNumber: 15,
    map_x: 40.17,
    map_y: 55.22,
    linkedBuildingId: null,
    identificationStatus: 'UNIDENTIFIED',
    legendLabel: 'Hotel Management / Exhibition Hall',
    notes: 'Large curved dark auditorium and hospitality complex'
  },
  {
    id: 'ref-18',
    mapNumber: 18,
    map_x: 41.13,
    map_y: 46.36,
    linkedBuildingId: null,
    identificationStatus: 'UNIDENTIFIED',
    legendLabel: 'Education',
    notes: 'North-east of Hotel Management building'
  },
  {
    id: 'ref-21',
    mapNumber: 21,
    map_x: 36.31,
    map_y: 45.73,
    linkedBuildingId: null,
    identificationStatus: 'UNIDENTIFIED',
    legendLabel: 'Film & Journalism / Law',
    notes: 'Academic block facing central courtyard'
  },
  {
    id: 'ref-27',
    mapNumber: 27,
    map_x: 29.55,
    map_y: 38.57,
    linkedBuildingId: null,
    identificationStatus: 'UNIDENTIFIED',
    legendLabel: 'Physical Science',
    notes: 'West of central academic corridor'
  },
  {
    id: 'ref-28',
    mapNumber: 28,
    map_x: 30.28,
    map_y: 46.79,
    linkedBuildingId: 'b-28',
    identificationStatus: 'IDENTIFIED',
    legendLabel: 'Biotechnology',
    notes: 'Engineering & Computing cluster block 28'
  },
  {
    id: 'ref-33',
    mapNumber: 33,
    map_x: 31.60,
    map_y: 45.73,
    linkedBuildingId: null,
    identificationStatus: 'UNIDENTIFIED',
    legendLabel: 'Computer Application',
    notes: 'Central IT wing'
  },
  {
    id: 'ref-34',
    mapNumber: 34,
    map_x: 32.45,
    map_y: 47.42,
    linkedBuildingId: 'b-34',
    identificationStatus: 'IDENTIFIED',
    legendLabel: 'Computer Science',
    notes: 'Academic Core block 34'
  },
  {
    id: 'ref-35',
    mapNumber: 35,
    map_x: 33.29,
    map_y: 50.37,
    linkedBuildingId: 'b-lib',
    identificationStatus: 'IDENTIFIED',
    legendLabel: 'Shanti Devi Mittal Auditorium / Central Library',
    notes: 'Central campus library and ceremonial auditorium'
  },
  {
    id: 'ref-36',
    mapNumber: 36,
    map_x: 33.90,
    map_y: 43.41,
    linkedBuildingId: null,
    identificationStatus: 'UNIDENTIFIED',
    legendLabel: 'Electronic Telecom',
    notes: 'Electronics and communication engineering block'
  },
  {
    id: 'ref-37',
    mapNumber: 37,
    map_x: 43.31,
    map_y: 47.42,
    linkedBuildingId: null,
    identificationStatus: 'UNIDENTIFIED',
    legendLabel: 'Research',
    notes: 'Dedicated research laboratories complex'
  },
  {
    id: 'ref-38',
    mapNumber: 38,
    map_x: 30.10,
    map_y: 47.21,
    linkedBuildingId: 'b-38',
    identificationStatus: 'IDENTIFIED',
    legendLabel: 'Civil',
    notes: 'Management & Arts / Civil wing block 38'
  },
  {
    id: 'ref-43',
    mapNumber: 43,
    map_x: 33.53,
    map_y: 39.62,
    linkedBuildingId: null,
    identificationStatus: 'UNIDENTIFIED',
    legendLabel: 'Block 43',
    notes: 'Annex block south of indoor stadium'
  },
  {
    id: 'ref-47',
    mapNumber: 47,
    map_x: 31.48,
    map_y: 37.72,
    linkedBuildingId: null,
    identificationStatus: 'UNIDENTIFIED',
    legendLabel: 'Indoor Stadium / Multipurpose Complex',
    notes: 'Large enclosed sports and convocation arena'
  },
  {
    id: 'ref-48',
    mapNumber: 48,
    map_x: 30.28,
    map_y: 25.50,
    linkedBuildingId: null,
    identificationStatus: 'UNIDENTIFIED',
    legendLabel: 'Block 48',
    notes: 'North-east sports precinct block'
  },
  {
    id: 'ref-49',
    mapNumber: 49,
    map_x: 26.90,
    map_y: 27.82,
    linkedBuildingId: null,
    identificationStatus: 'UNIDENTIFIED',
    legendLabel: 'Block 49',
    notes: 'West of block 48 along perimeter road'
  },
  {
    id: 'ref-50',
    mapNumber: 50,
    map_x: 34.26,
    map_y: 22.97,
    linkedBuildingId: null,
    identificationStatus: 'UNIDENTIFIED',
    legendLabel: 'Block 50',
    notes: 'Northernmost residential/academic annex'
  },
  {
    id: 'ref-51',
    mapNumber: 51,
    map_x: 34.08,
    map_y: 29.19,
    linkedBuildingId: null,
    identificationStatus: 'UNIDENTIFIED',
    legendLabel: 'Block 51',
    notes: 'Academic block east of indoor stadium'
  },
  {
    id: 'ref-52',
    mapNumber: 52,
    map_x: 29.98,
    map_y: 23.29,
    linkedBuildingId: null,
    identificationStatus: 'UNIDENTIFIED',
    legendLabel: 'Cricket Stadium Pavilion',
    notes: 'Pavilion overlooking cricket oval'
  },
  {
    id: 'ref-53',
    mapNumber: 53,
    map_x: 14.05,
    map_y: 35.93,
    linkedBuildingId: null,
    identificationStatus: 'UNIDENTIFIED',
    legendLabel: 'Sports Courts',
    notes: 'Adjacent to tennis and outdoor courts'
  },
  {
    id: 'ref-54',
    mapNumber: 54,
    map_x: 13.15,
    map_y: 32.56,
    linkedBuildingId: null,
    identificationStatus: 'UNIDENTIFIED',
    legendLabel: 'Sports Pavilion',
    notes: 'Athletic track viewing pavilion'
  },
  {
    id: 'ref-56',
    mapNumber: 56,
    map_x: 7.90,
    map_y: 31.82,
    linkedBuildingId: null,
    identificationStatus: 'UNIDENTIFIED',
    legendLabel: 'Mechanical',
    notes: 'Western engineering workshops'
  },
  {
    id: 'ref-57',
    mapNumber: 57,
    map_x: 7.18,
    map_y: 30.87,
    linkedBuildingId: null,
    identificationStatus: 'UNIDENTIFIED',
    legendLabel: 'Polytechnique',
    notes: 'Polytechnic institute wing'
  },
  {
    id: 'ref-58',
    mapNumber: 58,
    map_x: 7.24,
    map_y: 23.18,
    linkedBuildingId: null,
    identificationStatus: 'UNIDENTIFIED',
    legendLabel: 'Project Lab',
    notes: 'Far north-west project and fabrication labs'
  }
];

/**
 * Printed guide legend entries that do not yet have verified pixel coordinates
 * on the physical map graphic.
 * These are tracked transparently as unconfigured items.
 */
export const UNCONFIGURED_LEGEND_NUMBERS: Array<{ mapNumber: number; legendLabel: string; category: string }> = [
  { mapNumber: 4, legendLabel: 'Pharmacy', category: 'Education' },
  { mapNumber: 7, legendLabel: 'Pharmacy', category: 'Education' },
  { mapNumber: 8, legendLabel: 'Animation & Fine Arts', category: 'Education' },
  { mapNumber: 19, legendLabel: 'Performing Arts', category: 'Education' },
  { mapNumber: 20, legendLabel: 'Film & Journalism / Law', category: 'Education' },
  { mapNumber: 25, legendLabel: 'Agriculture', category: 'Education' },
  { mapNumber: 26, legendLabel: 'Agriculture', category: 'Education' },
  { mapNumber: 29, legendLabel: 'Administrative', category: 'Administrative' },
  { mapNumber: 30, legendLabel: 'Prochancellor', category: 'Administrative' },
  { mapNumber: 31, legendLabel: 'Chancellor / Administrative', category: 'Administrative' },
  { mapNumber: 32, legendLabel: 'Admission', category: 'Administrative' }
];
