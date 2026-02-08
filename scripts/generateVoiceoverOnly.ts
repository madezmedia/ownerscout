/**
 * Quick Audio Generation - ElevenLabs Voiceover Only
 * Generate professional voiceovers without music
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Restaurant samples
const SAMPLES = [
  {
    id: 'amelies',
    name: "Amélie's French Bakery",
    script: "Taste the romance of Paris in Charlotte. Authentic French pastries, warm baguettes, and unforgettable moments. Amélie's - where every bite tells a story."
  },
  {
    id: 'cuzzos',
    name: "Cuzzo's Cuisine II",
    script: "Real Italian. Real Flavor. Cuzzo's. Family recipes passed down for generations. From our kitchen to your table. Taste the tradition."
  },
  {
    id: 'midwood',
    name: "Midwood Smokehouse",
    script: "Where Charlotte goes for real BBQ. 12-hour smoked brisket, pulled pork, and all the fixings. Midwood Smokehouse - slow food, done right."
  },
  {
    id: 'copper',
    name: "Copper Thai",
    script: "Thai food that tells a story. Authentic recipes from Bangkok to Charlotte. Fresh ingredients, bold flavors, unforgettable experiences. Copper Thai."
  },
  {
    id: 'goodyear',
    name: "The Goodyear House",
    script: "Where friends become family over great food. Craft burgers, local beer, good vibes. The Goodyear House - your neighborhood gathering place."
  }
];

/**
 * Generate voiceover using ElevenLabs API
 */
async function generateVoiceover(text, voiceId = '21m00Tcm4TlvDq8ikWAM') {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY not set');
  }

  console.log(`🎙️ Generating voiceover...`);
  console.log(`   Text: "${text.substring(0, 50)}..."`);

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs error: ${response.statusText} - ${error}`);
  }

  console.log(`   ✅ Voiceover generated!`);
  return Buffer.from(await response.arrayBuffer());
}

/**
 * Main generation
 */
async function main() {
  console.log('🎵 Generating 5 SonicBrand Voiceovers (ElevenLabs Only)');
  console.log('='.repeat(60) + '\n');

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.log('❌ ELEVENLABS_API_KEY not found!');
    process.exit(1);
  }

  console.log('✅ API key found!\n');

  const outputDir = path.join(process.cwd(), 'public', 'samples');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`📁 Output directory: ${outputDir}\n`);

  let successCount = 0;
  let failCount = 0;

  for (const sample of SAMPLES) {
    console.log(`🎵 ${sample.name}`);
    console.log('-'.repeat(60));

    try {
      const audio = await generateVoiceover(sample.script);
      const outputPath = path.join(outputDir, `${sample.id}.mp3`);
      fs.writeFileSync(outputPath, audio);
      console.log(`   ✅ Saved: ${sample.id}.mp3\n`);
      successCount++;
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}\n`);
      failCount++;
    }
  }

  console.log('='.repeat(60));
  console.log('📊 GENERATION SUMMARY\n');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`💰 Estimated cost: $${(successCount * 0.03).toFixed(2)}\n`);

  if (successCount > 0) {
    console.log('🎉 Done! Voiceovers ready for samples page.\n');
    console.log('Next steps:');
    console.log('1. Test the audio files');
    console.log('2. Update restaurantSamples.ts with new paths');
    console.log('3. Deploy to Vercel');
    console.log('4. Start outreach!\n');
  }
}

main().catch(console.error);
