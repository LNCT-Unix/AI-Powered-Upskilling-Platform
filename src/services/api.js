const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

let inMemoryToken = null;

export const setAccessToken = (token) => {
  inMemoryToken = token;
};

export const getAccessToken = () => inMemoryToken;

export async function apiClient(endpoint, options = {}) {
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

  return response.json();
}
