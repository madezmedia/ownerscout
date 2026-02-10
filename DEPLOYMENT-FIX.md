# OwnerScout Location Feature - DEPLOYMENT FIX

**Issue:** Location feature not working on Vercel deployment
**Cause:** Proxy server (proxy-server.js) doesn't work on Vercel (serverless)
**Status:** NEEDS FIX

---

## 🐛 THE PROBLEM

**What's happening:**
- The frontend code calls: `${PROXY_BASE}/api/reverse-geocode`
- `PROXY_BASE` is set to `http://localhost:3001` in local dev
- On Vercel, there's no proxy server running
- Result: API call fails → ZIP code doesn't auto-fill

**Why it happened:**
- Vercel is serverless (can't run long-running Node.js processes)
- `proxy-server.js` is a traditional Express server (runs continuously)
- Local development works, but Vercel production doesn't

---

## 🔧 THE SOLUTION

**Convert proxy-server.js to Vercel Serverless Functions**

### **Option 1: Vercel API Routes (RECOMMENDED)**

**Create:** `/api/reverse-geocode.js` (or `.ts`)

**Location:** `/Users/michaelshaw/dyad-apps/ownerscout/api/reverse-geocode.js`

**Code:**
```javascript
// api/reverse-geocode.js
export default async function handler(req, res) {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'Missing lat or lng parameter' });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'GOOGLE_MAPS_API_KEY not configured' });
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
    );

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    res.status(500).json({ error: 'Proxy request failed' });
  }
}
```

**Also convert:** `/api/geocode.js` (for forward geocoding)

**Benefits:**
- ✅ Works on Vercel (serverless function)
- ✅ No need for separate proxy server
- ✅ Auto-deploys with Vercel
- ✅ Same API endpoint URL

---

### **Option 2: Call Google Maps API Directly (SIMPLEST)**

**Change:** Remove proxy entirely, call Google Maps directly from frontend

**Pros:**
- ✅ Simple, no server needed
- ✅ Works on Vercel immediately
- ✅ Less code to maintain

**Cons:**
- ❌ API key exposed in frontend (security risk)
- ❌ Can't add rate limiting
- ❌ API key visible in browser DevTools

**NOT RECOMMENDED** for production

---

### **Option 3: Use Next.js API Routes (if migrating to Next.js)**

**If** OwnerScout was built with Next.js, we could use Next.js API routes.

**Current status:** OwnerScout appears to be React (Vite), not Next.js

---

## 📝 ACTION ITEMS

### **To fix this for Vercel deployment:**

1. **Create `/api` directory structure:**
   ```
   /Users/michaelshaw/dyad-apps/ownerscout/api/
   ├── geocode.js
   └── reverse-geocode.js
   ```

2. **Move proxy code to serverless functions:**
   - Convert `/api/reverse-geocode` endpoint
   - Convert `/api/geocode` endpoint

3. **Update frontend code:**
   - Change `PROXY_BASE` to use relative URLs
   - From: `http://localhost:3001/api/reverse-geocode`
   - To: `/api/reverse-geocode` (Vercel will handle)

4. **Update Vercel config:**
   - Add `/api` directory to Vercel deployment
   - Ensure API routes are deployed as functions

5. **Deploy to Vercel:**
   ```bash
   git add .
   git commit -m "fix: Convert proxy to Vercel serverless functions"
   git push
   ```

---

## 🎯 QUICK FIX (FOR NOW)

### **If you need the location feature working immediately:**

**Use local development:**
```bash
cd /Users/michaelshaw/dyad-apps/ownerscout
# Make sure proxy server is running
node -r dotenv/config proxy-server.js dotenv_config_path=.env.local &
# Run frontend
npm run dev
```

**Access at:** `http://localhost:3000`

**Note:** Only works locally, not on Vercel deployment

---

## ⏳ TIME ESTIMATE

**To implement Vercel serverless functions:**
- Create API routes: 15 minutes
- Update frontend code: 10 minutes
- Test locally: 10 minutes
- Deploy to Vercel: 5 minutes

**Total:** ~40 minutes

---

## ✅ CURRENT STATUS

**Local development:** ✅ Working (proxy server running on localhost:3001)  
**Vercel deployment:** ❌ Not working (no proxy server on Vercel)  
**Fix needed:** Convert to Vercel serverless functions

---

## 💡 RECOMMENDATION

**Implement Option 1** (Vercel API Routes)

**Why:**
- ✅ Secure (API key stays on server)
- ✅ Works on Vercel
- ✅ Industry standard approach
- ✅ Can add rate limiting later

**Next steps:**
1. Create `/api` directory
2. Move proxy endpoints to serverless functions
3. Update frontend to use relative URLs
4. Test + Deploy

---

*Created: 2026-02-10 13:50 EST*
*Issue identified: Proxy server doesn't work on Vercel*
*Solution: Convert to Vercel serverless functions*
*Time to fix: ~40 minutes*
