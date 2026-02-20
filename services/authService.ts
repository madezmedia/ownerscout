/**
 * Auth service helpers for attaching Clerk tokens to API requests.
 */

/**
 * Gets the current Clerk session token.
 * Pass in the `getToken` function from `useAuth()`.
 */
export async function getAuthToken(
  getToken: (options?: { template?: string }) => Promise<string | null>
): Promise<string> {
  const token = await getToken();
  if (!token) throw new Error('Not authenticated');
  return token;
}

/**
 * Builds standard auth headers for fetch requests.
 */
export async function authHeaders(
  getToken: (options?: { template?: string }) => Promise<string | null>
): Promise<HeadersInit> {
  const token = await getAuthToken(getToken);
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}
