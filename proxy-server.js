/**
 * Local development proxy server.
 * Mirrors the Vercel serverless functions in /api/ but runs as Express for local dev.
 * Includes Clerk JWT verification and Supabase DB caching (when env vars are set).
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import crypto from 'crypto';
import { createClerkClient } from '@clerk/backend';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = 3001;

// ─── Clients ─────────────────────────────────────────────────────────────────

const clerkClient = process.env.CLERK_SECRET_KEY
  ? createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })
  : null;

const supabase = (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    })
  : null;

// ─── CORS ─────────────────────────────────────────────────────────────────────

app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:5173'] }));
app.use(express.json());

// ─── Auth middleware ───────────────────────────────────────────────────────────

async function verifyAuth(req) {
  // If Clerk is not configured, skip auth in dev mode
  if (!clerkClient || !process.env.CLERK_SECRET_KEY) {
    console.warn('[dev] CLERK_SECRET_KEY not set – skipping auth verification');
    return { userId: 'dev-user' };
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing Authorization header');
  }

  const token = authHeader.slice(7);
  const requestState = await clerkClient.authenticateRequest(
    new Request('https://ownerscout.app', {
      headers: { Authorization: `Bearer ${token}` },
    }),
    { secretKey: process.env.CLERK_SECRET_KEY }
  );

  if (!requestState.isSignedIn || !requestState.toAuth()?.userId) {
    throw new Error('Unauthorized');
  }

  return { userId: requestState.toAuth().userId };
}

// ─── DB cache helpers ─────────────────────────────────────────────────────────

function buildCacheKey(params) {
  const normalized = JSON.stringify({
    z: params.zipCode,
    r: params.radiusKm,
    f: sortObjectKeys(params.filters),
    t: params.insightType,
  });
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

function sortObjectKeys(obj) {
  if (Array.isArray(obj)) return obj.map(sortObjectKeys).sort();
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).sort().reduce((acc, key) => {
      acc[key] = sortObjectKeys(obj[key]);
      return acc;
    }, {});
  }
  return obj;
}

async function getSearchCache(cacheKey) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('search_cache')
    .select('result, expires_at')
    .eq('cache_key', cacheKey)
    .single();
  if (error || !data) return null;
  if (new Date(data.expires_at) < new Date()) {
    supabase.from('search_cache').delete().eq('cache_key', cacheKey);
    return null;
  }
  return data.result;
}

async function setSearchCache(params) {
  if (!supabase) return;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (params.ttlDays ?? 7));

  const { error } = await supabase.from('search_cache').upsert(
    {
      cache_key: params.cacheKey,
      zip_code: params.zipCode,
      radius_km: params.radiusKm,
      filters: params.filters,
      insight_type: params.insightType,
      result: params.result,
      expires_at: expiresAt.toISOString(),
    },
    { onConflict: 'cache_key' }
  );
  if (error) console.error('Failed to write search cache:', error.message);
}

async function getPlaceCache(placeId) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('place_cache')
    .select('data, expires_at')
    .eq('place_id', placeId)
    .single();
  if (error || !data) return null;
  if (new Date(data.expires_at) < new Date()) {
    supabase.from('place_cache').delete().eq('place_id', placeId);
    return null;
  }
  return data.data;
}

async function setPlaceCache(placeId, data) {
  if (!supabase) return;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  const { error } = await supabase.from('place_cache').upsert(
    { place_id: placeId, data, expires_at: expiresAt.toISOString() },
    { onConflict: 'place_id' }
  );
  if (error) console.error('Failed to write place cache:', error.message);
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// Places Compute Insights (with DB cache)
app.post('/api/places-compute-insights', async (req, res) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GOOGLE_MAPS_API_KEY not configured' });

  let userId;
  try {
    ({ userId } = await verifyAuth(req));
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { _meta, ...googleBody } = req.body ?? {};
  const { zipCode, radiusKm, filters, insightType } = _meta ?? {};

  // DB Cache check
  if (zipCode && filters && insightType) {
    const cKey = buildCacheKey({ zipCode, radiusKm: radiusKm ?? 5, filters, insightType });
    const cached = await getSearchCache(cKey);
    if (cached) {
      console.log(`[cache hit] key=${cKey.slice(0, 8)} user=${userId}`);
      return res.json({ ...cached, _cached: true, _cacheKey: cKey });
    }
  }

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
    if (!responseText) return res.status(response.status || 500).json({ error: 'Empty response' });

    let data;
    try { data = JSON.parse(responseText); } catch { return res.status(500).json({ error: 'Invalid JSON from Google API' }); }
    if (!response.ok) return res.status(response.status).json(data);

    // Save to DB cache
    if (zipCode && filters && insightType) {
      const cKey = buildCacheKey({ zipCode, radiusKm: radiusKm ?? 5, filters, insightType });
      setSearchCache({ cacheKey: cKey, zipCode, radiusKm: radiusKm ?? 5, filters, insightType, result: data }).catch(console.error);
      return res.json({ ...data, _cacheKey: cKey });
    }

    res.json(data);
  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(500).json({ error: 'Proxy request failed', details: error.message });
  }
});

// Place Details (with DB cache)
app.get('/api/places/:placeId', async (req, res) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GOOGLE_MAPS_API_KEY not configured' });

  try { await verifyAuth(req); } catch { return res.status(401).json({ error: 'Unauthorized' }); }

  const { placeId } = req.params;

  const cached = await getPlaceCache(placeId);
  if (cached) return res.json({ ...cached, _cached: true });

  try {
    const response = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}?key=${apiKey}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-FieldMask': req.headers['x-goog-fieldmask'] || 'id,displayName,types,rating,userRatingCount,priceLevel,formattedAddress,location,websiteUri,nationalPhoneNumber'
        }
      }
    );
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);

    setPlaceCache(placeId, data).catch(console.error);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Proxy request failed' });
  }
});

// Geocoding + Reverse Geocoding (unified endpoint)
app.get('/api/geocode', async (req, res) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GOOGLE_MAPS_API_KEY not configured' });

  try { await verifyAuth(req); } catch { return res.status(401).json({ error: 'Unauthorized' }); }

  const { address, lat, lng } = req.query;

  try {
    let url;
    if (lat && lng) {
      url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    } else if (address) {
      url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    } else {
      return res.status(400).json({ error: 'address or lat+lng are required' });
    }
    const response = await fetch(url);
    res.json(await response.json());
  } catch (error) {
    res.status(500).json({ error: 'Proxy request failed' });
  }
});

// Reverse Geocoding (legacy separate endpoint)
app.get('/api/reverse-geocode', async (req, res) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GOOGLE_MAPS_API_KEY not configured' });

  try { await verifyAuth(req); } catch { return res.status(401).json({ error: 'Unauthorized' }); }

  const { lat, lng } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng are required' });

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
    );
    res.json(await response.json());
  } catch (error) {
    res.status(500).json({ error: 'Proxy request failed' });
  }
});

// Generic URL proxy (for website crawling / tech detection)
app.get('/api/proxy', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url parameter' });

  try {
    const response = await fetch(decodeURIComponent(url), {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OwnerScout/1.0; +https://ownerscout.com/bot)' },
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) return res.status(response.status).send(`Failed to fetch: ${response.status}`);
    res.send(await response.text());
  } catch (error) {
    res.status(500).send(`Proxy error: ${error.message}`);
  }
});

// Saved searches
app.get('/api/saved-searches', async (req, res) => {
  let userId;
  try { ({ userId } = await verifyAuth(req)); } catch { return res.status(401).json({ error: 'Unauthorized' }); }
  if (!supabase) return res.status(503).json({ error: 'Database not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing)' });

  const { data, error } = await supabase
    .from('saved_searches').select('*').eq('user_id', userId).order('updated_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

app.post('/api/saved-searches', async (req, res) => {
  let userId;
  try { ({ userId } = await verifyAuth(req)); } catch { return res.status(401).json({ error: 'Unauthorized' }); }
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });

  const { name, zipCode, radiusKm, filters } = req.body ?? {};
  if (!name || !zipCode || !filters) return res.status(400).json({ error: 'name, zipCode, and filters are required' });

  const { data, error } = await supabase
    .from('saved_searches')
    .insert({ user_id: userId, name, zip_code: zipCode, radius_km: radiusKm ?? 5, filters })
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

app.delete('/api/saved-searches', async (req, res) => {
  let userId;
  try { ({ userId } = await verifyAuth(req)); } catch { return res.status(401).json({ error: 'Unauthorized' }); }
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'id is required' });

  const { error } = await supabase.from('saved_searches').delete().eq('id', id).eq('user_id', userId);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🔒 API Proxy server running on http://localhost:${PORT}`);
  console.log(`✅ CORS enabled for localhost:3000 and localhost:5173`);
  console.log(`🔑 Google Maps API Key: ${process.env.GOOGLE_MAPS_API_KEY ? 'SET' : 'NOT SET'}`);
  console.log(`🔐 Clerk Auth: ${clerkClient ? 'SET' : 'NOT SET (auth skipped in dev)'}`);
  console.log(`🗄️  Supabase: ${supabase ? 'SET' : 'NOT SET (DB cache disabled)'}`);
});
