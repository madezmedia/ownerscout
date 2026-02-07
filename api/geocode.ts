// Vercel serverless function for Geocoding API
export default async function handler(req, res) {
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const { address } = req.query;

    if (!apiKey) {
        return res.status(500).json({ error: 'GOOGLE_MAPS_API_KEY not configured' });
    }

    if (!address || typeof address !== 'string') {
        return res.status(400).json({ error: 'address is required' });
    }

    try {
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
        );

        const data = await response.json();
        return res.json(data);
    } catch (error) {
        console.error('API error:', error);
        return res.status(500).json({ error: 'Request failed', details: error.message });
    }
}
