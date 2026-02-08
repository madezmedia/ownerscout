import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = 3001;

// Enable CORS for local development
app.use(cors({
    origin: 'http://localhost:3000'
}));

app.use(express.json());

// Proxy endpoint for Places Aggregate API
app.post('/api/places-compute-insights', async (req, res) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    console.log('Received /api/places/computeInsights request');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('X-Goog-FieldMask:', req.headers['x-goog-fieldmask']);

    if (!apiKey) {
        console.error('GOOGLE_MAPS_API_KEY not configured');
        return res.status(500).json({ error: 'GOOGLE_MAPS_API_KEY not configured' });
    }

    try {
        // CORRECT endpoint for Places Aggregate API
        const url = `https://areainsights.googleapis.com/v1:computeInsights?key=${apiKey}`;
        const headers = {
            'Content-Type': 'application/json',
            'X-Goog-FieldMask': req.headers['x-goog-fieldmask'] || ''
        };
        const body = JSON.stringify(req.body);

        console.log('Forwarding to Google Places Aggregate API:');
        console.log('URL:', url);
        console.log('Method: POST');

        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: body
        });

        console.log('Response status:', response.status, response.statusText);

        const responseText = await response.text();
        console.log('Response body:', responseText || '(empty)');

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
            console.error('JSON parse error:', parseError.message);
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
        res.json(data);
    } catch (error) {
        console.error('Proxy error:', error.message);
        res.status(500).json({ error: 'Proxy request failed', details: error.message });
    }
});

// Proxy endpoint for Place Details
app.get('/api/places/:placeId', async (req, res) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const { placeId } = req.params;

    if (!apiKey) {
        return res.status(500).json({ error: 'GOOGLE_MAPS_API_KEY not configured' });
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

        res.json(data);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: 'Proxy request failed' });
    }
});

// Proxy endpoint for Geocoding
app.get('/api/geocode', async (req, res) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const { address } = req.query;

    console.log('Geocoding request received for address:', address);

    if (!apiKey) {
        return res.status(500).json({ error: 'GOOGLE_MAPS_API_KEY not configured' });
    }

    try {
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
        );

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: 'Proxy request failed' });
    }
});

// Generic Proxy endpoint for crawling
app.get('/api/proxy', async (req, res) => {
    const { url } = req.query;
    console.log(`Proxy request for: ${url}`);

    if (!url) {
        return res.status(400).json({ error: 'Missing url parameter' });
    }

    try {
        const response = await fetch(decodeURIComponent(url), {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; OwnerScout/1.0; +https://ownerscout.com/bot)'
            },
            timeout: 10000
        });

        if (!response.ok) {
            console.warn(`Proxy fetch failed with status: ${response.status}`);
            return res.status(response.status).send(`Failed to fetch: ${response.status}`);
        }

        const body = await response.text();
        res.send(body);
    } catch (error) {
        console.error('Proxy fetch error:', error.message);
        res.status(500).send(`Proxy error: ${error.message}`);
    }
});

app.listen(PORT, () => {
    console.log(`🔒 API Proxy server running on http://localhost:${PORT}`);
    console.log(`✅ CORS enabled for http://localhost:3000`);
    console.log(`🔑 API Key loaded: ${process.env.GOOGLE_MAPS_API_KEY ? 'YES' : 'NO'}`);
});
