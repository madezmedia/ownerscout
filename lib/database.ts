import { supabase } from './supabase.js';
import crypto from 'crypto';

// ============================================================
// Cache key generation
// ============================================================

/**
 * Generates a deterministic cache key from search parameters.
 * Sorts object keys so the key is stable regardless of insertion order.
 */
export function buildCacheKey(params: {
  zipCode: string;
  radiusKm: number;
  filters: Record<string, unknown>;
  insightType: string;
}): string {
  const normalized = JSON.stringify({
    z: params.zipCode,
    r: params.radiusKm,
    f: sortObjectKeys(params.filters),
    t: params.insightType,
  });
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

function sortObjectKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(sortObjectKeys).sort();
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj as object)
      .sort()
      .reduce((acc, key) => {
        (acc as any)[key] = sortObjectKeys((obj as any)[key]);
        return acc;
      }, {} as object);
  }
  return obj;
}

// ============================================================
// Search cache
// ============================================================

export async function getSearchCache(cacheKey: string): Promise<unknown | null> {
  const { data, error } = await supabase
    .from('search_cache')
    .select('result, expires_at')
    .eq('cache_key', cacheKey)
    .single();

  if (error || !data) return null;

  // Check expiry
  if (new Date(data.expires_at) < new Date()) {
    // Delete stale entry asynchronously
    supabase.from('search_cache').delete().eq('cache_key', cacheKey);
    return null;
  }

  return data.result;
}

export async function setSearchCache(params: {
  cacheKey: string;
  zipCode: string;
  radiusKm: number;
  filters: Record<string, unknown>;
  insightType: string;
  result: unknown;
  ttlDays?: number;
}): Promise<void> {
  const ttlDays = params.ttlDays ?? 7;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + ttlDays);

  const { error } = await supabase.from('search_cache').upsert(
    {
      cache_key: params.cacheKey,
      zip_code: params.zipCode,
      radius_km: params.radiusKm,
      filters: params.filters,
      insight_type: params.insightType,
      result: params.result,
      expires_at: expiresAt.toISOString(),
    },
    { onConflict: 'cache_key' }
  );

  if (error) console.error('Failed to write search cache:', error.message);
}

// ============================================================
// Place detail cache
// ============================================================

export async function getPlaceCache(placeId: string): Promise<unknown | null> {
  const { data, error } = await supabase
    .from('place_cache')
    .select('data, expires_at')
    .eq('place_id', placeId)
    .single();

  if (error || !data) return null;
  if (new Date(data.expires_at) < new Date()) {
    supabase.from('place_cache').delete().eq('place_id', placeId);
    return null;
  }
  return data.data;
}

export async function setPlaceCache(placeId: string, data: unknown): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const { error } = await supabase.from('place_cache').upsert(
    { place_id: placeId, data, expires_at: expiresAt.toISOString() },
    { onConflict: 'place_id' }
  );

  if (error) console.error('Failed to write place cache:', error.message);
}

// ============================================================
// Saved searches
// ============================================================

export interface SavedSearch {
  id: string;
  user_id: string;
  name: string;
  zip_code: string;
  radius_km: number;
  filters: Record<string, unknown>;
  last_cache_key: string | null;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function getSavedSearches(userId: string): Promise<SavedSearch[]> {
  const { data, error } = await supabase
    .from('saved_searches')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createSavedSearch(params: {
  userId: string;
  name: string;
  zipCode: string;
  radiusKm: number;
  filters: Record<string, unknown>;
}): Promise<SavedSearch> {
  const { data, error } = await supabase
    .from('saved_searches')
    .insert({
      user_id: params.userId,
      name: params.name,
      zip_code: params.zipCode,
      radius_km: params.radiusKm,
      filters: params.filters,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteSavedSearch(id: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('saved_searches')
    .delete()
    .eq('id', id)
    .eq('user_id', userId); // enforce ownership

  if (error) throw new Error(error.message);
}

export async function updateSavedSearchLastRun(
  id: string,
  userId: string,
  cacheKey: string
): Promise<void> {
  const { error } = await supabase
    .from('saved_searches')
    .update({
      last_cache_key: cacheKey,
      last_run_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) console.error('Failed to update saved search last_run:', error.message);
}
