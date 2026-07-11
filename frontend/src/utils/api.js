// API Utility for CRM System

export const API_HOST = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : window.location.origin;

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('crm_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  const url = endpoint.startsWith('http') ? endpoint : `${API_HOST}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers
  });

  if (response.status === 401 || response.status === 403) {
    // Session expired or invalid
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_user');
    
    // Redirect or notify Auth state change (only if not already on login page)
    window.dispatchEvent(new Event('crm_auth_expired'));
  }

  return response;
}
