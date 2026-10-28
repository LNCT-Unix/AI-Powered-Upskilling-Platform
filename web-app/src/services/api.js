const rawBaseUrl = import.meta.env.VITE_API_BASE_URL;

// In dev mode when running from localhost/Vite, prefer relative paths ('')
// so requests route through the Vite proxy to preserve same-origin HttpOnly cookies
const isCrossDomainDev =
  import.meta.env.DEV &&
  typeof window !== 'undefined' &&
  rawBaseUrl &&
  !rawBaseUrl.includes(window.location.host);

const API_BASE_URL = isCrossDomainDev || !rawBaseUrl ? '' : rawBaseUrl;

const TOKEN_KEY = 'skillpath_access_token';

let inMemoryToken = typeof window !== 'undefined' ? sessionStorage.getItem(TOKEN_KEY) : null;
let refreshPromise = null;

export const setAccessToken = (token) => {
  inMemoryToken = token;
  if (typeof window !== 'undefined') {
    try {
      if (token) {
        sessionStorage.setItem(TOKEN_KEY, token);
      } else {
        sessionStorage.removeItem(TOKEN_KEY);
      }
    } catch {
      // sessionStorage unavailable
    }
  }
};

export const getAccessToken = () => inMemoryToken;

export async function apiClient(endpoint, options = {}, isRetry = false) {
  const { headers = {}, body, ...customConfig } = options;

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const activeToken = inMemoryToken || (typeof window !== 'undefined' ? sessionStorage.getItem(TOKEN_KEY) : null);
  if (activeToken) {
    defaultHeaders.Authorization = `Bearer ${activeToken}`;
  }

  const config = {
    method: body ? 'POST' : 'GET',
    ...customConfig,
    headers: {
      ...defaultHeaders,
      ...headers,
    },
    credentials: 'include', // Ensures HttpOnly refresh_token cookie is sent
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  // If 401 Unauthorized and not already refreshing or attempting auth, try silent token refresh
  if (
    response.status === 401 &&
    !isRetry &&
    endpoint !== '/api/auth/refresh' &&
    endpoint !== '/api/auth/login' &&
    endpoint !== '/api/auth/oauth2/exchange'
  ) {
    try {
      if (!refreshPromise) {
        refreshPromise = (async () => {
          const refreshRes = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          });
          if (!refreshRes.ok) throw new Error('Token refresh failed');
          const data = await refreshRes.json();
          const newToken = data?.data?.accessToken;
          if (newToken) {
            setAccessToken(newToken);
            return newToken;
          }
          throw new Error('No access token in refresh response');
        })().finally(() => {
          refreshPromise = null;
        });
      }

      await refreshPromise;
      // Retry original request with fresh token
      return apiClient(endpoint, options, true);
    } catch {
      // Refresh failed; clear token and proceed to throw standard error
      setAccessToken(null);
    }
  }

  if (!response.ok) {
    let errorData = null;
    try {
      errorData = await response.json();
    } catch {
      // Non-JSON response
    }
    const message = errorData?.message || `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  if (response.status === 204) {
    return { success: true };
  }

  return response.json();
}
