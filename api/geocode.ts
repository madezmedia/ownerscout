// Vercel serverless function for Geocoding API
// Now includes: Clerk auth verification
import { verifyAuth } from '../lib/auth.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
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

  const { address, lat, lng } = req.query;

  try {
    let url: string;
    if (lat && lng) {
      url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    } else if (address && typeof address === 'string') {
      url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    } else {
      return res.status(400).json({ error: 'address or lat+lng are required' });
    }

    const response = await fetch(url);
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error: any) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Request failed', details: error.message });
  }
}
