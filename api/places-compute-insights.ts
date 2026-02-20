// Vercel serverless function for Places Aggregate (Area Insights) API
// Now includes: Clerk auth verification + Supabase DB cache
import { verifyAuth } from '../lib/auth.js';
import { buildCacheKey, getSearchCache, setSearchCache } from '../lib/database.js';

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Goog-FieldMask, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // --- Auth ---
  let userId: string;
  try {
    const auth = await verifyAuth(req.headers?.authorization);
    userId = auth.userId;
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GOOGLE_MAPS_API_KEY not configured' });
  }

  // Search params are passed from the frontend alongside the Google API body
  const { _meta, ...googleBody } = req.body ?? {};
  const meta = _meta ?? {};
  const { zipCode, radiusKm, filters, insightType } = meta;

  // --- DB Cache check ---
  if (zipCode && filters && insightType) {
    const cacheKey = buildCacheKey({ zipCode, radiusKm: radiusKm ?? 5, filters, insightType });
    const cached = await getSearchCache(cacheKey);
    if (cached) {
      console.log(`[cache hit] key=${cacheKey.slice(0, 8)} user=${userId}`);
      return res.status(200).json({ ...cached, _cached: true, _cacheKey: cacheKey });
    }
  }

  // --- Call Google API ---
  try {
    const url = `https://areainsights.googleapis.com/v1:computeInsights?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-FieldMask': req.headers['x-goog-fieldmask'] || 'count,placeInsights',
      },
      body: JSON.stringify(googleBody),
    });

    const responseText = await response.text();

    if (!responseText) {
      return res.status(response.status || 500).json({
        error: 'Empty response from Google API',
        status: response.status,
      });
    }

    let data: unknown;
    try {
      data = JSON.parse(responseText);
    } catch {
      return res.status(500).json({ error: 'Invalid JSON from Google API' });
    }

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    // --- Save to DB cache ---
    if (zipCode && filters && insightType) {
      const cacheKey = buildCacheKey({ zipCode, radiusKm: radiusKm ?? 5, filters, insightType });
      setSearchCache({
        cacheKey,
        zipCode,
        radiusKm: radiusKm ?? 5,
        filters,
        insightType,
        result: data,
      }).catch(console.error);
      return res.status(200).json({ ...(data as object), _cacheKey: cacheKey });
    }

    return res.status(200).json(data);
  } catch (error: any) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Request failed', details: error.message });
  }
}
