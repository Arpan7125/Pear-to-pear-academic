// API Client for P2P Academic Library
// In dev: proxied via Next.js rewrites to localhost:8080
// In production: set NEXT_PUBLIC_API_URL to your deployed Go backend

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
    const { headers: customHeaders, ...rest } = options ?? {};
    const isFormData = rest.body instanceof FormData;
    
    const headers: Record<string, string> = { ...customHeaders as Record<string, string> };
    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${BASE_URL}${url}`, {
        ...rest,
        headers,
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Request failed');
    return data.data;
}

// Auth
export async function login(username: string, password: string) {
    return fetchJSON<{ user: import('./types').User; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
    });
}

export async function signup(username: string, email: string, password: string) {
    return fetchJSON<import('./types').User>('/users', {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
    });
}

// Users
export async function getUsers() {
    return fetchJSON<import('./types').User[]>('/users');
}

export async function getUser(id: string) {
    return fetchJSON<import('./types').User>(`/users/${id}`);
}

export async function getUserReputation(id: string) {
    return fetchJSON<import('./types').ReputationInfo>(`/users/${id}/reputation`);
}

export async function getLeaderboard(limit = 10) {
    return fetchJSON<import('./types').User[]>(`/leaderboard?limit=${limit}`);
}

// Resources
export async function getAllResources() {
    return fetchJSON<import('./types').SearchResults>('/resources');
}

export async function getPopularResources(limit = 10) {
    return fetchJSON<import('./types').Resource[]>(`/resources/popular?limit=${limit}`);
}

export async function getRecentResources(limit = 10) {
    return fetchJSON<import('./types').Resource[]>(`/resources/recent?limit=${limit}`);
}

export async function createResource(data: FormData, userId: string) {
    return fetchJSON<import('./types').Resource>('/resources', {
        method: 'POST',
        headers: { 'X-User-ID': userId },
        body: data,
    });
}

export async function downloadResource(id: string, userId: string) {
    // On serverless, we can't serve physical files. Instead, hit the download API
    // to register the download and show a confirmation.
    const result = await fetchJSON<import('./types').Resource>(`/resources/${id}/download?user_id=${userId}`);
    alert(`Download registered for: ${result.filename}\n\nIn a production environment with file storage (e.g., Cloud Storage), this would trigger an actual file download.`);
    return result;
}

export async function rateResource(id: string, rating: number, comment = '', userId?: string) {
    // If no userId is provided, try to get it from local storage
    const uId = userId || (typeof window !== 'undefined' && localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).id : '');
    
    return fetchJSON<{ resource_id: string; new_rating: number }>(`/resources/${id}/rate`, {
        method: 'POST',
        body: JSON.stringify({ rating, comment, user_id: uId }),
    });
}

// Search
export async function searchResources(query: string, filters?: Record<string, string>) {
    const params = new URLSearchParams({ q: query, ...filters });
    return fetchJSON<import('./types').SearchResults>(`/search?${params}`);
}

export async function getSearchSuggestions(partial: string) {
    return fetchJSON<string[]>(`/search/suggestions?q=${partial}`);
}

// Stats
export async function getNetworkStats() {
    return fetchJSON<import('./types').NetworkStats>('/stats');
}

export async function getLibraryStats() {
    return fetchJSON<import('./types').LibraryStats>('/library/stats');
}

// Peers
export async function getPeers() {
    return fetchJSON<Array<{
        id: string;
        user_id: string;
        username: string;
        status: string;
        reputation: number;
        classification: string;
        shared_resources: number;
        ip_address: string;
    }>>('/peers');
}

// All resources (convenience)
export async function getResources() {
    const sr = await getAllResources();
    return sr.results.map(r => r.resource);
}

// User-specific
export async function getUserResources(userId: string) {
    return fetchJSON<import('./types').Resource[]>(`/users/${userId}/resources`);
}

// Admin
export async function adminDeleteUser(userId: string, adminId: string) {
    return fetchJSON<{ deleted: string }>(`/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'X-User-ID': adminId },
    });
}

export async function adminUpdateRole(userId: string, role: string, adminId: string) {
    return fetchJSON<import('./types').User>(`/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'X-User-ID': adminId },
        body: JSON.stringify({ role }),
    });
}

export async function adminDeleteResource(resourceId: string, adminId: string) {
    return fetchJSON<{ deleted: string }>(`/admin/resources/${resourceId}`, {
        method: 'DELETE',
        headers: { 'X-User-ID': adminId },
    });
}

export async function adminGetStats(adminId: string) {
    return fetchJSON<{
        network: import('./types').NetworkStats;
        library: import('./types').LibraryStats;
    }>('/admin/stats', {
        headers: { 'X-User-ID': adminId },
    });
}
