import { createClerkClient } from '@clerk/backend';

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

export interface AuthResult {
  userId: string;
  sessionId: string;
}

/**
 * Verifies a Clerk Bearer token from the Authorization header.
 * Returns the userId and sessionId on success, or throws on failure.
 */
export async function verifyAuth(authHeader?: string): Promise<AuthResult> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }

  const token = authHeader.slice(7);

  const requestState = await clerk.authenticateRequest(
    new Request('https://ownerscout.app', {
      headers: { Authorization: `Bearer ${token}` },
    }),
    { secretKey: process.env.CLERK_SECRET_KEY! }
  );

  if (!requestState.isSignedIn || !requestState.toAuth()?.userId) {
    throw new Error('Unauthorized');
  }

  const auth = requestState.toAuth()!;
  return {
    userId: auth.userId!,
    sessionId: auth.sessionId!,
  };
}

/**
 * Middleware helper that wraps an API handler with Clerk auth.
 * Injects userId into the request and returns 401 if not authenticated.
 */
export function withAuth<T extends { userId?: string }>(
  handler: (req: T & { userId: string }, res: any) => Promise<void>
) {
  return async (req: T, res: any) => {
    try {
      const authHeader = (req as any).headers?.authorization;
      const { userId } = await verifyAuth(authHeader);
      (req as any).userId = userId;
      await handler(req as T & { userId: string }, res);
    } catch (err: any) {
      const message = err?.message || 'Unauthorized';
      if (message === 'Unauthorized' || message.includes('Authorization')) {
        res.status(401).json({ error: 'Unauthorized' });
      } else {
        console.error('Auth error:', err);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };
}
