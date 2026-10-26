const API_BASE_URL = import.meta.env.VITE_API_BASE_URL !== undefined ? import.meta.env.VITE_API_BASE_URL : 'http://localhost:8080';

let inMemoryToken = null;
let refreshPromise = null;

export const setAccessToken = (token) => {
  inMemoryToken = token;
};

export const getAccessToken = () => inMemoryToken;

export async function apiClient(endpoint, options = {}, isRetry = false) {
  const { headers = {}, body, ...customConfig } = options;

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  if (inMemoryToken) {
    defaultHeaders.Authorization = `Bearer ${inMemoryToken}`;
  }

  const config = {
    method: body ? 'POST' : 'GET',
    ...customConfig,
    headers: {
      ...defaultHeaders,
      ...headers,
    },
    credentials: 'include', // Ensures HttpOnly refresh_token cookie is sent across ports
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
