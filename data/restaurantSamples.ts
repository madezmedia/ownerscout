/**
 * SonicBrand Samples Data
 * Pre-generated samples for 5 Charlotte restaurants
 */

export interface RestaurantSample {
  id: string;
  name: string;
  tagline: string;
  usp: string;
  location: string;
  rating: number;
  priceLevel: string;
  sonicBrandScore: number;
  jingleScript: string;
  audioUrl: string; // TODO: Replace with real audio URLs
  pricing: number;
  ownerComFit: number;
}

export const restaurantSamples: RestaurantSample[] = [
  {
    id: 'amelies',
    name: "Amélie's French Bakery",
    tagline: "Taste the romance of Paris in Charlotte",
    usp: "Authentic French pastries crafted with love since 1998",
    location: "28202 (Uptown Charlotte)",
    rating: 4.7,
    priceLevel: "$$",
    sonicBrandScore: 15,
    jingleScript: `[SOUND: Accordion music with Parisian cafe vibe - 3 second intro]

"Taste the romance of Paris in Charlotte"
"Authentic French pastries, crafted with love"
"Amélie's French Bakery"

[SOUND: Elegant 3-note musical flourish - la-la-la ♪]`,
    audioUrl: "/samples/amelies-jingle.mp3", // TODO: Replace with real audio
    pricing: 27,
    ownerComFit: 92
  },
  {
    id: 'cuzzos',
    name: "Cuzzo's Cuisine II",
    tagline: "Real Italian. Real Flavor. Cuzzo's.",
    usp: "Family recipes passed down for three generations",
    location: "28206 (North Charlotte)",
    rating: 4.5,
    priceLevel: "$$",
    sonicBrandScore: 20,
    jingleScript: `[SOUND: Upbeat Italian restaurant vibe with mandolin - 3 second intro]

"Real Italian. Real Flavor. Cuzzo's."
"Family recipes passed down for three generations"
"Cuzzo's Cuisine II"

[SOUND: Enthusiastic 4-note tag - DUN-dun-dun-DUN! ♪]`,
    audioUrl: "/samples/cuzzos-jingle.mp3",
    pricing: 27,
    ownerComFit: 88
  },
  {
    id: 'midwood',
    name: "Midwood Smokehouse",
    tagline: "Where Charlotte goes for real BBQ",
    usp: "12-hour smoked meats, homemade sauces, and Southern hospitality",
    location: "28203 (Midwood Charlotte)",
    rating: 4.6,
    priceLevel: "$$",
    sonicBrandScore: 10,
    jingleScript: `[SOUND: Bluesy BBQ joint music with guitar riff - 3 second intro]

"Where Charlotte goes for real BBQ"
"12-hour smoked meats, homemade sauces"
"Midwood Smokehouse"

[SOUND: Satisfying 3-note bass riff - BAM-bam-bum ♪]`,
    audioUrl: "/samples/midwood-jingle.mp3",
    pricing: 27,
    ownerComFit: 95
  },
  {
    id: 'copper',
    name: "Copper Thai",
    tagline: "Thai food that tells a story",
    usp: "Authentic Thai recipes from family's Chiang Mai kitchen",
    location: "28203 (Plaza Midwood)",
    rating: 4.8,
    priceLevel: "$$",
    sonicBrandScore: 25,
    jingleScript: `[SOUND: Traditional Thai music with modern beat - 3 second intro]

"Thai food that tells a story"
"Authentic recipes from Chiang Mai"
"Copper Thai"

[SOUND: Beautiful 3-note Thai melody - din-din-don ♪]`,
    audioUrl: "/samples/copper-jingle.mp3",
    pricing: 47,
    ownerComFit: 85
  },
  {
    id: 'goodyear',
    name: "The Goodyear House",
    tagline: "Where friends become family over great food",
    usp: "Craft burgers, local beer, and community since 2014",
    location: "28204 (West Charlotte)",
    rating: 4.4,
    priceLevel: "$$",
    sonicBrandScore: 18,
    jingleScript: `[SOUND: Upbeat pub rock with energy - 3 second intro]

"Where friends become family over great food"
"Craft burgers, local beer, community"
"The Goodyear House"

[SOUND: Warm, communal 3-note rise - di-di-DUM ♪]`,
    audioUrl: "/samples/goodyear-jingle.mp3",
    pricing: 27,
    ownerComFit: 90
  }
];
