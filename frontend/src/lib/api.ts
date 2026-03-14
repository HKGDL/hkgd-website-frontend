// API base URL configuration
// In production: use environment variable VITE_API_URL or relative /api
// In development: use VITE_API_URL or default to localhost:19132
const getApiBaseUrl = () => {
  // Check for environment variable first
  const envApiUrl = import.meta.env.VITE_API_URL;
  if (envApiUrl) {
    return envApiUrl;
  }

  if (import.meta.env.PROD) {
    // Production: use relative path (same origin)
    return '/api';
  }

  // Development: default to localhost API server
  return 'http://localhost:19132/api';
};

const API_BASE_URL = getApiBaseUrl();
const AREDL_API_BASE_URL = 'https://api.aredl.net/v2/api/aredl';

// Helper function with timeout
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      credentials: 'include', // Include cookies for authentication
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

// Helper function to make authenticated requests
async function authenticatedFetch(url: string, options: RequestInit = {}) {
  return fetchWithTimeout(url, {
    ...options,
    credentials: 'include', // Include cookies for authentication
  });
}

export const api = {
  // Authentication
  login: async (password: string) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ password }),
    });
    const data = await response.json();
    // Token is now stored in httpOnly cookie by the server
    return data;
  },

  logout: async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    return response.json();
  },

  verifyToken: async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/auth/verify`, {
      method: 'POST',
      credentials: 'include',
    });
    return response.json();
  },

  // Update all level descriptions from AREDL API
  updateAllLevelDescriptions: async () => {
    try {
      const response = await fetchWithTimeout(`${AREDL_API_BASE_URL}/levels?_t=${Date.now()}`, { 
        cache: 'no-store', 
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' } 
      }, 30000);
      if (!response.ok) throw new Error('Failed to fetch AREDL levels');
      const aredlLevels = await response.json();
      return aredlLevels;
    } catch (error) {
      console.error('Failed to fetch AREDL levels:', error);
      throw error;
    }
  },

  // AREDL External API
  getAREDLLevels: async () => {
    const response = await fetchWithTimeout(`${AREDL_API_BASE_URL}/levels?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
    }, 15000);
    if (!response.ok) throw new Error('Failed to fetch AREDL levels');
    return response.json();
  },

  getAREDLCreators: async (levelId: string) => {
    const response = await fetchWithTimeout(`${AREDL_API_BASE_URL}/levels/${levelId}/creators`, {}, 10000);
    if (!response.ok) throw new Error('Failed to fetch AREDL creators');
    return response.json();
  },

  // Platformer Demons API
  getPlatformerDemons: async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/platformer-demons`, {}, 15000);
    if (!response.ok) throw new Error('Failed to fetch platformer demons');
    return response.json();
  },

  // Levels
  getLevels: async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/levels`);
    if (!response.ok) throw new Error('Failed to fetch levels');
    return response.json();
  },

  getLevel: async (id: string) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/levels/${id}`);
    if (!response.ok) throw new Error('Failed to fetch level');
    return response.json();
  },

  createLevel: async (level: any) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/levels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(level),
    });
    if (!response.ok) throw new Error('Failed to create level');
    return response.json();
  },

  updateLevel: async (id: string, level: any) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/levels/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(level),
    });
    if (!response.ok) throw new Error('Failed to update level');
    return response.json();
  },

  deleteLevel: async (id: string) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/levels/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete level');
    return response.json();
  },

  addRecord: async (levelId: string, record: any) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/levels/${levelId}/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    if (!response.ok) throw new Error('Failed to add record');
    return response.json();
  },

  // Members
  getMembers: async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/members`);
    if (!response.ok) throw new Error('Failed to fetch members');
    return response.json();
  },

  // Changelog
  getChangelog: async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/changelog`);
    if (!response.ok) throw new Error('Failed to fetch changelog');
    return response.json();
  },

  addChangelog: async (entry: any) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/changelog`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (!response.ok) throw new Error('Failed to add changelog entry');
    return response.json();
  },

  deleteChangelogEntry: async (id: string) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/changelog/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete changelog entry');
    return response.json();
  },

  clearChangelog: async () => {
    const response = await authenticatedFetch(`${API_BASE_URL}/changelog`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to clear changelog');
    return response.json();
  },

  // Pending Submissions
  getPendingSubmissions: async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/pending-submissions`);
    if (!response.ok) throw new Error('Failed to fetch pending submissions');
    return response.json();
  },

  createPendingSubmission: async (submission: any) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/pending-submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || 'Failed to create submission');
    }
    return response.json();
  },

  updatePendingSubmission: async (id: string, status: string) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/pending-submissions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error('Failed to update submission');
    return response.json();
  },

  // AREDL Sync
  syncAREDL: async () => {
    const response = await authenticatedFetch(`${API_BASE_URL}/aredl-sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Failed to sync AREDL');
    return response.json();
  },
};