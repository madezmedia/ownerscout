// Vercel serverless function for saved searches CRUD
// GET  /api/saved-searches          → list user's saved searches
// POST /api/saved-searches          → create a saved search
// DELETE /api/saved-searches?id=... → delete a saved search
// POST /api/saved-searches/run      → run a saved search (returns cached or fresh results)
import { verifyAuth } from '../lib/auth.js';
import {
  getSavedSearches,
  createSavedSearch,
  deleteSavedSearch,
  buildCacheKey,
  getSearchCache,
} from '../lib/database.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // --- Auth ---
  let userId: string;
  try {
    const auth = await verifyAuth(req.headers?.authorization);
    userId = auth.userId;
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // GET  - list saved searches
  if (req.method === 'GET') {
    try {
      const searches = await getSavedSearches(userId);

      // For each search, check if we have a fresh cached result
      const searchesWithCacheStatus = await Promise.all(
        searches.map(async (s) => {
          const cacheKey = buildCacheKey({
            zipCode: s.zip_code,
            radiusKm: s.radius_km,
            filters: s.filters,
            insightType: 'INSIGHT_PLACES',
          });
          const hasCachedResult = !!(await getSearchCache(cacheKey));
          return { ...s, has_cached_result: hasCachedResult };
        })
      );

      return res.status(200).json(searchesWithCacheStatus);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // POST - create saved search
  if (req.method === 'POST') {
    const { name, zipCode, radiusKm, filters } = req.body ?? {};

    if (!name || !zipCode || !filters) {
      return res.status(400).json({ error: 'name, zipCode, and filters are required' });
    }

    try {
      const saved = await createSavedSearch({
        userId,
        name,
        zipCode,
        radiusKm: radiusKm ?? 5,
        filters,
      });
      return res.status(201).json(saved);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // DELETE - delete saved search
  if (req.method === 'DELETE') {
    const id = req.query?.id;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'id is required as query parameter' });
    }

    try {
      await deleteSavedSearch(id, userId);
      return res.status(200).json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
