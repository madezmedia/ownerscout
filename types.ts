export enum InsightType {
  COUNT = 'INSIGHT_COUNT',
  PLACES = 'INSIGHT_PLACES'
}

export enum PriceLevel {
  FREE = 'PRICE_LEVEL_FREE',
  INEXPENSIVE = 'PRICE_LEVEL_INEXPENSIVE',
  MODERATE = 'PRICE_LEVEL_MODERATE',
  EXPENSIVE = 'PRICE_LEVEL_EXPENSIVE',
  VERY_EXPENSIVE = 'PRICE_LEVEL_VERY_EXPENSIVE'
}

export enum OperationalStatus {
  OPERATIONAL = 'OPERATIONAL',
  CLOSED_TEMPORARILY = 'CLOSED_TEMPORARILY',
  CLOSED_PERMANENTLY = 'CLOSED_PERMANENTLY'
}

export interface PlaceCategory {
  id: string;
  label: string;
  icon: string;
}

export interface GeoLocation {
  lat: number;
  lng: number;
}

export interface SearchArea {
  zipCode: string;
  radiusKm: number;
  center?: GeoLocation;
}

export interface TechStack {
  websitePlatform: string; // e.g., 'WordPress', 'Wix', 'Squarespace', 'Custom'
  onlineOrdering: string[]; // e.g., ['Owner.com', 'ChowNow', 'Toast']
  reservations: string[]; // e.g., ['OpenTable', 'Resy']
  delivery: string[]; // e.g., ['UberEats', 'DoorDash']
  loyaltyOrCRM: string[]; // e.g., ['Thanx', 'Punchh']
  pos: string[]; // e.g., ['Toast', 'Square', 'Clover']
  otherScripts: string[]; // e.g., ['Google Analytics 4', 'Meta Pixel']
  confidence: number; // 0-100
  hasFirstPartyOrdering: boolean; // True if ordering is on their own domain
}

export interface FitAnalysis {
  score: number; // 0-100
  reason: string;
  isIndependent: boolean;
}

export interface SonicBrandAnalysis {
  hasAudio: boolean;
  hasJingle: boolean;
  hasPodcast: boolean;
  socialMediaAudio: boolean;
  youTubeChannel: boolean;
  tiktokSound: boolean;
  sonicBrandScore: number; // 0-100
  opportunity: string;
  detectedElements: string[];
}

export interface SearchFilters {
  includedTypes: string[];
  minRating: number;
  maxRating: number; // Added max rating to avoid "too perfect"
  priceLevels: PriceLevel[];
  status: OperationalStatus;
  // Owner.com specific filters
  independentOnly: boolean;
  requireNoFirstPartyOrdering: boolean;
  requireThirdPartyDelivery: boolean;
}

export interface PlaceResult {
  placeId: string;
  name: string;
  types: string[];
  rating: number;
  userRatingCount: number;
  priceLevel?: PriceLevel;
  address: string;
  location: GeoLocation;
  website?: string;
  phone?: string;
  operationalStatus: OperationalStatus;
  // Enrichment fields
  techStack: TechStack;
  fit: FitAnalysis;
  sonicBrand?: SonicBrandAnalysis; // NEW: Sonic brand analysis
}

export interface AggregateResponse {
  insightType: InsightType;
  totalCount: number;
  breakdownByType: Record<string, number>;
  places?: PlaceResult[];
  fitStats?: {
    highFitCount: number; // Score > 80
    avgScore: number;
  };
}