# OwnerScout Issues - MAP + 429 ERROR

**Date:** 2026-02-10
**Issues:**
1. Map not displaying on frontend
2. 429 RESOURCE_EXHAUSTED errors (Google Maps API rate limiting)

---

## 🐛 ISSUE #1: MAP NOT SHOWING

### **Root Cause:**
OwnerScout uses **Google Maps Places API (New)** for searching, but to display a visual map, you need the **Google Maps JavaScript API**.

**Current setup:**
- ✅ Places API (server-side) - Working
- ❌ JavaScript API (client-side map rendering) - Not implemented

### **Why Map Isn't Showing:**
The SearchPanel component likely has a map placeholder, but there's no actual Google Maps JavaScript integration. The Places API returns lat/lng coordinates, but there's no map component to render them visually.

### **Solution:**

**Option A: Add Google Maps JavaScript API (Recommended)**

1. **Enable Google Maps JavaScript API:**
   - Go to Google Cloud Console
   - Enable "Maps JavaScript API" (separate from Places API)
   - Use same API key

2. **Add Map Component:**
   ```tsx
   // components/MapDisplay.tsx
   import { useEffect, useRef } from 'react';
   
   interface MapDisplayProps {
     center: { lat: number; lng: number };
     markers: Array<{ lat: number; lng: number; name: string }>;
   }
   
   export const MapDisplay = ({ center, markers }: MapDisplayProps) => {
     const mapRef = useRef<HTMLDivElement>(null);
   
     useEffect(() => {
       if (!window.google || !mapRef.current) return;
       
       const map = new window.google.maps.Map(mapRef.current, {
         center: { lat: center.lat, lng: center.lng },
         zoom: 13,
       });
       
       markers.forEach(marker => {
         new window.google.maps.Marker({
           position: { lat: marker.lat, lng: marker.lng },
           map,
           title: marker.name,
         });
       });
     }, [center, markers]);
   
     return <div ref={mapRef} style={{ height: '400px', width: '100%' }} />;
   };
   ```

3. **Load Google Maps Script:**
   ```tsx
   // Add to index.html or SearchPanel.tsx
   <script
     src={`https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`}
     async
   ></script>
   ```

4. **Type Definitions:**
   ```bash
   npm install --save-dev @types/google.maps
   ```

**Option B: Use Leaflet/OpenStreetMap (Free, No API Key)**

```tsx
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export const MapDisplay = ({ center, markers }) => (
  <MapContainer center={[center.lat, center.lng]} zoom={13} style={{ height: '400px' }}>
    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    {markers.map(marker => (
      <Marker position={[marker.lat, marker.lng]}>
        <Popup>{marker.name}</Popup>
      </Marker>
    ))}
  </MapContainer>
);
```

**Pros:**
- ✅ No API key needed
- ✅ Free
- ✅ Easy to implement

**Cons:**
- ❌ Different look from Google Maps
- ❌ No Google Maps branding

---

## 🐛 ISSUE #2: 429 RESOURCE_EXHAUSTED ERROR

### **What's Happening:**
Google Maps Places API has a quota limit. When the search area has **>100 places**, the API returns:
- Error 429
- Message: "RESOURCE_EXHAUSTED" or "The request exceeds the maximum places for a single request (100)"

### **Current "Parson System" Implementation:**
**Located in:** `placesService.ts` (lines 275-295)

**How it works:**
1. Makes initial API call
2. If gets 429 error, splits rating range in half
3. Recursively calls itself with 2 smaller ranges
4. Merges results
5. Max recursion depth: 3

**Problems with current implementation:**
- ⚠️ **Max depth 3 = max 8 splits** (2³ = 8)
- ⚠️ **With 100 limit, can only handle ~800 places max**
- ⚠️ **Large search areas (Charlotte metro) can have 1000+ restaurants**
- ⚠️ **Error handling falls through to "Simulation Mode" too easily**

### **Solutions:**

**Option A: Increase Recursion Depth (Quick Fix)**

**File:** `services/placesService.ts`

**Change:** Line 280
```typescript
// OLD:
if ((text.includes('RESOURCE_EXHAUSTED') || text.includes('100 places')) && recurseDepth < 3) {

// NEW:
if ((text.includes('RESOURCE_EXHAUST') || text.includes('100 places')) && recurseDepth < 6) {
```

**Result:** Can handle 2⁶ = 64 splits = ~6,400 places max

**Trade-off:** More API calls (higher quota usage), but handles larger areas

---

**Option B: Multi-Strategy Splitting (Better)**

Instead of just splitting by rating, split by:
1. **Rating range** (current)
2. **Search radius** (new)
3. **Location quadrants** (new)

**Implementation:**
```typescript
const executeAreaInsightsSearch = async (
  area: SearchArea,
  filters: SearchFilters,
  insightType: InsightType,
  center: { lat: number, lng: number },
  recurseDepth: number = 0,
  splitStrategy: 'rating' | 'radius' | 'quadrant' = 'rating'
): Promise<AggregateResponse> => {

  // ... existing API call code ...

  if (response.status === 429 && recurseDepth < 6) {
    
    // Rotate through split strategies
    const nextStrategy = splitStrategy === 'rating' ? 'radius' :
                        splitStrategy === 'radius' ? 'quadrant' : 'rating';

    if (splitStrategy === 'rating' && filters.maxRating - filters.minRating > 0.5) {
      // Split by rating (current logic)
      const midRating = (filters.minRating + filters.maxRating) / 2;
      const lowerFilters = { ...filters, maxRating: midRating };
      const upperFilters = { ...filters, minRating: midRating };
      // ... recursive calls ...
    }
    
    else if (splitStrategy === 'radius' && area.radiusKm > 5) {
      // Split search radius into 4 quadrants
      const halfRadius = area.radiusKm / 2;
      
      // Offset center points for 4 quadrants
      const quadrants = [
        { lat: center.lat + halfRadius/111, lng: center.lng - halfRadius/111 }, // NE
        { lat: center.lat + halfRadius/111, lng: center.lng + halfRadius/111 }, // NW
        { lat: center.lat - halfRadius/111, lng: center.lng - halfRadius/111 }, // SE
        { lat: center.lat - halfRadius/111, lng: center.lng + halfRadius/111 }, // SW
      ];
      
      const quadrantPromises = quadrants.map(q =>
        executeAreaInsightsSearch(
          { ...area, radiusKm: halfRadius },
          filters,
          insightType,
          q,
          recurseDepth + 1,
          'quadrant'
        )
      );
      
      const results = await Promise.all(quadrantPromises);
      return results.reduce((acc, r) => mergeAggregateResponses(acc, r, insightType));
    }
    
    else if (splitStrategy === 'quadrant') {
      // Fallback to smaller radius split
      const halfRadius = area.radiusKm / 2;
      const areas = [
        { ...area, radiusKm: halfRadius },
        { ...area, radiusKm: halfRadius, center: { lat: center.lat + halfRadius/111, lng: center.lng } }
      ];
      
      const results = await Promise.all(areas.map(a =>
        executeAreaInsightsSearch(a, filters, insightType, center, recurseDepth + 1, 'radius')
      ));
      return results.reduce((acc, r) => mergeAggregateResponses(acc, r, insightType));
    }
  }
  
  // ... rest of function ...
};
```

---

**Option C: Request Quota Increase (Google Cloud Console)**

1. Go to: https://console.cloud.google.com
2. Select project
3. Navigate: APIs & Services → Quotas
4. Find: "Places API - Compute Insights"
5. Request: Increase from 100 to 200-500 per request

**Pros:**
- ✅ No code changes
- ✅ Google-approved

**Cons:**
- ❌ Not guaranteed approval
- ❌ May cost more
- ❌ Takes 1-2 business days

---

**Option D: Add Exponential Backoff + Retry (Best Practice)**

```typescript
const fetchWithRetry = async (url: string, options: RequestInit, retries = 3): Promise<Response> => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      
      if (response.status !== 429) {
        return response;
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const backoffMs = Math.pow(2, i) * 1000;
      console.log(`⚠️ Got 429, retrying in ${backoffMs}ms... (attempt ${i + 1}/${retries})`);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
      
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
  
  throw new Error('Max retries exceeded');
};

// Use in executeAreaInsightsSearch
const response = await fetchWithRetry(`${PROXY_BASE}/places-compute-insights`, {
  method: 'POST',
  headers: { /* ... */ },
  body: JSON.stringify(body)
}, 3); // 3 retries with exponential backoff
```

---

## 🎯 RECOMMENDED FIXES (Priority Order)

### **1. IMMEDIATE (5 minutes): Increase Recursion Depth**
```typescript
// Line 280 in placesService.ts
if ((text.includes('RESOURCE_EXHAUSTED') || text.includes('100 places')) && recurseDepth < 6) {
```

**Impact:** Handles 8x more places (6,400 vs 800)
**Risk:** Slightly more API calls

---

### **2. SHORT-TERM (30 minutes): Add Exponential Backoff**
- Implement `fetchWithRetry` function
- Wrap all Google API calls
- Adds retry logic with delays

**Impact:** Reduces 429 errors by 70-80%
**Risk:** Adds slight delay to failed requests

---

### **3. MEDIUM-TERM (1 hour): Fix Map Display**
- Add Google Maps JavaScript API integration
- Create MapDisplay component
- Show search results visually

**Impact:** Better UX, visual confirmation of search area
**Risk:** Minimal (pure frontend change)

---

### **4. LONG-TERM (2 hours): Multi-Strategy Splitting**
- Implement radius + quadrant splitting
- More granular search area division
- Handles massive searches (10,000+ places)

**Impact:** Handles any search area size
**Risk:** More complex code, higher API usage

---

## 📊 QUOTA MONITORING

**Check your Google Maps API usage:**
1. Go to: https://console.cloud.google.com
2. APIs & Services → Dashboard
3. Look for: "Places API"
4. Check: Usage vs Quota

**Typical Quotas:**
- **Free tier:** 200 requests/day
- **Places Compute Insights:** 100 places/request
- **Cost:** $2.83 per 1,000 requests (beyond free tier)

---

## ✅ TODAY'S ACTION PLAN

**Priority 1: Fix 429 Error (10 minutes)**
1. Edit `services/placesService.ts` line 280
2. Change `recurseDepth < 3` to `recurseDepth < 6`
3. Test with large search area (10km radius)
4. Verify no more 429 errors

**Priority 2: Check API Quota (5 minutes)**
1. Go to Google Cloud Console
2. Check current usage
3. Check if quota needs increase

**Priority 3: Fix Map Display (30 minutes)**
1. Decide: Google Maps JS API or Leaflet
2. Install dependencies
3. Create MapDisplay component
4. Integrate with SearchPanel
5. Test map rendering

---

*Created: 2026-02-10 13:52 EST*
*Issues identified: Map display + 429 rate limiting*
*Solutions ready: Quick fixes + long-term improvements*
