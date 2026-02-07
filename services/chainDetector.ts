/**
 * Chain Detection Service
 * Identifies whether a restaurant is part of a chain or independent
 */

export interface ChainDetectionResult {
    isChain: boolean;
    chainName?: string;
    confidence: number; // 0-100
    reason: string;
}

// Comprehensive chain database
const NATIONAL_CHAINS = [
    "McDonald's", "Burger King", "Wendy's", "Taco Bell", "KFC",
    "Subway", "Starbucks", "Dunkin'", "Chipotle", "Panera Bread",
    "Chick-fil-A", "Popeyes", "Arby's", "Sonic Drive-In", "Jack in the Box",
    "Panda Express", "Dairy Queen", "Five Guys", "Jimmy John's", "Qdoba",
    "Moe's Southwest Grill", "Firehouse Subs", "Jersey Mike's", "Blaze Pizza",
    "MOD Pizza", "Pieology", "Shake Shack", "Smashburger", "Wingstop",
    "Buffalo Wild Wings", "Applebee's", "Chili's", "TGI Friday's", "Olive Garden",
    "Red Lobster", "Outback Steakhouse", "Texas Roadhouse", "LongHorn Steakhouse",
    "The Cheesecake Factory", "P.F. Chang's", "Benihana", "Maggiano's",
    "California Pizza Kitchen", "BJ's Restaurant", "Cracker Barrel", "Denny's",
    "IHOP", "Waffle House", "Perkins", "Bob Evans", "First Watch",
    "Papa John's", "Domino's", "Pizza Hut", "Little Caesars", "Papa Murphy's",
    "Marco's Pizza", "Hungry Howie's", "Round Table Pizza", "Godfather's Pizza",
    "Sbarro", "Cici's Pizza", "Chuck E. Cheese", "Peter Piper Pizza"
];

const REGIONAL_CHAINS = [
    // Southeast
    "Bojangles", "Cookout", "Zaxby's", "Waffle House", "Krystal",
    "Whataburger", "Church's Chicken", "Raising Cane's", "Fuddruckers",
    "Jason's Deli", "McAlister's Deli", "Newk's Eatery", "Mellow Mushroom",

    // West Coast
    "In-N-Out Burger", "Carl's Jr.", "Del Taco", "El Pollo Loco", "The Habit",
    "Islands Fine Burgers", "Rubio's Coastal Grill", "Baja Fresh",

    // Midwest
    "Culver's", "Portillo's", "White Castle", "Steak 'n Shake", "Skyline Chili",
    "Penn Station", "Lion's Choice", "Runza",

    // Northeast
    "Friendly's", "Legal Sea Foods", "Au Bon Pain", "Bertucci's",

    // Southwest
    "Whataburger", "Torchy's Tacos", "Chuy's", "Pappadeaux", "Pappasito's",
    "Freebirds", "Fuzzy's Taco Shop", "Taco Cabana", "Rosa's Cafe"
];

const FAST_CASUAL_CHAINS = [
    "Sweetgreen", "Cava", "Dig", "Tender Greens", "True Food Kitchen",
    "Flower Child", "Mendocino Farms", "Lemonade", "Veggie Grill",
    "Native Foods", "By Chloe", "Honeygrow", "Dig Inn", "Chopt",
    "Just Salad", "Saladworks", "Freshii", "Protein Bar", "Snap Kitchen"
];

const COFFEE_CHAINS = [
    "Starbucks", "Dunkin'", "Peet's Coffee", "The Coffee Bean", "Caribou Coffee",
    "Tim Hortons", "Dutch Bros", "Philz Coffee", "Blue Bottle", "Intelligentsia",
    "Stumptown", "La Colombe", "Joe Coffee", "Gregory's Coffee"
];

const BAKERY_CHAINS = [
    "Panera Bread", "Corner Bakery", "Paris Baguette", "85°C Bakery Cafe",
    "Nothing Bundt Cakes", "Great American Cookies", "Cinnabon", "Auntie Anne's",
    "Krispy Kreme", "Duck Donuts", "Shipley Do-Nuts"
];

// Combine all chains
const ALL_CHAINS = [
    ...NATIONAL_CHAINS,
    ...REGIONAL_CHAINS,
    ...FAST_CASUAL_CHAINS,
    ...COFFEE_CHAINS,
    ...BAKERY_CHAINS
];

// Domain patterns for chains
const CHAIN_DOMAIN_PATTERNS = [
    'mcdonalds.com', 'burgerking.com', 'wendys.com', 'tacobell.com',
    'kfc.com', 'subway.com', 'starbucks.com', 'dunkindonuts.com',
    'chipotle.com', 'panerabread.com', 'chick-fil-a.com', 'popeyes.com',
    'arbys.com', 'sonicdrivein.com', 'jackinthebox.com', 'pandaexpress.com',
    'dairyqueen.com', 'fiveguys.com', 'jimmyjohns.com', 'qdoba.com',
    'olivegarden.com', 'redlobster.com', 'outback.com', 'texasroadhouse.com',
    'thecheesecakefactory.com', 'pfchangs.com', 'benihana.com',
    'papajohns.com', 'dominos.com', 'pizzahut.com', 'littlecaesars.com',
    'in-n-out.com', 'whataburger.com', 'culvers.com', 'shakeshack.com'
];

/**
 * Normalize restaurant name for comparison
 */
function normalizeName(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Remove special characters
        .replace(/\s+/g, ' ')         // Normalize whitespace
        .trim();
}

/**
 * Check if name matches any chain
 */
function findChainMatch(name: string): { chain: string; confidence: number } | null {
    const normalized = normalizeName(name);

    for (const chain of ALL_CHAINS) {
        const normalizedChain = normalizeName(chain);

        // Exact match
        if (normalized === normalizedChain) {
            return { chain, confidence: 100 };
        }

        // Contains match (e.g., "McDonald's #1234" contains "McDonald's")
        if (normalized.includes(normalizedChain)) {
            return { chain, confidence: 95 };
        }

        // Partial match (e.g., "Starbucks Coffee" contains "Starbucks")
        const chainWords = normalizedChain.split(' ');
        const nameWords = normalized.split(' ');

        // Check if all chain words appear in the name
        const allWordsMatch = chainWords.every(word =>
            nameWords.some(nameWord => nameWord.includes(word) || word.includes(nameWord))
        );

        if (allWordsMatch && chainWords.length > 0) {
            return { chain, confidence: 85 };
        }
    }

    return null;
}

/**
 * Check if website domain indicates a chain
 */
function checkDomain(website?: string): { chain: string; confidence: number } | null {
    if (!website) return null;

    const lowerWebsite = website.toLowerCase();

    for (const pattern of CHAIN_DOMAIN_PATTERNS) {
        if (lowerWebsite.includes(pattern)) {
            // Try to find the chain name from the domain
            const chainName = ALL_CHAINS.find(chain =>
                normalizeName(chain).replace(/\s/g, '') === pattern.split('.')[0]
            );

            return {
                chain: chainName || 'Unknown Chain',
                confidence: 100
            };
        }
    }

    return null;
}

/**
 * Detect if a restaurant is part of a chain
 */
export function detectChain(name: string, website?: string): ChainDetectionResult {
    // First check the name
    const nameMatch = findChainMatch(name);

    if (nameMatch) {
        return {
            isChain: true,
            chainName: nameMatch.chain,
            confidence: nameMatch.confidence,
            reason: `Name matches known chain: ${nameMatch.chain}`
        };
    }

    // Then check the domain
    const domainMatch = checkDomain(website);

    if (domainMatch) {
        return {
            isChain: true,
            chainName: domainMatch.chain,
            confidence: domainMatch.confidence,
            reason: `Domain matches chain: ${domainMatch.chain}`
        };
    }

    // Check for common chain indicators in the name
    const chainIndicators = [
        { pattern: /#\d+/, reason: 'Location number in name' },
        { pattern: /\b(location|store)\s*#?\d+/i, reason: 'Store number in name' },
        { pattern: /\b(franchise|franchisee)/i, reason: 'Franchise mention' }
    ];

    for (const indicator of chainIndicators) {
        if (indicator.pattern.test(name)) {
            return {
                isChain: true,
                confidence: 70,
                reason: indicator.reason
            };
        }
    }

    // Likely independent
    return {
        isChain: false,
        confidence: 80,
        reason: 'No chain indicators found'
    };
}

/**
 * Get list of all known chains (for UI/filtering)
 */
export function getAllChains(): string[] {
    return [...ALL_CHAINS].sort();
}

/**
 * Add custom chain to detection (runtime addition)
 */
const customChains: string[] = [];

export function addCustomChain(chainName: string): void {
    if (!customChains.includes(chainName)) {
        customChains.push(chainName);
        ALL_CHAINS.push(chainName);
    }
}
