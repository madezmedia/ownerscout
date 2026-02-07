// Vercel serverless function for Place Details API
export default async function handler(req, res) {
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const { placeId } = req.query;

    if (!apiKey) {
        return res.status(500).json({ error: 'GOOGLE_MAPS_API_KEY not configured' });
    }

    if (!placeId || typeof placeId !== 'string') {
        return res.status(400).json({ error: 'placeId is required' });
    }

    try {
        const response = await fetch(
            `https://places.googleapis.com/v1/places/${placeId}?key=${apiKey}`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-FieldMask': req.headers['x-goog-fieldmask'] || ''
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        return res.json(data);
    } catch (error) {
        console.error('API error:', error);
        return res.status(500).json({ error: 'Request failed', details: error.message });
    }
}
