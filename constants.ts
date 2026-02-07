import { PriceLevel, PlaceCategory, OperationalStatus } from './types';

export const PLACE_CATEGORIES: PlaceCategory[] = [
  { id: 'restaurant', label: 'Restaurant', icon: 'Utensils' },
  { id: 'cafe', label: 'Cafe', icon: 'Coffee' },
  { id: 'bar', label: 'Bar', icon: 'Martini' },
  { id: 'bakery', label: 'Bakery', icon: 'Croissant' },
  { id: 'meal_delivery', label: 'Meal Delivery', icon: 'Truck' },
  { id: 'meal_takeaway', label: 'Takeaway', icon: 'ShoppingBag' },
];

export const PRICE_LEVEL_LABELS: Record<PriceLevel, string> = {
  [PriceLevel.FREE]: 'Free',
  [PriceLevel.INEXPENSIVE]: '$',
  [PriceLevel.MODERATE]: '$$',
  [PriceLevel.EXPENSIVE]: '$$$',
  [PriceLevel.VERY_EXPENSIVE]: '$$$$'
};

export const STATUS_LABELS: Record<OperationalStatus, string> = {
  [OperationalStatus.OPERATIONAL]: 'Open Now / Operational',
  [OperationalStatus.CLOSED_TEMPORARILY]: 'Temporarily Closed',
  [OperationalStatus.CLOSED_PERMANENTLY]: 'Permanently Closed'
};

export const MOCK_ZIP_COORDS: Record<string, { lat: number, lng: number }> = {
  '10001': { lat: 40.7501, lng: -73.9996 }, // NYC
  '90210': { lat: 34.0900, lng: -118.4098 }, // Beverly Hills
  '28202': { lat: 35.2271, lng: -80.8431 }, // Charlotte
  '94103': { lat: 37.7725, lng: -122.4147 }, // SF
};

// Mock Data Source Constants
export const TECH_BRANDS = {
  POS: ['Toast', 'Square', 'Clover', 'Lightspeed', 'Aloha', 'Unknown'],
  WEBSITE: ['WordPress', 'Wix', 'Squarespace', 'GoDaddy', 'Custom HTML', 'BentoBox'],
  ORDERING: ['ChowNow', 'Slice', 'Toast Online', 'Owner.com', 'Grubhub Direct'],
  DELIVERY: ['UberEats', 'DoorDash', 'Grubhub', 'Postmates'],
  RESERVATIONS: ['OpenTable', 'Resy', 'SevenRooms', 'Yelp Guest Manager']
};
