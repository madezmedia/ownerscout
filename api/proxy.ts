// Vercel serverless function for web crawling proxy
export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
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

    const { url } = req.query;

    if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'url parameter is required' });
    }

    try {
        const decodedUrl = decodeURIComponent(url);
        console.log(`Proxy request for: ${decodedUrl.substring(0, 100)}...`);

        const response = await fetch(decodedUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; OwnerScout/1.0; +https://ownerscout.com/bot)'
            }
        });

        if (!response.ok) {
            console.warn(`Proxy fetch failed with status: ${response.status}`);
            return res.status(response.status).send(`Failed to fetch: ${response.status}`);
        }

        const body = await response.text();
        return res.status(200).send(body);
    } catch (error) {
        console.error('Proxy fetch error:', error.message);
        return res.status(500).send(`Proxy error: ${error.message}`);
    }
}
