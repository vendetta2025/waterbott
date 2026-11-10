import { HealthCheckResponse, ProblemReportDraft } from '../types';

/**
 * Empty Bottle - API Client Service
 *
 * Configured for independent deployment:
 * - When frontend is deployed to Vercel and backend to Render, set VITE_API_BASE_URL.
 * - In local dev or unified container, defaults to current origin / relative API routes.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export async function checkBackendHealth(): Promise<HealthCheckResponse> {
  const url = `${API_BASE_URL}/api/health`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Backend health check failed: HTTP ${response.status}`);
  }

  return response.json();
}

export async function submitProblemReport(report: ProblemReportDraft): Promise<{ status: string; message: string; reportId: string }> {
  const url = `${API_BASE_URL}/api/reports`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      ...report,
      submittedAt: new Date().toISOString(),
      source: 'web_student_app',
    }),
  });

  if (!response.ok) {
    throw new Error(`Report submission failed: HTTP ${response.status}`);
  }

  const result = await response.json();
  return {
    status: result.status || 'received',
    message: result.message || 'Report logged successfully',
    reportId: `REP-${Math.floor(100000 + Math.random() * 900000)}`,
  };
}

export async function fetchBuildings(): Promise<{ buildings: import('../types').Building[]; storageMode: string; message: string }> {
  const url = `${API_BASE_URL}/api/buildings`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch buildings: HTTP ${response.status}`);
  }

  const data = await response.json();
  return {
    buildings: data.data || [],
    storageMode: data.storageMode || 'express_in_memory_preview',
    message: data.message || '',
  };
}

export async function createBuilding(payload: Partial<import('../types').Building>): Promise<import('../types').Building> {
  const url = `${API_BASE_URL}/api/buildings`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to create building: HTTP ${response.status}`);
  }

  const result = await response.json();
  return result.data;
}

export async function updateBuilding(id: string, payload: Partial<import('../types').Building>): Promise<import('../types').Building> {
  const url = `${API_BASE_URL}/api/buildings/${id}`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to update building: HTTP ${response.status}`);
  }

  const result = await response.json();
  return result.data;
}

export async function updateBuildingCoordinates(id: string, coordinates: import('../types').Coordinates | null): Promise<import('../types').Building> {
  const url = `${API_BASE_URL}/api/buildings/${id}/coordinates`;
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ coordinates }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to update coordinates: HTTP ${response.status}`);
  }

  const result = await response.json();
  return result.data;
}

export async function deleteBuilding(id: string): Promise<import('../types').Building> {
  const url = `${API_BASE_URL}/api/buildings/${id}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to delete building: HTTP ${response.status}`);
  }

  const result = await response.json();
  return result.data;
}

export async function fetchWaterPoints(): Promise<import('../types').WaterPoint[]> {
  const url = `${API_BASE_URL}/api/water-points`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch water points: HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.data || [];
}

export async function fetchRecommendations(
  query: import('../types').RecommendationQuery
): Promise<import('../types').RecommendationResult> {
  const url = `${API_BASE_URL}/api/recommendations`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(query),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch recommendations: HTTP ${response.status}`);
  }

  return response.json();
}

// ==========================================
// Map References API Client
// ==========================================

export interface MapReferencesResponse {
  data: import('../types').MapReference[];
  unconfiguredLegend: Array<{ mapNumber: number; legendLabel: string; category: string }>;
  counts: {
    totalConfigured: number;
    identified: number;
    unidentified: number;
    unconfiguredLegend: number;
  };
  storageMode: string;
}

export async function fetchMapReferences(): Promise<MapReferencesResponse> {
  const url = `${API_BASE_URL}/api/map-references`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch map references: HTTP ${response.status}`);
  }

  return response.json();
}

export async function createMapReference(
  payload: Partial<import('../types').MapReference>
): Promise<import('../types').MapReference> {
  const url = `${API_BASE_URL}/api/map-references`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to create map reference: HTTP ${response.status}`);
  }

  const result = await response.json();
  return result.data;
}

export async function updateMapReference(
  id: string,
  payload: Partial<import('../types').MapReference>
): Promise<import('../types').MapReference> {
  const url = `${API_BASE_URL}/api/map-references/${id}`;
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to update map reference: HTTP ${response.status}`);
  }

  const result = await response.json();
  return result.data;
}

export async function deleteMapReference(id: string): Promise<import('../types').MapReference> {
  const url = `${API_BASE_URL}/api/map-references/${id}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to delete map reference: HTTP ${response.status}`);
  }

  const result = await response.json();
  return result.data;
}


