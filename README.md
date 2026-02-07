# OwnerScout - Restaurant Prospecting for Owner.com

**Find independent restaurants, analyze their tech stack, and score them as ideal Owner.com leads.**

---

## Overview

OwnerScout is a restaurant prospecting tool that helps Owner.com identify high-value independent restaurant leads by:

1. **Finding restaurants** using Google Places Aggregate API with filters for location, price, rating, and type
2. **Crawling websites** to detect tech stack (ordering systems, POS, delivery integrations, website platforms)
3. **Scoring fit** based on independence, tech gaps, and commission bleed opportunities
4. **Exporting leads** with comprehensive tech profiles for sales outreach

---

## Features

### 🎯 Smart Filtering
- **Geographic**: Search by ZIP code with configurable radius
- **Restaurant attributes**: Price level ($/$$/$$$), rating bands, operational status
- **Independence detection**: Automatically filters out 100+ known chains
- **Tech stack filters**: Target restaurants with 3P delivery but no 1P ordering

### 🕷️ Real Tech Stack Detection
- **Website platforms**: WordPress, Wix, Squarespace, BentoBox, Custom, etc.
- **Online ordering**: Owner.com, ChowNow, Toast, Olo, Slice, Square, etc.
- **Reservations**: OpenTable, Resy, SevenRooms, Tock, etc.
- **Delivery**: DoorDash, UberEats, Grubhub, Postmates
- **POS systems**: Toast, Square, Clover, Lightspeed, Aloha
- **Loyalty/CRM**: Thanx, Punchh, Paytronix
- **Confidence scoring**: Each detection includes a confidence percentage

### 📊 Owner.com Fit Scoring
Restaurants are scored 0-100 based on:
- **Independence** (20 pts): Not part of a chain
- **Ideal pricing** (15 pts): $$ or $$$ price level
- **Healthy rating** (10 pts): 3.8-4.9 stars
- **Strong reviews** (10 pts): 100+ reviews
- **Commission bleed** (35 pts): Has 3P delivery but no 1P ordering
- **No ordering** (15 pts): No online ordering at all
- **Legacy tech** (10 pts): Outdated website platform

### 🧠 AI Vibe Check
- **Qualitative Analysis**: Uses Google Gemini to analyze website content
- **Vibe Description**: 3-5 word summary (e.g., "Upscale Romantic Italian")
- **Sales Pitch**: Generates a custom icebreaker based on tech gaps
- **Target Audience**: Identifies who the restaurant caters to

### 📤 Export & Analysis
- **CSV export** with all tech stack fields
- **Visual results** with color-coded fit scores
- **Summary stats**: High-fit count, average score, market composition

---

## Setup

### Prerequisites
- Node.js 18+
- Google Maps API key (for Places Aggregate & Places Details APIs)
- Gemini API key (for Vibe Check analysis)

### Installation

1. **Clone and install**:
   ```bash
   cd ownerscout
   npm install
   ```

2. **Configure API keys** in `.env.local`:
   ```bash
   GEMINI_API_KEY=your_gemini_api_key_here
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   ```

   > **Important**: You need a Google Maps API key with the following APIs enabled:
   > - Places API (New)
   > - Places Aggregate API
   > - Geocoding API

3. **Run locally**:
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`

---

## Usage

### Basic Workflow

1. **Define Territory**
   - Enter ZIP code (e.g., `28202` for Charlotte, NC)
   - Set search radius (1-10 km)

2. **Set Filters**
   - Select restaurant types (restaurant, cafe, bar, etc.)
   - Choose price levels ($, $$, $$$, $$$$)
   - Set rating range (e.g., 3.8 - 4.8)
   - Enable "Independent Only" to exclude chains

3. **Initial Search**
   - Click "Search" to get a count of matching restaurants
   - Review market composition and estimated high-fit count

4. **Fetch Detailed Leads**
   - Click "View Lead List" to crawl websites and analyze tech stacks
   - Wait for tech detection to complete (shows progress in console)

5. **Review & Export**
   - Browse results sorted by fit score
   - Click "Export Leads" to download CSV for CRM import

### Advanced Filters

**Tech Stack Filters** (in SearchPanel):
- **Require 3P Delivery**: Only show restaurants using DoorDash/UberEats/Grubhub
- **Require No 1P Ordering**: Only show restaurants without first-party ordering
- These filters help identify "commission bleed" opportunities

### Example Use Cases

**Find commission bleed opportunities**:
- Price: $$ and $$$
- Rating: 3.8 - 4.8
- Independent only: ✓
- Require 3P delivery: ✓
- Require no 1P ordering: ✓

**Find restaurants with no digital ordering**:
- Price: $$ and $$$
- Independent only: ✓
- (No tech filters - will show all, then sort by fit score)

---

## Architecture

### Services

#### `techDetector.ts`
Real website crawling service that:
- Fetches HTML from restaurant websites
- Pattern-matches against 50+ tech platforms
- Detects first-party vs third-party ordering
- Returns confidence scores

#### `chainDetector.ts`
Chain detection service with:
- 100+ national and regional chains
- Domain pattern matching
- Name normalization and fuzzy matching

#### `placesService.ts`
Main orchestration service that:
- Calls Google Places Aggregate API
- Fetches place details
- Runs tech detection in parallel
- Applies scoring algorithm
- Filters and sorts results

### Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build**: Vite
- **Charts**: Recharts
- **Icons**: Lucide React
- **APIs**: Google Places Aggregate, Places Details, Geocoding

---

## API Configuration

### Google Maps API Key

You need to enable these APIs in Google Cloud Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable APIs:
   - **Places API (New)** - for computeInsights and place details
   - **Geocoding API** - for ZIP code to lat/lng conversion
4. Create credentials → API key
5. Add to `.env.local` as `GOOGLE_MAPS_API_KEY`

### Rate Limits & Costs

- **Places Aggregate API**: $0.01 per request (count) + $0.05 per request (places)
- **Place Details**: $0.017 per request
- **Geocoding**: $0.005 per request

**Cost example** for 50 restaurants:
- 1 count request: $0.01
- 1 places request: $0.05
- 50 place details: $0.85
- 1 geocoding: $0.005
- **Total**: ~$0.91

---

## CSV Export Format

The exported CSV includes these columns:

| Column | Description |
|--------|-------------|
| Name | Restaurant name |
| Fit Score | 0-100 Owner.com fit score |
| Fit Reason | Human-readable scoring explanation |
| Independent | Yes/No |
| Type | Primary place type |
| Rating | Google rating (1-5) |
| Reviews | Number of reviews |
| Price | Price level ($-$$$$) |
| Address | Full formatted address |
| Website | Restaurant website URL |
| Website Platform | Detected platform (WordPress, Wix, etc.) |
| POS | Point of sale systems |
| Ordering (1P) | First-party ordering systems |
| Has 1P Ordering | Yes/No |
| Delivery (3P) | Third-party delivery platforms |
| Reservations | Reservation systems |
| Loyalty/CRM | Loyalty and CRM tools |
| Tech Confidence | Detection confidence (0-100%) |

---

## Development

### Project Structure

```
ownerscout/
├── services/
│   ├── placesService.ts      # Main orchestration
│   ├── techDetector.ts        # Website crawling & tech detection
│   └── chainDetector.ts       # Chain identification
├── components/
│   ├── SearchPanel.tsx        # Filter controls
│   ├── ResultsView.tsx        # Results table & export
│   └── MapVisualization.tsx   # Map view
├── types.ts                   # TypeScript interfaces
├── constants.ts               # Static data
└── App.tsx                    # Main app component
```

### Adding New Tech Platforms

To add detection for a new platform, edit `services/techDetector.ts`:

```typescript
const NEW_PLATFORM: DetectionPattern[] = [
  {
    name: 'PlatformName',
    patterns: {
      domain: ['.platformdomain.com'],
      scriptSrc: ['platformcdn.com'],
      htmlContent: ['PlatformName', 'platform-specific-text']
    }
  }
];
```

Then add to the appropriate detection category (ordering, POS, etc.).

---

## Troubleshooting

### "No GOOGLE_MAPS_API_KEY found. Agent switching to Simulation Mode"

This means the API key is missing or not loaded. Check:
1. `.env.local` file exists in project root
2. Key is named `GOOGLE_MAPS_API_KEY` (not `GOOGLE_MAPS_KEY`)
3. Restart dev server after adding key

### Tech detection shows low confidence

This is normal for:
- Restaurants without websites
- Websites that don't use common platforms
- Sites with minimal JavaScript/tracking

Low confidence doesn't mean the detection is wrong, just that fewer signals were found.

### "CORS error" when crawling websites

Some websites block cross-origin requests. The tech detector handles this gracefully by:
- Setting a 10-second timeout
- Returning "Unknown" platform on failure
- Logging warnings (not errors)

For production, consider using a backend proxy service.

---

## Roadmap

- [ ] Backend proxy for CORS-free crawling
- [ ] Gemini AI integration for intelligent lead scoring
- [ ] CRM integrations (HubSpot, Salesforce)
- [ ] Email outreach templates
- [ ] Historical tracking of tech stack changes
- [ ] Competitive analysis (compare to Owner.com customers)

---

## License

MIT

---

## Support

For questions or issues, contact the Owner.com team or open an issue in the repository.
