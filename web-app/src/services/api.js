import { isNativeMobile, mobileStorage } from './mobileStorage';

export const getApiBaseUrl = () => {
  const customUrl = typeof window !== 'undefined' ? localStorage.getItem('octobyte_api_url') : null;
  if (customUrl) {
    return customUrl.replace(/\/+$/, '');
  }
  if (isNativeMobile()) {
    // When connected over USB with `adb reverse tcp:8080 tcp:8080`, localhost:8080 reaches the host.
    // If running over Wi-Fi, set VITE_MOBILE_API_BASE_URL or localStorage 'octobyte_api_url'.
    return import.meta.env.VITE_MOBILE_API_BASE_URL || 'http://localhost:8080';
  }
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
};

let inMemoryToken = null;
let refreshPromise = null;

export const setAccessToken = (token) => {
  inMemoryToken = token;
};

export const getAccessToken = () => inMemoryToken;

export async function apiClient(endpoint, options = {}, isRetry = false) {
  const { headers = {}, body, ...customConfig } = options;
  const isMobile = isNativeMobile();
  const baseUrl = getApiBaseUrl();

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  if (isMobile) {
    defaultHeaders['X-Client-Platform'] = 'mobile';
  }

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
    credentials: isMobile ? 'omit' : 'include', // Ensures HttpOnly refresh_token cookie is sent on web
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${baseUrl}${endpoint}`, config);

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
          let refreshBody = null;
          const refreshHeaders = { 'Content-Type': 'application/json' };

          if (isMobile) {
            refreshHeaders['X-Client-Platform'] = 'mobile';
            const storedRefreshToken = await mobileStorage.getRefreshToken();
            if (!storedRefreshToken) {
              throw new Error('No refresh token available on device');
            }
            refreshBody = JSON.stringify({ refreshToken: storedRefreshToken });
          }

          const refreshRes = await fetch(`${baseUrl}/api/auth/refresh`, {
            method: 'POST',
            headers: refreshHeaders,
            credentials: isMobile ? 'omit' : 'include',
            ...(refreshBody ? { body: refreshBody } : {}),
          });

          if (!refreshRes.ok) throw new Error('Token refresh failed');
          const data = await refreshRes.json();
          const newToken = data?.data?.accessToken;

          if (isMobile && data?.data?.refreshToken) {
            await mobileStorage.setRefreshToken(data.data.refreshToken);
          }

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
      if (isMobile) {
        await mobileStorage.clearRefreshToken();
      }
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

  const responseJson = await response.json();

  // If mobile and response contains a new refreshToken, save it
  if (isMobile && responseJson?.data?.refreshToken) {
    await mobileStorage.setRefreshToken(responseJson.data.refreshToken);
  }

  return responseJson;
}
