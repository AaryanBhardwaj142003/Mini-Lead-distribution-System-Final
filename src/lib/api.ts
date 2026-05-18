import { auth } from './firebase';

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };
  
  const res = await fetch(endpoint, { ...options, headers });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'API request failed');
  }
  
  return res.json();
}
