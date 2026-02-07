// Vercel serverless function for Place Details API
export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Goog-FieldMask'
    );

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'GOOGLE_MAPS_API_KEY not configured' });
    }

    const { placeId } = req.query;

    if (!placeId || typeof placeId !== 'string') {
        return res.status(400).json({ error: 'placeId is required' });
    }

    try {
        const fieldMask = req.headers['x-goog-fieldmask'] || 'id,displayName,types,rating,userRatingCount,priceLevel,formattedAddress,location,websiteUri,nationalPhoneNumber';

        const response = await fetch(
            `https://places.googleapis.com/v1/places/${placeId}?key=${apiKey}`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-FieldMask': fieldMask
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        return res.status(200).json(data);
    } catch (error) {
        console.error('API error:', error);
        return res.status(500).json({ error: 'Request failed', details: error.message });
    }
}
