# Quick Start Guide

## Running OwnerScout with Proxy Server

OwnerScout requires a proxy server to bypass CORS restrictions when calling Google Places API from the browser.

### Option 1: Run Both Servers Together (Recommended)

```bash
npm run dev:all
```

This will start:
- **Proxy server** on `http://localhost:3001`
- **Frontend** on `http://localhost:3000`

### Option 2: Run Servers Separately

**Terminal 1** - Start proxy server:
```bash
npm run dev:proxy
```

**Terminal 2** - Start frontend:
```bash
npm run dev
```

---

## What the Proxy Does

The proxy server (`proxy-server.js`) runs on port 3001 and:

1. **Receives requests** from your browser at `http://localhost:3000`
2. **Forwards them** to Google Places API with your API key
3. **Returns responses** back to the browser

This bypasses CORS restrictions since the API key is used server-side, not in the browser.

### Proxy Endpoints

- `POST /api/places/computeInsights` → Places Aggregate API
- `GET /api/places/:placeId` → Place Details API
- `GET /api/geocode?address=...` → Geocoding API

---

## Troubleshooting

### "Cannot GET /" on port 3001
This is normal - the proxy server doesn't have a homepage. Just make sure it's running.

### "EADDRINUSE: address already in use :::3001"
Port 3001 is already in use. Kill the existing process:
```bash
lsof -ti:3001 | xargs kill -9
```

### "Proxy request failed"
Check that:
1. Proxy server is running (`npm run dev:proxy`)
2. API keys are in `.env.local`
3. Google Cloud APIs are enabled

---

## Environment Variables

The proxy server reads `GOOGLE_MAPS_API_KEY` from `.env.local` automatically.

**Current keys**:
- ✅ Google Maps: `AIzaSyDPaOEFB3P2IxGpc2FESIlVlCwbhdy3-UI`
- ✅ Gemini AI: `AIzaSyBV24RVNhk5Xacv5xAVHVjTJpzcSiMRtuM`

---

## Testing

1. Start both servers: `npm run dev:all`
2. Open `http://localhost:3000`
3. Enter ZIP code `28202`
4. Click "Search"
5. You should see results without CORS errors!

Check the proxy server terminal for request logs.
