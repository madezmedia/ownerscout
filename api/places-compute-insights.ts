// Vercel serverless function for Places Aggregate API
export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        console.error('GOOGLE_MAPS_API_KEY not configured');
        return res.status(500).json({ error: 'GOOGLE_MAPS_API_KEY not configured' });
    }

    try {
        // Places Aggregate API endpoint
        const url = `https://areainsights.googleapis.com/v1:computeInsights?key=${apiKey}`;
        const headers = {
            'Content-Type': 'application/json',
            'X-Goog-FieldMask': req.headers['x-goog-fieldmask'] || ''
        };
        const body = JSON.stringify(req.body);

        console.log('Forwarding to Google Places Aggregate API');

        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: body
        });

        const responseText = await response.text();

        if (!responseText) {
            return res.status(response.status || 500).json({
                error: 'Empty response from Google API',
                status: response.status,
                statusText: response.statusText
            });
        }

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            return res.status(500).json({
                error: 'Invalid JSON from Google API',
                details: responseText.substring(0, 500)
            });
        }

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        return res.json(data);
    } catch (error) {
        console.error('API error:', error.message);
        return res.status(500).json({ error: 'Request failed', details: error.message });
    }
}
