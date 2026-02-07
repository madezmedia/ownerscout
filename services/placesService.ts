import {
  SearchArea,
  SearchFilters,
  AggregateResponse,
  InsightType,
  PlaceResult,
  PriceLevel,
  OperationalStatus,
  TechStack,
  FitAnalysis
} from '../types';
import { MOCK_ZIP_COORDS } from '../constants';
import { detectTechStack } from './techDetector';
import { detectChain } from './chainDetector';

// Detect if we're on Vercel or localhost
const isProduction = import.meta.env.PROD || window.location.hostname !== 'localhost';
const PROXY_BASE = isProduction ? '/api' : 'http://localhost:3001/api';
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const AGENT_CONFIG = {
  maxPlacesForScan: 80,
  excludedPrimaryTypes: ['fast_food_restaurant'],
  minRatingForFit: 3.8,
  maxRatingForFit: 4.9,
  scoring: {
    independent: 20,
    idealPrice: 15,
    healthyRating: 10,
    strongReviews: 10,
    commissionBleed: 35,
    noOrdering: 15,
    legacySite: 10,
    lowConfidencePenalty: -5
  }
};

const calculateFitScore = (
  place: Omit<PlaceResult, 'fit' | 'techStack'>,
  tech: TechStack,
  isIndie: boolean
): FitAnalysis => {
  let score = 0;
  const reasons: string[] = [];

  if (isIndie) {
    score += AGENT_CONFIG.scoring.independent;
    reasons.push("Independent");
  } else {
    return { score: 0, reason: "Chain Restaurant", isIndependent: false };
  }

  if (tech.onlineOrdering.some(o => o.toLowerCase().includes('owner.com'))) {
    return { score: 0, reason: "Already on Owner.com", isIndependent: isIndie };
  }

  if (place.priceLevel === PriceLevel.MODERATE || place.priceLevel === PriceLevel.EXPENSIVE) {
    score += AGENT_CONFIG.scoring.idealPrice;
    reasons.push("Ideal Price ($$-$$$)");
  }

  if (place.rating >= AGENT_CONFIG.minRatingForFit && place.rating <= AGENT_CONFIG.maxRatingForFit) {
    score += AGENT_CONFIG.scoring.healthyRating;
    reasons.push("Strong Rating");
  }

  if (place.userRatingCount >= 100) {
    score += AGENT_CONFIG.scoring.strongReviews;
    reasons.push("Strong Review Volume");
  }

  const hasDelivery = tech.delivery.length > 0;
  const hasFirstPartyOrdering = tech.hasFirstPartyOrdering;

  if (hasDelivery && !hasFirstPartyOrdering) {
    score += AGENT_CONFIG.scoring.commissionBleed;
    reasons.push("High Commission Bleed (3P Only)");
  } else if (!hasFirstPartyOrdering && tech.onlineOrdering.length === 0) {
    score += AGENT_CONFIG.scoring.noOrdering;
    reasons.push("No Online Ordering");
  }

  if (['WordPress', 'Wix', 'GoDaddy', 'Custom', 'Unknown'].includes(tech.websitePlatform)) {
    score += AGENT_CONFIG.scoring.legacySite;
    reasons.push("Legacy Website");
  }

  if (tech.confidence < 50) {
    score += AGENT_CONFIG.scoring.lowConfidencePenalty;
  }

  score = Math.max(0, Math.min(score, 100));

  let reasonString = reasons.slice(0, 3).join(", ");
  if (reasons.length > 3) reasonString += ` +${reasons.length - 3} more`;

  return { score, reason: reasonString, isIndependent: isIndie };
};

const getCoordinates = async (zipCode: string): Promise<{ lat: number; lng: number }> => {
  if (MOCK_ZIP_COORDS[zipCode]) return MOCK_ZIP_COORDS[zipCode];
  if (!GOOGLE_MAPS_API_KEY) return MOCK_ZIP_COORDS['28202'];

  try {
    const res = await fetch(`${PROXY_BASE}/geocode?address=${encodeURIComponent(zipCode)}`);
    if (!res.ok) throw new Error(`Geocoding status: ${res.status}`);
    const data = await res.json();
    if (data.results?.[0]?.geometry?.location) {
      return data.results[0].geometry.location;
    }
  } catch (e) {
    console.warn("Geocoding error, using default center.", e);
  }
  return MOCK_ZIP_COORDS['28202'];
};

const fetchPlaceDetails = async (placeId: string): Promise<Omit<PlaceResult, 'techStack' | 'fit'> | null> => {
  if (!GOOGLE_MAPS_API_KEY) return null;
  try {
    const fieldMask = 'id,displayName,types,rating,userRatingCount,priceLevel,formattedAddress,location,websiteUri,nationalPhoneNumber,currentOpeningHours';

    const res = await fetch(`${PROXY_BASE}/places/${placeId}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-FieldMask': fieldMask
      }
    });

    if (!res.ok) return null;
    const data = await res.json();

    return {
      placeId: data.id,
      name: data.displayName?.text || 'Unknown',
      types: data.types || [],
      rating: data.rating || 0,
      userRatingCount: data.userRatingCount || 0,
      priceLevel: data.priceLevel as PriceLevel,
      address: data.formattedAddress || '',
      location: { lat: data.location?.latitude || 0, lng: data.location?.longitude || 0 },
      operationalStatus: OperationalStatus.OPERATIONAL,
      website: data.websiteUri,
      phone: data.nationalPhoneNumber
    };
  } catch (e) {
    console.error("Details fetch error", e);
    return null;
  }
};

const runMockSearch = async (area: SearchArea, filters: SearchFilters, insightType: InsightType): Promise<AggregateResponse> => {
  await new Promise(resolve => setTimeout(resolve, 1000));

  let baseCount = Math.floor(Math.random() * 150) + 40;
  baseCount = Math.floor(baseCount * (area.radiusKm / 2));
  if (filters.independentOnly) baseCount = Math.floor(baseCount * 0.65);

  const breakdown: Record<string, number> = {};
  const types = filters.includedTypes.length > 0 ? filters.includedTypes : ['restaurant'];
  types.forEach(t => { breakdown[t] = Math.floor(baseCount / types.length); });

  const places: PlaceResult[] = [];
  const baseLat = area.center?.lat || 35.2271;
  const baseLng = area.center?.lng || -80.8431;

  const generateCount = insightType === InsightType.PLACES ? Math.min(baseCount, AGENT_CONFIG.maxPlacesForScan) : 0;

  for (let i = 0; i < generateCount; i++) {
    const type = types[i % types.length] || 'restaurant';
    const rating = 3.5 + Math.random() * 1.5;
    const name = `Mock Restaurant ${i + 1}`;

    const chainResult = detectChain(name);
    const isIndie = !chainResult.isChain;

    if (filters.independentOnly && !isIndie) continue;

    const placeBase = {
      placeId: `mock-${i}`,
      name,
      types: [type],
      rating: parseFloat(rating.toFixed(1)),
      userRatingCount: Math.floor(Math.random() * 800),
      priceLevel: PriceLevel.MODERATE,
      address: '123 Mock St, Charlotte NC',
      location: { lat: baseLat + (Math.random() - 0.5) * 0.06, lng: baseLng + (Math.random() - 0.5) * 0.06 },
      operationalStatus: OperationalStatus.OPERATIONAL,
      website: 'http://mock-restaurant.com'
    };

    const tech: TechStack = {
      websitePlatform: 'WordPress',
      onlineOrdering: Math.random() > 0.6 ? ['ChowNow'] : [],
      reservations: Math.random() > 0.7 ? ['OpenTable'] : [],
      delivery: Math.random() > 0.2 ? ['DoorDash', 'UberEats'] : [],
      loyaltyOrCRM: [],
      pos: Math.random() > 0.5 ? ['Toast'] : [],
      otherScripts: ['Google Analytics 4'],
      confidence: 50,
      hasFirstPartyOrdering: Math.random() > 0.8
    };

    const fit = calculateFitScore(placeBase, tech, isIndie);

    if (filters.requireNoFirstPartyOrdering && tech.hasFirstPartyOrdering) continue;
    if (filters.requireThirdPartyDelivery && tech.delivery.length === 0) continue;

    places.push({ ...placeBase, techStack: tech, fit });
  }

  const count = Math.max(baseCount, places.length);
  const sortedPlaces = places.sort((a, b) => b.fit.score - a.fit.score);
  const highFitCount = sortedPlaces.filter(p => p.fit.score >= 80).length;
  const avgScore = Math.floor(sortedPlaces.reduce((acc, p) => acc + p.fit.score, 0) / (sortedPlaces.length || 1));

  return {
    insightType,
    totalCount: count,
    breakdownByType: breakdown,
    places: insightType === InsightType.PLACES ? sortedPlaces : undefined,
    fitStats: { highFitCount, avgScore: avgScore || 65 }
  };
};

const mergeAggregateResponses = (r1: AggregateResponse, r2: AggregateResponse, insightType: InsightType): AggregateResponse => {
  const places1 = r1.places || [];
  const places2 = r2.places || [];

  // Deduplicate by placeId just in case of overlap at boundary
  const allPlaces = [...places1, ...places2];
  const uniquePlaces = Array.from(new Map(allPlaces.map(p => [p.placeId, p])).values())
    .sort((a, b) => b.fit.score - a.fit.score); // Use valid fit score sort

  const totalCount = (r1.totalCount || 0) + (r2.totalCount || 0);

  // Merge breakdown (sum values by key)
  const breakdown: Record<string, number> = { ...r1.breakdownByType };
  Object.entries(r2.breakdownByType || {}).forEach(([k, v]) => {
    breakdown[k] = (breakdown[k] || 0) + v;
  });

  // Recalculate stats
  const highFitCount = uniquePlaces.filter(p => p.fit.score >= 80).length;
  const avgScore = Math.floor(uniquePlaces.reduce((acc, p) => acc + p.fit.score, 0) / (uniquePlaces.length || 1));

  return {
    insightType,
    totalCount,
    breakdownByType: breakdown,
    places: uniquePlaces.slice(0, AGENT_CONFIG.maxPlacesForScan), // Respect global limit
    fitStats: { highFitCount, avgScore }
  };
};

// Main function now just delegates to the recursive helper
export const searchPlacesAggregate = async (
  area: SearchArea,
  filters: SearchFilters,
  insightType: InsightType
): Promise<AggregateResponse> => {

  if (!GOOGLE_MAPS_API_KEY) {
    console.warn("No GOOGLE_MAPS_API_KEY found. Agent switching to Simulation Mode.");
    return runMockSearch(area, filters, insightType);
  }

  try {
    const center = await getCoordinates(area.zipCode);
    return await executeAreaInsightsSearch(area, filters, insightType, center);

  } catch (err: any) {
    console.error("API Call Failed - Switching to Simulation Mode", err);
    return runMockSearch(area, filters, insightType);
  }
};

// Recursive helper function
const executeAreaInsightsSearch = async (
  area: SearchArea,
  filters: SearchFilters,
  insightType: InsightType,
  center: { lat: number, lng: number },
  recurseDepth: number = 0
): Promise<AggregateResponse> => {

  const body: any = {
    insights: [insightType],
    filter: {
      locationFilter: {
        circle: {
          latLng: {
            latitude: center.lat,
            longitude: center.lng
          },
          radius: area.radiusKm * 1000
        }
      },
      typeFilter: {
        includedTypes: filters.includedTypes.length > 0 ? filters.includedTypes : ['restaurant'],
        excludedPrimaryTypes: AGENT_CONFIG.excludedPrimaryTypes
      },
      ratingFilter: { minRating: filters.minRating, maxRating: filters.maxRating }
    }
  };

  const response = await fetch(`${PROXY_BASE}/places-compute-insights`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-FieldMask': 'count,placeInsights'
    },
    body: JSON.stringify(body)
  });

  // Handle 429 RESOURCE_EXHAUSTED specifically
  if (response.status === 429) {
    const text = await response.text();
    if ((text.includes('RESOURCE_EXHAUSTED') || text.includes('100 places')) && recurseDepth < 3) {
      console.log(`⚠️ Result count > 100, splitting rating range (${filters.minRating}-${filters.maxRating}) to fetch all results... (Depth: ${recurseDepth})`);

      const midRating = (filters.minRating + filters.maxRating) / 2;

      // Ensure minimal range sanity
      if (filters.maxRating - filters.minRating < 0.1) {
        console.warn("Range too small to split, returning what we can");
        // Fallthrough to error throw below
      } else {
        const lowerFilters = { ...filters, maxRating: midRating };
        const upperFilters = { ...filters, minRating: midRating };

        const [lowerRes, upperRes] = await Promise.all([
          executeAreaInsightsSearch(area, lowerFilters, insightType, center, recurseDepth + 1)
            .catch(e => ({ places: [], totalCount: 0, breakdownByType: {}, fitStats: { highFitCount: 0, avgScore: 0 } } as AggregateResponse)),
          executeAreaInsightsSearch(area, upperFilters, insightType, center, recurseDepth + 1)
            .catch(e => ({ places: [], totalCount: 0, breakdownByType: {}, fitStats: { highFitCount: 0, avgScore: 0 } } as AggregateResponse))
        ]);

        return mergeAggregateResponses(lowerRes, upperRes, insightType);
      }
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    const err: any = new Error(`Places API Error: ${response.status} ${errorText}`);
    err.status = response.status;
    err.message = errorText;
    throw err;
  }

  const data = await response.json() as any;

  const count = parseInt(data.count) || 0;
  const placeInsights = data.placeInsights || data.place_insights || [];

  const breakdown: Record<string, number> = {};
  if (count > 0) {
    const types = filters.includedTypes.length > 0 ? filters.includedTypes : ['restaurant'];
    types.forEach((t: string) => breakdown[t] = Math.floor(count / types.length));
  }

  if (insightType === InsightType.COUNT) {
    return {
      insightType,
      totalCount: count,
      breakdownByType: breakdown,
      fitStats: { highFitCount: Math.floor(count * 0.25), avgScore: 0 }
    };
  }

  let resourceNames = placeInsights.map((p: any) => p.place || p.name || p.id).filter(Boolean);

  // Process details only if we have names
  if (resourceNames.length === 0) {
    return { insightType, totalCount: count, breakdownByType: breakdown, places: [], fitStats: { highFitCount: 0, avgScore: 0 } };
  }

  if (resourceNames.length > AGENT_CONFIG.maxPlacesForScan) {
    resourceNames = resourceNames.slice(0, AGENT_CONFIG.maxPlacesForScan);
  }

  console.log(`🔍 Fetching details for ${resourceNames.length} restaurants (Rating: ${filters.minRating.toFixed(1)}-${filters.maxRating.toFixed(1)})...`);

  const detailPromises = resourceNames.map((name: string) => fetchPlaceDetails(name.split('/')[1]));
  const details = await Promise.all(detailPromises);
  const validDetails = details.filter(p => p !== null) as Omit<PlaceResult, 'techStack' | 'fit'>[];

  const enrichedPlaces = await Promise.all(validDetails.map(async (p) => {
    const chainResult = detectChain(p.name, p.website);
    const isIndie = !chainResult.isChain;

    let tech: TechStack;
    if (p.website) {
      try {
        tech = await detectTechStack(p.website);
      } catch (error) {
        tech = {
          websitePlatform: 'Unknown',
          onlineOrdering: [],
          reservations: [],
          delivery: [],
          loyaltyOrCRM: [],
          pos: [],
          otherScripts: [],
          confidence: 10,
          hasFirstPartyOrdering: false
        };
      }
    } else {
      tech = {
        websitePlatform: 'Unknown',
        onlineOrdering: [],
        reservations: [],
        delivery: [],
        loyaltyOrCRM: [],
        pos: [],
        otherScripts: [],
        confidence: 10,
        hasFirstPartyOrdering: false
      };
    }

    const fit = calculateFitScore(p, tech, isIndie);
    return { ...p, techStack: tech, fit };
  }));

  const places = enrichedPlaces.filter(p => {
    if (filters.independentOnly && !p.fit.isIndependent) return false;
    if (p.fit.score === 0) return false;
    if (filters.requireNoFirstPartyOrdering && p.techStack.hasFirstPartyOrdering) return false;
    if (filters.requireThirdPartyDelivery && p.techStack.delivery.length === 0) return false;
    return true;
  }).sort((a, b) => b.fit.score - a.fit.score);

  const highFitCount = places.filter(p => p.fit.score >= 80).length;
  const avgScore = Math.floor(places.reduce((acc, p) => acc + p.fit.score, 0) / (places.length || 1));

  return {
    insightType,
    totalCount: count,
    breakdownByType: breakdown,
    places: places,
    fitStats: { highFitCount, avgScore }
  };
};

const escapeField = (value: any): string => {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

export const exportToCSV = (places: PlaceResult[]) => {
  const headers = [
    'Name',
    'Fit Score',
    'Fit Reason',
    'Independent',
    'Type',
    'Rating',
    'Reviews',
    'Price',
    'Address',
    'Website',
    'Website Platform',
    'POS',
    'Ordering (1P)',
    'Has 1P Ordering',
    'Delivery (3P)',
    'Reservations',
    'Loyalty/CRM',
    'Tech Confidence'
  ];

  const rows = places.map(p => [
    escapeField(p.name),
    escapeField(p.fit.score),
    escapeField(p.fit.reason),
    p.fit.isIndependent ? 'Yes' : 'No',
    escapeField(p.types[0]),
    escapeField(p.rating),
    escapeField(p.userRatingCount),
    escapeField(p.priceLevel),
    escapeField(p.address),
    escapeField(p.website),
    escapeField(p.techStack.websitePlatform),
    escapeField(p.techStack.pos.join('; ')),
    escapeField(p.techStack.onlineOrdering.join('; ')),
    p.techStack.hasFirstPartyOrdering ? 'Yes' : 'No',
    escapeField(p.techStack.delivery.join('; ')),
    escapeField(p.techStack.reservations.join('; ')),
    escapeField(p.techStack.loyaltyOrCRM.join('; ')),
    escapeField(p.techStack.confidence)
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ownerscout-leads-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
