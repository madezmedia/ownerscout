/**
 * Tech Stack Detection Service
 * Crawls restaurant websites to detect platforms, ordering systems, POS, delivery, and more
 */

export interface TechDetectionResult {
  websitePlatform: string;
  onlineOrdering: string[];
  reservations: string[];
  delivery: string[];
  loyaltyOrCRM: string[];
  pos: string[];
  otherScripts: string[];
  confidence: number; // 0-100
  hasFirstPartyOrdering: boolean;
}

interface DetectionPattern {
  name: string;
  patterns: {
    domain?: string[];
    scriptSrc?: string[];
    htmlContent?: string[];
    metaTags?: string[];
    linkTags?: string[];
  };
}

// Detection patterns for various platforms
const WEBSITE_PLATFORMS: DetectionPattern[] = [
  {
    name: 'WordPress',
    patterns: {
      scriptSrc: ['/wp-content/', '/wp-includes/'],
      htmlContent: ['wp-content', 'WordPress'],
      metaTags: ['WordPress']
    }
  },
  {
    name: 'Wix',
    patterns: {
      domain: ['.wixsite.com', '.wix.com'],
      scriptSrc: ['static.parastorage.com', 'wix.com'],
      htmlContent: ['wix.com', 'X-Wix-']
    }
  },
  {
    name: 'Squarespace',
    patterns: {
      domain: ['.squarespace.com'],
      scriptSrc: ['squarespace.com', 'sqsp.com'],
      htmlContent: ['Squarespace']
    }
  },
  {
    name: 'BentoBox',
    patterns: {
      domain: ['.bentoboxapp.com', '.getbento.com'],
      scriptSrc: ['bentobox', 'getbento'],
      htmlContent: ['BentoBox']
    }
  },
  {
    name: 'Shopify',
    patterns: {
      domain: ['.myshopify.com'],
      scriptSrc: ['cdn.shopify.com'],
      htmlContent: ['Shopify']
    }
  },
  {
    name: 'GoDaddy',
    patterns: {
      scriptSrc: ['godaddy.com', 'secureserver.net'],
      htmlContent: ['GoDaddy']
    }
  }
];

const ORDERING_SYSTEMS: DetectionPattern[] = [
  {
    name: 'Owner.com',
    patterns: {
      domain: ['.owner.com', '.tryowner.com'],
      scriptSrc: ['owner.com'],
      htmlContent: ['owner.com', 'Owner.com']
    }
  },
  {
    name: 'ChowNow',
    patterns: {
      domain: ['.chownow.com'],
      scriptSrc: ['chownow.com'],
      htmlContent: ['ChowNow', 'chownow']
    }
  },
  {
    name: 'Toast',
    patterns: {
      scriptSrc: ['toasttab.com', 'toast.com'],
      htmlContent: ['Toast Online Ordering', 'toasttab']
    }
  },
  {
    name: 'Olo',
    patterns: {
      scriptSrc: ['olo.com'],
      htmlContent: ['olo.com', 'Olo']
    }
  },
  {
    name: 'Slice',
    patterns: {
      scriptSrc: ['slicelife.com'],
      htmlContent: ['Slice', 'slicelife']
    }
  },
  {
    name: 'Square Online',
    patterns: {
      scriptSrc: ['square.site', 'squareup.com'],
      htmlContent: ['Square', 'squareup']
    }
  },
  {
    name: 'Grubhub Direct',
    patterns: {
      scriptSrc: ['grubhub.com/direct'],
      htmlContent: ['Grubhub Direct']
    }
  }
];

const RESERVATION_SYSTEMS: DetectionPattern[] = [
  {
    name: 'OpenTable',
    patterns: {
      scriptSrc: ['opentable.com'],
      htmlContent: ['OpenTable', 'opentable']
    }
  },
  {
    name: 'Resy',
    patterns: {
      scriptSrc: ['resy.com'],
      htmlContent: ['Resy', 'resy.com']
    }
  },
  {
    name: 'SevenRooms',
    patterns: {
      scriptSrc: ['sevenrooms.com'],
      htmlContent: ['SevenRooms', 'sevenrooms']
    }
  },
  {
    name: 'Yelp Reservations',
    patterns: {
      scriptSrc: ['yelp.com/reservations'],
      htmlContent: ['Yelp Reservations']
    }
  },
  {
    name: 'Tock',
    patterns: {
      scriptSrc: ['exploretock.com'],
      htmlContent: ['Tock', 'exploretock']
    }
  }
];

const DELIVERY_PLATFORMS: DetectionPattern[] = [
  {
    name: 'DoorDash',
    patterns: {
      scriptSrc: ['doordash.com'],
      htmlContent: ['DoorDash', 'doordash']
    }
  },
  {
    name: 'UberEats',
    patterns: {
      scriptSrc: ['ubereats.com'],
      htmlContent: ['Uber Eats', 'UberEats', 'ubereats']
    }
  },
  {
    name: 'Grubhub',
    patterns: {
      scriptSrc: ['grubhub.com'],
      htmlContent: ['Grubhub', 'grubhub']
    }
  },
  {
    name: 'Postmates',
    patterns: {
      scriptSrc: ['postmates.com'],
      htmlContent: ['Postmates', 'postmates']
    }
  }
];

const POS_SYSTEMS: DetectionPattern[] = [
  {
    name: 'Toast',
    patterns: {
      scriptSrc: ['toasttab.com'],
      htmlContent: ['Toast POS', 'toasttab']
    }
  },
  {
    name: 'Square',
    patterns: {
      scriptSrc: ['squareup.com', 'square.site'],
      htmlContent: ['Square', 'squareup']
    }
  },
  {
    name: 'Clover',
    patterns: {
      scriptSrc: ['clover.com'],
      htmlContent: ['Clover', 'clover.com']
    }
  },
  {
    name: 'Lightspeed',
    patterns: {
      scriptSrc: ['lightspeedhq.com'],
      htmlContent: ['Lightspeed']
    }
  },
  {
    name: 'Aloha',
    patterns: {
      htmlContent: ['Aloha POS', 'NCR Aloha']
    }
  }
];

const LOYALTY_CRM: DetectionPattern[] = [
  {
    name: 'Thanx',
    patterns: {
      scriptSrc: ['thanx.com'],
      htmlContent: ['Thanx', 'thanx.com']
    }
  },
  {
    name: 'Punchh',
    patterns: {
      scriptSrc: ['punchh.com'],
      htmlContent: ['Punchh']
    }
  },
  {
    name: 'Paytronix',
    patterns: {
      scriptSrc: ['paytronix.com'],
      htmlContent: ['Paytronix']
    }
  }
];

const OTHER_SCRIPTS: DetectionPattern[] = [
  {
    name: 'Google Analytics 4',
    patterns: {
      scriptSrc: ['googletagmanager.com/gtag', 'google-analytics.com/analytics.js']
    }
  },
  {
    name: 'Meta Pixel',
    patterns: {
      scriptSrc: ['connect.facebook.net']
    }
  },
  {
    name: 'Hotjar',
    patterns: {
      scriptSrc: ['hotjar.com']
    }
  }
];

/**
 * Crawl a website and extract HTML content
 */
async function crawlWebsite(url: string): Promise<string | null> {
  try {
    // Normalize URL
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    // Detect if we're on Vercel or localhost
    const isProduction = import.meta.env.PROD || window.location.hostname !== 'localhost';
    const PROXY_BASE = isProduction ? '/api' : 'http://localhost:3001/api';
    const proxyUrl = `${PROXY_BASE}/proxy?url=${encodeURIComponent(url)}`;

    const response = await fetch(proxyUrl, {
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (!response.ok) {
      console.warn(`Failed to crawl ${url} via proxy: ${response.status}`);
      return null;
    }

    const html = await response.text();
    return html;
  } catch (error) {
    console.warn(`Error crawling ${url}:`, error);
    return null;
  }
}

/**
 * Check if any pattern matches the content
 */
function matchesPattern(content: string, url: string, pattern: DetectionPattern): boolean {
  const lowerContent = content.toLowerCase();
  const lowerUrl = url.toLowerCase();

  // Check domain patterns
  if (pattern.patterns.domain) {
    for (const domain of pattern.patterns.domain) {
      if (lowerUrl.includes(domain.toLowerCase())) {
        return true;
      }
    }
  }

  // Check script src patterns
  if (pattern.patterns.scriptSrc) {
    for (const scriptPattern of pattern.patterns.scriptSrc) {
      if (lowerContent.includes(scriptPattern.toLowerCase())) {
        return true;
      }
    }
  }

  // Check HTML content patterns
  if (pattern.patterns.htmlContent) {
    for (const htmlPattern of pattern.patterns.htmlContent) {
      if (lowerContent.includes(htmlPattern.toLowerCase())) {
        return true;
      }
    }
  }

  // Check meta tags
  if (pattern.patterns.metaTags) {
    for (const metaPattern of pattern.patterns.metaTags) {
      const metaRegex = new RegExp(`<meta[^>]*${metaPattern}[^>]*>`, 'i');
      if (metaRegex.test(content)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Detect platforms from a list of patterns
 */
function detectFromPatterns(html: string, url: string, patterns: DetectionPattern[]): string[] {
  const detected: string[] = [];

  for (const pattern of patterns) {
    if (matchesPattern(html, url, pattern)) {
      detected.push(pattern.name);
    }
  }

  return detected;
}

/**
 * Determine if the restaurant has first-party ordering
 * (ordering system on their own domain, not a third-party widget)
 */
function hasFirstPartyOrdering(html: string, url: string, orderingSystems: string[]): boolean {
  // If no ordering systems detected, no first-party ordering
  if (orderingSystems.length === 0) return false;

  // Check if ordering is integrated into their own domain
  const domain = new URL(url.startsWith('http') ? url : 'https://' + url).hostname;

  // Look for common first-party ordering indicators
  const firstPartyIndicators = [
    'order online',
    'order now',
    'place order',
    'add to cart',
    'checkout',
    'menu',
    '/order',
    '/menu'
  ];

  const lowerHtml = html.toLowerCase();
  const hasOrderingUI = firstPartyIndicators.some(indicator =>
    lowerHtml.includes(indicator)
  );

  // If they have ordering systems AND ordering UI on their domain, it's likely first-party
  // Exception: if it's clearly a third-party widget (iframe, external domain)
  const hasThirdPartyWidget = lowerHtml.includes('<iframe') && (
    lowerHtml.includes('chownow') ||
    lowerHtml.includes('doordash') ||
    lowerHtml.includes('ubereats') ||
    lowerHtml.includes('grubhub')
  );

  return hasOrderingUI && !hasThirdPartyWidget;
}

/**
 * Calculate confidence score based on number of detections
 */
function calculateConfidence(detections: {
  platform: string[];
  ordering: string[];
  reservations: string[];
  delivery: string[];
  pos: string[];
  loyalty: string[];
  other: string[];
}): number {
  const totalDetections =
    (detections.platform.length > 0 ? 1 : 0) +
    detections.ordering.length +
    detections.reservations.length +
    detections.delivery.length +
    detections.pos.length +
    detections.loyalty.length;

  // Base confidence on number of successful detections
  // 0 detections = 20% (we at least tried)
  // 1-2 detections = 40-60%
  // 3+ detections = 70-90%

  if (totalDetections === 0) return 20;
  if (totalDetections === 1) return 40;
  if (totalDetections === 2) return 60;
  if (totalDetections === 3) return 75;
  return Math.min(90, 75 + (totalDetections - 3) * 5);
}

/**
 * Main tech detection function
 */
export async function detectTechStack(website: string): Promise<TechDetectionResult> {
  // Crawl the website
  const html = await crawlWebsite(website);

  if (!html) {
    // Return unknown/low confidence result
    return {
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

  // Detect all platforms
  const platformDetections = detectFromPatterns(html, website, WEBSITE_PLATFORMS);
  const orderingDetections = detectFromPatterns(html, website, ORDERING_SYSTEMS);
  const reservationDetections = detectFromPatterns(html, website, RESERVATION_SYSTEMS);
  const deliveryDetections = detectFromPatterns(html, website, DELIVERY_PLATFORMS);
  const posDetections = detectFromPatterns(html, website, POS_SYSTEMS);
  const loyaltyDetections = detectFromPatterns(html, website, LOYALTY_CRM);
  const otherDetections = detectFromPatterns(html, website, OTHER_SCRIPTS);

  // Determine website platform (take first match, or "Custom" if none)
  const websitePlatform = platformDetections.length > 0
    ? platformDetections[0]
    : 'Custom';

  // Check for first-party ordering
  const hasFirstParty = hasFirstPartyOrdering(html, website, orderingDetections);

  // Calculate confidence
  const confidence = calculateConfidence({
    platform: platformDetections,
    ordering: orderingDetections,
    reservations: reservationDetections,
    delivery: deliveryDetections,
    pos: posDetections,
    loyalty: loyaltyDetections,
    other: otherDetections
  });

  return {
    websitePlatform,
    onlineOrdering: orderingDetections,
    reservations: reservationDetections,
    delivery: deliveryDetections,
    loyaltyOrCRM: loyaltyDetections,
    pos: posDetections,
    otherScripts: otherDetections,
    confidence,
    hasFirstPartyOrdering: hasFirstParty
  };
}
