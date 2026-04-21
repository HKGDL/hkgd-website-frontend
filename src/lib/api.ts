// API base URL configuration
// Always use relative /api path since Vite proxies /api in dev
// and production server serves both frontend and API from same origin
const getApiBaseUrl = () => {
  // Check for environment variable first
  const envApiUrl = import.meta.env.VITE_API_URL;
  if (envApiUrl) {
    return envApiUrl;
  }

  // Always use relative path - works for both dev (via Vite proxy) and production
  return '/api';
};

export const API_BASE_URL = getApiBaseUrl();
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
  const token = localStorage.getItem('hkgd_admin_token');
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return fetchWithTimeout(url, {
    ...options,
    headers,
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
    // Store token in localStorage for authenticated requests
    if (data.success && data.token) {
      localStorage.setItem('hkgd_admin_token', data.token);
    }
    return data;
  },

  logout: async () => {
    localStorage.removeItem('hkgd_admin_token');
    const response = await fetchWithTimeout(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    return response.json();
  },

  verifyToken: async () => {
    const token = localStorage.getItem('hkgd_admin_token');
    if (!token) {
      return { success: false };
    }
    const response = await fetchWithTimeout(`${API_BASE_URL}/auth/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
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

  // Platformer Levels
  getPlatformerLevels: async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/platformer-levels`);
    if (!response.ok) throw new Error('Failed to fetch platformer levels');
    return response.json();
  },

  // Search levels via History GD API
  searchLevels: async (query: string) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/gdbrowser/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Failed to search levels');
    return response.json();
  },

  // Get level details via History GD API
  getLevelDetails: async (levelId: string) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/gdbrowser/level/${levelId}`);
    if (!response.ok) throw new Error('Failed to fetch level details');
    return response.json();
  },

  getPlatformerLevel: async (id: string) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/platformer-levels/${id}`);
    if (!response.ok) throw new Error('Failed to fetch platformer level');
    return response.json();
  },

  createPlatformerLevel: async (level: any) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/platformer-levels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(level),
    });
    if (!response.ok) throw new Error('Failed to create platformer level');
    return response.json();
  },

  updatePlatformerLevel: async (id: string, level: any) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/platformer-levels/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(level),
    });
    if (!response.ok) throw new Error('Failed to update platformer level');
    return response.json();
  },

  deletePlatformerLevel: async (id: string) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/platformer-levels/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete platformer level');
    return response.json();
  },

  addPlatformerRecord: async (levelId: string, record: any) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/platformer-levels/${levelId}/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    if (!response.ok) throw new Error('Failed to add platformer record');
    return response.json();
  },

  updatePlatformerRecord: async (recordId: number, record: any) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/platformer-records/${recordId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    if (!response.ok) throw new Error('Failed to update platformer record');
    return response.json();
  },

  deletePlatformerRecord: async (recordId: number) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/platformer-records/${recordId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete platformer record');
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

  updateRecord: async (recordId: number, record: any) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/records/${recordId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    if (!response.ok) throw new Error('Failed to update record');
    return response.json();
  },

  deleteRecord: async (recordId: number) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/records/${recordId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete record');
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

  // Settings
  getSettings: async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/settings`);
    if (!response.ok) throw new Error('Failed to fetch settings');
    return response.json();
  },

  updateSetting: async (key: string, value: boolean) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/settings/${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });
    if (!response.ok) throw new Error('Failed to update setting');
    return response.json();
  },

  // IP Ban Management
  getIPBans: async () => {
    const response = await authenticatedFetch(`${API_BASE_URL}/ip-bans`);
    if (!response.ok) throw new Error('Failed to fetch IP bans');
    return response.json();
  },

  unbanIP: async (ip: string) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/ip-bans/${encodeURIComponent(ip)}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to unban IP');
    return response.json();
  },

  // Suggestions
  getSuggestions: async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/suggestions`);
    if (!response.ok) throw new Error('Failed to fetch suggestions');
    return response.json();
  },

  getPendingSuggestions: async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/suggestions/pending`);
    if (!response.ok) throw new Error('Failed to fetch pending suggestions');
    return response.json();
  },

  createSuggestion: async (suggestion: any) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(suggestion),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || 'Failed to submit suggestion');
    }
    return response.json();
  },

  updateSuggestion: async (id: string, data: { status: string; adminNotes?: string }) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/suggestions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update suggestion');
    return response.json();
  },

  deleteSuggestion: async (id: string) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/suggestions/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete suggestion');
    return response.json();
  },

  // Player Mappings
  getPlayerMappings: async () => {
    const response = await authenticatedFetch(`${API_BASE_URL}/player-mappings`);
    if (!response.ok) throw new Error('Failed to fetch player mappings');
    return response.json();
  },

  getPlayerMapping: async (gameName: string) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/player-mapping?gameName=${encodeURIComponent(gameName)}`);
    if (!response.ok) throw new Error('Failed to fetch player mapping');
    return response.json();
  },

  createPlayerMapping: async (mapping: { gameName: string; dbName: string; accountId?: number | null }) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/player-mapping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mapping),
    });
    if (!response.ok) throw new Error('Failed to create player mapping');
    return response.json();
  },

  deletePlayerMapping: async (id: number) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/player-mapping/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete player mapping');
    return response.json();
  },
};