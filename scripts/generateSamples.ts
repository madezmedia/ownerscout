#!/usr/bin/env node
/**
 * Generate 5 Sample Jingles for SonicBrand
 * Run this after setting up FAL AI and ElevenLabs API keys
 */

import { generateCompleteJingle, VOICE_OPTIONS, MUSIC_STYLE_PROMPTS } from './generateAudio.js';
import fs from 'fs';
import path from 'path';

const SAMPLES = [
  {
    id: 'amelies',
    name: "Amélie's French Bakery",
    script: `Taste the romance of Paris in Charlotte. Authentic French pastries, crafted with love. Amélie's French Bakery.`,
    musicPrompt: MUSIC_STYLE_PROMPTS.french,
    voice: VOICE_OPTIONS.fin // Finnish voice for exotic French feel
  },
  {
    id: 'cuzzos',
    name: "Cuzzo's Cuisine II",
    script: `Real Italian. Real Flavor. Cuzzo's. Family recipes passed down for three generations. Cuzzo's Cuisine II.`,
    musicPrompt: MUSIC_STYLE_PROMPTS.italian,
    voice: VOICE_OPTIONS.josh // Deep, warm, family-oriented
  },
  {
    id: 'midwood',
    name: "Midwood Smokehouse",
    script: `Where Charlotte goes for real BBQ. 12-hour smoked meats, homemade sauces. Midwood Smokehouse.`,
    musicPrompt: MUSIC_STYLE_PROMPTS.bbq,
    voice: VOICE_OPTIONS.arnold // Energetic, BBQ joint vibe
  },
  {
    id: 'copper',
    name: "Copper Thai",
    script: `Thai food that tells a story. Authentic recipes from Chiang Mai. Copper Thai.`,
    musicPrompt: MUSIC_STYLE_PROMPTS.thai,
    voice: VOICE_OPTIONS.adam // British accent for authentic feel
  },
  {
    id: 'goodyear',
    name: "The Goodyear House",
    script: `Where friends become family over great food. Craft burgers, local beer, community. The Goodyear House.`,
    musicPrompt: MUSIC_STYLE_PROMPTS.pub,
    voice: VOICE_OPTIONS.rachel // Warm, friendly, community-focused
  }
];

async function main() {
  console.log('🎵 Generating 5 SonicBrand Sample Jingles\n');
  console.log('=' .repeat(60));

  // Check for API keys
  const falKey = process.env.FAL_KEY || process.env.FAL_API_KEY;
  const elevenLabsKey = process.env.ELEVENLABS_API_KEY || process.env.ELEVENLABS_KEY;

  if (!falKey) {
    console.error('❌ FAL_KEY not found!');
    console.error('   Set it with: export FAL_KEY="your_key_here"');
    process.exit(1);
  }

  if (!elevenLabsKey) {
    console.error('❌ ELEVENLABS_API_KEY not found!');
    console.error('   Set it with: export ELEVENLABS_API_KEY="your_key_here"');
    process.exit(1);
  }

  console.log('✅ API keys found!\n');

  // Create output directory
  const outputDir = path.join(process.cwd(), 'public', 'samples');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`📁 Output directory: ${outputDir}\n`);

  // Generate each jingle
  const results = [];

  for (const sample of SAMPLES) {
    console.log(`\n🎵 ${sample.name}`);
    console.log('-'.repeat(60));

    try {
      const outputPath = path.join(outputDir, `${sample.id}-jingle.mp3`);

      await generateCompleteJingle(
        sample.script,
        sample.musicPrompt,
        outputPath
      );

      results.push({
        id: sample.id,
        name: sample.name,
        success: true,
        path: outputPath
      });

      console.log(`✅ Success! Saved to: ${outputPath}`);

    } catch (error) {
      console.error(`❌ Failed: ${error.message}`);
      results.push({
        id: sample.id,
        name: sample.name,
        success: false,
        error: error.message
      });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 GENERATION SUMMARY\n');

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  console.log(`💰 Estimated cost: $${(successful.length * 0.09).toFixed(2)}\n`);

  if (successful.length > 0) {
    console.log('📁 Generated files:');
    successful.forEach(r => {
      console.log(`   ${r.id}: ${r.path}`);
    });
  }

  if (failed.length > 0) {
    console.log('\n❌ Failed:');
    failed.forEach(r => {
      console.log(`   ${r.id}: ${r.error}`);
    });
  }

  console.log('\n🎉 Done! Files ready for samples page.\n');
  console.log('Next steps:');
  console.log('1. Test the audio files');
  console.log('2. Update restaurantSamples.ts with new paths');
  console.log('3. Deploy to Vercel');
  console.log('4. Start outreach!\n');
}

main().catch(console.error);
