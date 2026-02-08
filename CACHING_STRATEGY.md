# OwnerScout Caching Strategy

## Executive Summary

This document outlines the comprehensive caching strategy for OwnerScout to reduce API costs and improve performance. By implementing intelligent caching, we can reduce costs by **80-95%** while improving user experience.

## Current State Analysis

### API Costs Per Search

| API Endpoint | Calls Per Search | Cost Per 1000 | Cost Per Search |
|-------------|------------------|---------------|-----------------|
| Geocoding | 1 | $5.00 | $0.005 |
| Places Aggregate | 1-5* | $7.00 | $0.007-$0.035 |
| Place Details | 20-80 | $5.00 | $0.10-$0.40 |
| **Total** | **22-86** | - | **$0.11-$0.44** |

*Aggregate API may be called multiple times when rating range splitting occurs due to >100 results.

### Data Flow

```
User Search (ZIP + Radius)
    ↓
1. Geocode ZIP → Coordinates (1 API call)
    ↓
2. Places Aggregate → List of place IDs (1-5 API calls)
    ↓
3. Fetch Place Details (20-80 API calls)
    ↓
4. Crawl Websites (20-80 HTTP requests)
    ↓
5. Analyze Tech Stack (client-side)
    ↓
6. Calculate Fit Scores
    ↓
7. Return Results
```

### Pain Points

1. **Repeated searches** in same ZIP code = redundant API calls
2. **Same restaurants** appear in overlapping searches = re-fetching details
3. **Tech analysis** is slow (5-10s per website) but deterministic
4. **Geocoding** same ZIP codes repeatedly
5. **No persistence** across sessions

## Caching Strategy

### Cache Layers

We'll implement a multi-tier caching strategy:

```
┌─────────────────────────────────────────────────────────┐
│                    Application Layer                    │
├─────────────────────────────────────────────────────────┤
│  Memory Cache (Session)        │  Persistent Cache      │
│  - Quick access                 │  - IndexedDB           │
│  - Volatile                     │  - Survives refresh    │
│  - 50-100MB limit               │  - 500MB limit         │
├─────────────────────────────────────────────────────────┤
│                    Network Layer                        │
├─────────────────────────────────────────────────────────┤
│  API Proxy Cache (Vercel)                                │
│  - Server-side caching                                   │
│  - Shared across users                                   │
│  - CDN-backed                                            │
└─────────────────────────────────────────────────────────┘
```

### What to Cache

| Data Type | Cache Location | TTL | Reasoning |
|-----------|---------------|-----|-----------|
| Geocoding (ZIP → Coords) | IndexedDB | 30 days | ZIP coordinates rarely change |
| Place Details | IndexedDB | 7 days | Restaurant info changes slowly |
| Tech Stack | IndexedDB | 3 days | Websites change occasionally |
| Chain Detection | Memory | Session | Deterministic, fast to compute |
| Aggregate Results | Memory | 1 hour | Too large, quick expiry |
| Sonic Brand | IndexedDB | 7 days | Audio presence changes slowly |

### Cache Key Strategy

```typescript
// Geocoding
`geocode:${zipCode}`

// Place Details
`place:${placeId}`

// Tech Stack
`tech:${websiteDomain}`

// Aggregate Results
`aggregate:${zipCode}:${radius}:${filtersHash}`

// Sonic Brand
`sonic:${websiteDomain}`
```

### TTL Rationale

| TTL | Use Case | Examples |
|-----|----------|----------|
| **1 hour** | Highly volatile | Aggregate search results (counts change) |
| **1 day** | Semi-volatile | Tech stack (websites update) |
| **7 days** | Slow-changing | Place details, sonic brand |
| **30 days** | Rarely changes | Geocoding coordinates |

### Cache Invalidation Strategy

1. **Time-based expiration** (TTL)
2. **Manual refresh** button for users
3. **Smart refresh**: Update cache in background after TTL expires
4. **Version bumping**: Increment cache version when schemas change

## Implementation Architecture

### Cache Service Design

```typescript
interface CacheService {
  // Get from cache (checks memory, then IndexedDB)
  get<T>(key: string): Promise<T | null>

  // Set in cache (writes to both memory and IndexedDB)
  set<T>(key: string, value: T, ttl: number): Promise<void>

  // Delete specific key
  delete(key: string): Promise<void>

  // Clear all cache
  clear(): Promise<void>

  // Get cache statistics
  getStats(): Promise<CacheStats>
}

interface CacheStats {
  hits: number
  misses: number
  hitRate: number
  size: number
  keys: number
}
```

### Integration Points

```typescript
// placesService.ts
const place = await cache.get(`place:${placeId}`)
if (!place) {
  place = await fetchPlaceDetails(placeId)
  await cache.set(`place:${placeId}`, place, 7 * 24 * 60 * 60) // 7 days
}

// techDetector.ts
const tech = await cache.get(`tech:${domain}`)
if (!tech) {
  tech = await detectTechStack(website)
  await cache.set(`tech:${domain}`, tech, 3 * 24 * 60 * 60) // 3 days
}

// Geocoding
const coords = await cache.get(`geocode:${zipCode}`)
if (!coords) {
  coords = await getCoordinates(zipCode)
  await cache.set(`geocode:${zipCode}`, coords, 30 * 24 * 60 * 60) // 30 days
}
```

## Cost Savings Analysis

### Scenario 1: New User (Cold Cache)

| Action | API Calls | Cost |
|--------|-----------|------|
| First search (28202, 10km) | 82 | $0.41 |

### Scenario 2: Same User, Second Search (Warm Cache)

| Action | API Calls | Cost | Savings |
|--------|-----------|------|---------|
| Search nearby ZIP (28203, 10km) | 5 (new places only) | $0.025 | **94%** |
| Search same ZIP (28202, 20km) | 0 (all cached) | $0.00 | **100%** |

### Scenario 3: Power User (100 searches/month)

| Without Cache | With Cache | Savings |
|---------------|------------|---------|
| ~8,200 API calls | ~500 API calls | **94%** |
| ~$41.00/month | ~$2.50/month | **$38.50/month** |

### Projected Annual Savings

| Users | Searches/Month | Annual Cost (No Cache) | Annual Cost (With Cache) | Savings |
|-------|----------------|------------------------|-------------------------|---------|
| 1 | 20 | $98.40 | $6.00 | $92.40 |
| 10 | 20 | $984.00 | $60.00 | $924.00 |
| 100 | 20 | $9,840.00 | $600.00 | $9,240.00 |

### Performance Improvements

| Operation | Without Cache | With Cache | Improvement |
|-----------|---------------|------------|-------------|
| Geocoding | 500ms | 5ms | **100x faster** |
| Place Details | 200ms each | 5ms each | **40x faster** |
| Tech Detection | 5000ms | 5ms | **1000x faster** |
| Total Search Time | 45-90s | 5-10s | **9x faster** |

## Edge Cases & Considerations

### 1. Stale Data

**Problem:** Restaurant closes or changes ownership
**Solution:**
- 7-day TTL for place details
- User can force refresh
- Display "last updated" timestamp

### 2. Cache Overflow

**Problem:** IndexedDB has storage limits (typically 50-80% of disk quota)
**Solution:**
- LRU eviction policy
- Maximum cache size limit (500MB)
- Automatic cleanup of oldest entries

### 3. Cross-Domain Issues

**Problem:** IndexedDB is origin-specific
**Solution:**
- Cache is per-domain (expected behavior)
- For Vercel deployment, all users share origin

### 4. Schema Changes

**Problem:** Cache format becomes incompatible
**Solution:**
- Version the cache (e.g., `v1`, `v2`)
- Increment version on breaking changes
- Clear old cache on version mismatch

### 5. Privacy

**Problem:** Caching user search patterns
**Solution:**
- No personal data in cache keys
- Aggregate search results only
- Clear cache on logout

## Implementation Phases

### Phase 1: Core Cache Service (Week 1)
- [ ] Implement IndexedDB wrapper
- [ ] Add memory cache layer
- [ ] Create cache statistics
- [ ] Add cache management UI

### Phase 2: Service Integration (Week 1-2)
- [ ] Update placesService.ts
- [ ] Update techDetector.ts
- [ ] Update geocoding
- [ ] Update sonicBrandDetector.ts

### Phase 3: Optimization (Week 2)
- [ ] Add background refresh
- [ ] Implement smart pre-fetching
- [ ] Add cache warming for common ZIPs
- [ ] Performance monitoring

### Phase 4: Server-Side Caching (Week 3)
- [ ] Add Vercel KV / Redis cache
- [ ] Implement CDN caching headers
- [ ] Add stale-while-revalidate
- [ ] Cross-user cache sharing

## Monitoring & Metrics

### Key Metrics to Track

```typescript
interface CacheMetrics {
  // Performance
  avgResponseTime: number
  cacheHitRate: number
  cacheMissRate: number

  // Cost
  totalApiCalls: number
  cachedApiCalls: number
  costSavings: number

  // Storage
  cacheSize: number
  cacheEntryCount: number
  oldestEntry: Date
  newestEntry: Date

  // Errors
  cacheErrors: number
  staleDataErrors: number
}
```

### Alerting Thresholds

- Cache hit rate < 50% → Investigate
- Cache size > 400MB → Warning
- API calls > 1000/day → Alert
- Stale data reported > 5% → Review TTL

## Maintenance

### Regular Tasks

- **Daily:** Monitor cache hit rates
- **Weekly:** Review cost savings
- **Monthly:** Tune TTL values based on data freshness needs
- **Quarterly:** Audit cache storage and clean up

### Cache Versioning

When updating the cache schema:
1. Increment `CACHE_VERSION` constant
2. Old cache will be auto-cleared on load
3. Users will see one-time performance dip
4. Document breaking changes

## Future Enhancements

1. **Predictive Pre-fetching**
   - Cache nearby ZIP codes when user searches
   - Pre-fetch tech stacks for high-fit restaurants

2. **Differential Updates**
   - Only fetch changed fields for place details
   - Incremental tech stack updates

3. **Machine Learning**
   - Learn optimal TTL per data type
   - Predict which searches will be repeated

4. **Shared Cache**
   - Server-side cache shared across all users
   - Redis/Vercel KV for hot data

5. **Offline Mode**
   - Full offline capability with cached data
   - Background sync when online

## Conclusion

This caching strategy provides:
- **80-95% reduction** in API costs
- **9x faster** search performance
- **Better UX** with instant results for repeated searches
- **Scalability** for more users and searches

The implementation prioritizes:
1. Correctness (data freshness)
2. Performance (fast cache hits)
3. Cost savings (reduced API calls)
4. User experience (transparent caching)
