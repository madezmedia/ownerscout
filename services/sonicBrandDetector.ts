/**
 * Sonic Brand Detection Service
 * Detects audio branding presence for restaurants
 */

import { getCache, cacheKey } from './cacheService';

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

/**
 * Analyze a restaurant's sonic brand presence
 */
export async function detectSonicBrand(
  website: string,
  name: string
): Promise<SonicBrandAnalysis> {

  // Extract domain for cache key
  const domain = extractDomain(website);
  const cache = getCache();
  const cacheKeyString = cacheKey('sonic', domain);

  // Try cache first
  const cached = await cache.get<SonicBrandAnalysis>(cacheKeyString);
  if (cached) {
    console.log(`✅ Cache hit for sonic brand: ${domain}`);
    return cached;
  }

  const detectedElements: string[] = [];
  let score = 0;

  // Normalize URL
  if (!website.startsWith('http://') && !website.startsWith('https://')) {
    website = 'https://' + website;
  }

  try {
    // Crawl website for audio elements
    const hasWebsiteAudio = await checkWebsiteForAudio(website);
    if (hasWebsiteAudio) {
      detectedElements.push('Website audio');
      score += 15;
    }

    // Check for common audio branding indicators
    const hasJingleIndicators = await checkJingleIndicators(website);
    if (hasJingleIndicators) {
      detectedElements.push('Jingle mentions');
      score += 20;
    }

    // Check social media presence (simulated for now)
    const hasSocialAudio = await checkSocialMediaAudio(name);
    if (hasSocialAudio) {
      detectedElements.push('Social audio content');
      score += 15;
    }

    // Check YouTube presence (simulated)
    const hasYouTube = await checkYouTubePresence(name);
    if (hasYouTube) {
      detectedElements.push('YouTube channel');
      score += 10;
    }

    // Check podcast presence (simulated)
    const hasPodcast = await checkPodcastPresence(name);
    if (hasPodcast) {
      detectedElements.push('Podcast appearances');
      score += 25;
    }

    // Check TikTok sounds (simulated)
    const hasTikTok = await checkTikTokPresence(name);
    if (hasTikTok) {
      detectedElements.push('TikTok sounds');
      score += 15;
    }

  } catch (error) {
    console.warn('Sonic brand detection error:', error);
  }

  // Calculate opportunity message
  const opportunity = calculateOpportunity(score, detectedElements);

  const result = {
    hasAudio: score > 0,
    hasJingle: detectedElements.some(e => e.includes('Jingle')),
    hasPodcast: detectedElements.some(e => e.includes('Podcast')),
    socialMediaAudio: detectedElements.some(e => e.includes('Social')),
    youTubeChannel: detectedElements.some(e => e.includes('YouTube')),
    tiktokSound: detectedElements.some(e => e.includes('TikTok')),
    sonicBrandScore: score,
    opportunity: opportunity,
    detectedElements: detectedElements
  };

  // Cache for 7 days
  await cache.set(cacheKeyString, result, 7 * 24 * 60 * 60);

  return result;
}

/**
 * Extract domain from URL for cache key
 */
function extractDomain(url: string): string {
  try {
    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return url.toLowerCase().replace(/[^a-z0-9.-]/g, '');
  }
}

/**
 * Check website for audio elements
 */
async function checkWebsiteForAudio(website: string): Promise<boolean> {
  try {
    // In production, this would crawl the actual website
    // For now, simulate based on common patterns
    return false; // Most restaurants don't have website audio
  } catch {
    return false;
  }
}

/**
 * Check for jingle/audio branding mentions
 */
async function checkJingleIndicators(website: string): Promise<boolean> {
  try {
    // Look for keywords like "jingle", "audio", "sound branding"
    const keywords = ['jingle', 'audio brand', 'sonic branding', 'sound logo', 'audio identity'];
    // In production, crawl and check content
    return false;
  } catch {
    return false;
  }
}

/**
 * Check social media for audio content
 */
async function checkSocialMediaAudio(name: string): Promise<boolean> {
  // Check Instagram, TikTok, Facebook for audio posts
  // In production, use APIs or web scraping
  return false;
}

/**
 * Check YouTube channel presence
 */
async function checkYouTubePresence(name: string): Promise<boolean> {
  // Search YouTube for restaurant name
  // In production, use YouTube API
  return false;
}

/**
 * Check podcast appearances
 */
async function checkPodcastPresence(name: string): Promise<boolean> {
  // Search podcasts for restaurant name
  // In production, use podcast search APIs
  return false;
}

/**
 * Check TikTok sounds using restaurant name
 */
async function checkTikTokPresence(name: string): Promise<boolean> {
  // Search TikTok for restaurant sounds
  // In production, use TikTok API
  return false;
}

/**
 * Calculate opportunity message based on score
 */
function calculateOpportunity(score: number, elements: string[]): string {
  if (score === 0) {
    return "Huge opportunity! No audio branding yet. Perfect for AI sonic brand.";
  } else if (score <= 20) {
    return "Missing out on audio marketing. Great potential for sonic branding.";
  } else if (score <= 40) {
    return "Good foundation. Let's amplify your audio presence.";
  } else if (score <= 60) {
    return "Strong audio presence. Let's optimize and expand.";
  } else if (score <= 80) {
    return "Excellent sonic brand! Minor improvements possible.";
  } else {
    return "Already have a strong sonic brand! Focus on optimization.";
  }
}
