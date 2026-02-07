// Vercel serverless function for Places Aggregate API
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

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        console.error('GOOGLE_MAPS_API_KEY not configured');
        return res.status(500).json({ error: 'GOOGLE_MAPS_API_KEY not configured in environment' });
    }

    try {
        // Places Aggregate API endpoint
        const url = `https://areainsights.googleapis.com/v1:computeInsights?key=${apiKey}`;
        const headers = {
            'Content-Type': 'application/json',
            'X-Goog-FieldMask': req.headers['x-goog-fieldmask'] || 'count,placeInsights'
        };
        const body = JSON.stringify(req.body);

        console.log('Forwarding to Google Places Aggregate API');
        console.log('Request body keys:', Object.keys(req.body || {}));

        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: body
        });

        const responseText = await response.text();
        console.log('Response status:', response.status);

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
            console.error('JSON parse error:', parseError);
            return res.status(500).json({
                error: 'Invalid JSON from Google API',
                details: responseText.substring(0, 500)
            });
        }

        if (!response.ok) {
            console.error('Google API error:', data);
            return res.status(response.status).json(data);
        }

        console.log('✅ Success!');
        return res.status(200).json(data);
    } catch (error) {
        console.error('API error:', error);
        return res.status(500).json({
            error: 'Request failed',
            details: error.message,
            stack: error.stack
        });
    }
}
