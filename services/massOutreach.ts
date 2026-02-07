/**
 * Mass Outreach - Batch SonicBrand Pipeline
 * Generate packages for multiple restaurants at once
 */

import type { PlaceResult } from '../types';
import { generateBatchPipelines, SonicBrandOutput } from './sonicBrandPipeline';

export interface MassOutreachConfig {
  maxRestaurants: number;
  minSonicBrandScore: number; // Only target restaurants with low scores
  includeOwnerCTA: boolean;
}

export interface MassOutreachResult {
  totalProcessed: number;
  successful: number;
  failed: number;
  pipelines: SonicBrandOutput[];
  emails: EmailOutreachPackage[];
  summary: {
    totalJingles: number;
    estimatedValue: number;
    estimatedTime: number;
  };
}

export interface EmailOutreachPackage {
  restaurantName: string;
  email: string;
  subject: string;
  body: string;
  audioPreviewUrl: string;
  status: 'ready' | 'sent' | 'failed';
}

/**
 * Mass outreach - Generate SonicBrand packages for multiple restaurants
 */
export async function massOutreachSonicBrands(
  restaurants: PlaceResult[],
  config: MassOutreachConfig
): Promise<MassOutreachResult> {

  // Filter restaurants based on config
  const targetRestaurants = restaurants
    .filter(r => {
      const score = r.sonicBrand?.sonicBrandScore ?? 0;
      return score < config.minSonicBrandScore;
    })
    .slice(0, config.maxRestaurants);

  console.log(`🎵 Generating SonicBrand packages for ${targetRestaurants.length} restaurants...`);

  // Generate pipelines for all restaurants
  const pipelines = await generateBatchPipelines(targetRestaurants);

  // Create email packages for each
  const emails: EmailOutreachPackage[] = pipelines.map(pipeline => {
    const email = createEmailOutreach(pipeline, config.includeOwnerCTA);

    return {
      restaurantName: pipeline.restaurant.name,
      email: '', // Would need to be scraped/looked up
      subject: email.subject,
      body: email.body,
      audioPreviewUrl: pipeline.audio.jingleUrl,
      status: 'ready'
    };
  });

  const summary = {
    totalJingles: pipelines.length,
    estimatedValue: pipelines.length * 27, // $27 per jingle (no-brainer pricing)
    estimatedTime: pipelines.length * 30 // 30 seconds per package
  };

  return {
    totalProcessed: pipelines.length,
    successful: pipelines.length,
    failed: 0,
    pipelines,
    emails,
    summary
  };
}

/**
 * Create email outreach package
 */
function createEmailOutreach(
  pipeline: SonicBrandOutput,
  includeOwnerCTA: boolean
): { subject: string; body: string } {

  let body = pipeline.outreach.emailBody;

  if (includeOwnerCTA) {
    body += `

---
**BONUS: Better Online Ordering**

While we're working on your sonic brand - how's your online ordering system?

I partner with Owner.com to help restaurants:
✅ Save 30% on delivery fees
✅ Own your customer data
✅ Control your brand online

Want to see if you'd benefit? Just reply and let me know!

---`;
  }

  return {
    subject: pipeline.outreach.emailSubject,
    body
  };
}

/**
 * Export emails as CSV for bulk email tools
 */
export function exportEmailsAsCSV(emails: EmailOutreachPackage[]): string {
  const headers = ['Restaurant', 'Email', 'Subject', 'Body', 'Audio URL', 'Status'];

  const rows = emails.map(e => [
    e.restaurantName,
    e.email,
    e.subject,
    e.body.replace(/\n/g, '\\n'),
    e.audioPreviewUrl,
    e.status
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  return csv;
}

/**
 * Generate quick outreach stats
 */
export function generateOutreachStats(restaurants: PlaceResult[]): {
  total: number;
  lowScore: number;
  mediumScore: number;
  highScore: number;
  potentialValue: number;
} {
  const lowScore = restaurants.filter(r => (r.sonicBrand?.sonicBrandScore ?? 0) < 30).length;
  const mediumScore = restaurants.filter(r => {
    const score = r.sonicBrand?.sonicBrandScore ?? 0;
    return score >= 30 && score < 60;
  }).length;
  const highScore = restaurants.filter(r => (r.sonicBrand?.sonicBrandScore ?? 0) >= 60).length;

  const potentialValue = lowScore * 27; // $27 per low-score restaurant (impulse-buy pricing)

  return {
    total: restaurants.length,
    lowScore,
    mediumScore,
    highScore,
    potentialValue
  };
}
