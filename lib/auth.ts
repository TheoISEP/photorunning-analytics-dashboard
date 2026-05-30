// Configuration de l'authentification hardcodée

export const AUTH_CREDENTIALS = {
  email: 'theocl@photorunning.com',
  password: 'theo123photorunning',
} as const;

export function validateCredentials(email: string, password: string): boolean {
  return email === AUTH_CREDENTIALS.email && password === AUTH_CREDENTIALS.password;
}

export function saveAuthSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', 'authenticated');
    localStorage.setItem('auth_timestamp', Date.now().toString());
  }
}

export function clearAuthSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_timestamp');
  }
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;

  const token = localStorage.getItem('auth_token');
  const timestamp = localStorage.getItem('auth_timestamp');

  if (!token || !timestamp) return false;

  // Vérifier si la session n'est pas trop ancienne (24h)
  const sessionAge = Date.now() - parseInt(timestamp);
  const MAX_SESSION_AGE = 24 * 60 * 60 * 1000; // 24 heures

  if (sessionAge > MAX_SESSION_AGE) {
    clearAuthSession();
    return false;
  }

  return token === 'authenticated';
}
