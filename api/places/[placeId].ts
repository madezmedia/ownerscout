// Vercel serverless function for Place Details API
// Now includes: Clerk auth verification + Supabase DB cache
import { verifyAuth } from '../../lib/auth.js';
import { getPlaceCache, setPlaceCache } from '../../lib/database.js';

export default async function handler(req: any, res: any) {
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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // --- Auth ---
  try {
    await verifyAuth(req.headers?.authorization);
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GOOGLE_MAPS_API_KEY not configured' });
  }

  const { placeId } = req.query;
  if (!placeId || typeof placeId !== 'string') {
    return res.status(400).json({ error: 'placeId is required' });
  }

  // --- DB Cache check ---
  const cached = await getPlaceCache(placeId);
  if (cached) {
    console.log(`[place cache hit] placeId=${placeId}`);
    return res.status(200).json({ ...cached, _cached: true });
  }

  // --- Call Google API ---
  try {
    const fieldMask =
      req.headers['x-goog-fieldmask'] ||
      'id,displayName,types,rating,userRatingCount,priceLevel,formattedAddress,location,websiteUri,nationalPhoneNumber';

    const response = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}?key=${apiKey}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-FieldMask': fieldMask,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    // --- Save to DB cache ---
    setPlaceCache(placeId, data).catch(console.error);

    return res.status(200).json(data);
  } catch (error: any) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Request failed', details: error.message });
  }
}
