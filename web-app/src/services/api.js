import { isNativeMobile, mobileStorage } from './mobileStorage';

let activeMobileUrl = null;

export const getApiBaseUrl = () => {
  const customUrl = typeof window !== 'undefined' ? localStorage.getItem('octobyte_api_url') : null;
  if (customUrl) {
    return customUrl.replace(/\/+$/, '');
  }
  if (isNativeMobile()) {
    if (activeMobileUrl) return activeMobileUrl;
    // Default to the host Wi-Fi LAN IP so untethered mobile works out-of-the-box!
    return import.meta.env.VITE_MOBILE_API_BASE_URL || 'http://10.71.104.22:8080';
  }
  return (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
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
  let baseUrl = getApiBaseUrl();

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

  let response;
  try {
    response = await fetch(`${baseUrl}${endpoint}`, config);
  } catch (netErr) {
    // If running on native mobile and initial endpoint failed (e.g. USB plugged out or Wi-Fi switch),
    // try the alternative endpoint (switching between Wi-Fi LAN IP and localhost)
    if (isMobile && !isRetry) {
      const altUrl = baseUrl.includes('localhost') ? 'http://10.71.104.22:8080' : 'http://localhost:8080';
      try {
        response = await fetch(`${altUrl}${endpoint}`, config);
        activeMobileUrl = altUrl; // Remember working endpoint
        baseUrl = altUrl;
      } catch {
        throw new Error('Server unreachable. Please check your network or Wi-Fi connection.');
      }
    } else {
      throw new Error(isMobile ? 'Server unreachable. Please check your network or Wi-Fi connection.' : (netErr.message || 'Network request failed'));
    }
  }

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

          let refreshRes;
          try {
            refreshRes = await fetch(`${baseUrl}/api/auth/refresh`, {
              method: 'POST',
              headers: refreshHeaders,
              credentials: isMobile ? 'omit' : 'include',
              ...(refreshBody ? { body: refreshBody } : {}),
            });
          } catch {
            if (isMobile) {
              const altUrl = baseUrl.includes('localhost') ? 'http://10.71.104.22:8080' : 'http://localhost:8080';
              refreshRes = await fetch(`${altUrl}/api/auth/refresh`, {
                method: 'POST',
                headers: refreshHeaders,
                credentials: isMobile ? 'omit' : 'include',
                ...(refreshBody ? { body: refreshBody } : {}),
              });
              activeMobileUrl = altUrl;
            }
          }

          if (!refreshRes || !refreshRes.ok) throw new Error('Token refresh failed');
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
