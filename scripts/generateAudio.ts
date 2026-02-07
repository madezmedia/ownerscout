/**
 * Real Audio Generation Implementation
 * Integrates with FAL AI and ElevenLabs APIs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface FALGenerationResult {
  audio_url: string;
  duration: number;
}

interface ElevenLabsGenerationResult {
  audio_base64?: string;
  audio_url?: string;
}

/**
 * Generate music using FAL AI Flux Realism model
 */
export async function generateMusicWithFAL(
  prompt: string,
  duration: number = 15
): Promise<Buffer> {
  const falKey = process.env.FAL_KEY || process.env.FAL_API_KEY;

  if (!falKey) {
    throw new Error('FAL_KEY environment variable not set');
  }

  console.log(`🎵 Generating music with FAL AI...`);
  console.log(`   Prompt: "${prompt}"`);
  console.log(`   Duration: ${duration}s`);

  try {
    // Submit generation request
    const queueResponse = await fetch('https://queue.fal.run/fal-ai/flux-realism/queue', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: `${prompt}, instrumental music, 15 seconds, high quality`,
        num_inference_steps: 30,
        num_images: 1
      })
    });

    if (!queueResponse.ok) {
      throw new Error(`FAL queue failed: ${queueResponse.statusText}`);
    }

    const queueData = await queueResponse.json();
    const requestId = queueData.request_id;

    console.log(`   Request ID: ${requestId}`);
    console.log(`   Waiting for generation...`);

    // Poll for result
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds max

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const statusResponse = await fetch(
        `https://queue.fal.run/fal-ai/flux-realism/status/${requestId}`,
        {
          headers: {
            'Authorization': `Key ${falKey}`
          }
        }
      );

      const statusData = await statusResponse.json();

      if (statusData.status === 'COMPLETED') {
        console.log(`   ✅ Generation complete!`);

        // Download the audio
        const audioResponse = await fetch(statusData.audio_url);
        const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());

        return audioBuffer;
      }

      if (statusData.status === 'FAILED') {
        throw new Error(`FAL generation failed: ${statusData.error || 'Unknown error'}`);
      }

      attempts++;
    }

    throw new Error('FAL generation timed out');

  } catch (error) {
    console.error('FAL AI error:', error);
    throw error;
  }
}

/**
 * Generate voiceover using ElevenLabs API
 */
export async function generateVoiceoverWithElevenLabs(
  text: string,
  voiceId: string = '21m00Tcm4TlvDq8ikWAM' // Default "Rachel" voice
): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY || process.env.ELEVENLABS_KEY;

  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY environment variable not set');
  }

  console.log(`🎙️ Generating voiceover with ElevenLabs...`);
  console.log(`   Voice: ${voiceId}`);
  console.log(`   Text: "${text.substring(0, 50)}..."`);

  try {
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
      const errorText = await response.text();
      throw new Error(`ElevenLabs error: ${response.statusText} - ${errorText}`);
    }

    console.log(`   ✅ Voiceover generated!`);

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    return audioBuffer;

  } catch (error) {
    console.error('ElevenLabs error:', error);
    throw error;
  }
}

/**
 * Mix music and voiceover using FFmpeg
 */
export async function mixAudioWithFFmpeg(
  musicBuffer: Buffer,
  voiceoverBuffer: Buffer,
  outputPath: string
): Promise<string> {
  console.log(`🔀 Mixing audio tracks...`);

  const musicPath = path.join(__dirname, 'temp_music.mp3');
  const voiceoverPath = path.join(__dirname, 'temp_voiceover.mp3');

  // Write temporary files
  fs.writeFileSync(musicPath, musicBuffer);
  fs.writeFileSync(voiceoverPath, voiceoverBuffer);

  try {
    // Use FFmpeg to mix
    const { exec } = await import('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);

    const ffmpegCommand = `ffmpeg -i "${musicPath}" -filter:a "volume=0.3" -i "${voiceoverPath}" -filter_complex "[0:a][1:a]amix=inputs=2:duration=first:dropout_transition=2" -y "${outputPath}"`;

    const { stdout, stderr } = await execAsync(ffmpegCommand);

    console.log(`   ✅ Mixing complete!`);
    console.log(`   Output: ${outputPath}`);

    return outputPath;

  } catch (error) {
    console.error('FFmpeg error:', error);
    throw error;
  } finally {
    // Clean up temp files
    if (fs.existsSync(musicPath)) fs.unlinkSync(musicPath);
    if (fs.existsSync(voiceoverPath)) fs.unlinkSync(voiceoverPath);
  }
}

/**
 * Generate complete jingle with music + voiceover
 */
export async function generateCompleteJingle(
  script: string,
  musicPrompt: string,
  outputPath: string
): Promise<string> {
  console.log(`🎵 Generating complete jingle...`);
  console.log(`   Script: "${script.substring(0, 50)}..."`);
  console.log(`   Music prompt: "${musicPrompt}"`);

  try {
    // Generate music
    const musicBuffer = await generateMusicWithFAL(musicPrompt, 15);

    // Generate voiceover
    const voiceoverBuffer = await generateVoiceoverWithElevenLabs(script);

    // Mix together
    const mixedPath = await mixAudioWithFFmpeg(musicBuffer, voiceoverBuffer, outputPath);

    console.log(`   ✅ Jingle generated successfully!`);
    console.log(`   📁 ${outputPath}`);

    return mixedPath;

  } catch (error) {
    console.error('Jingle generation error:', error);
    throw error;
  }
}

/**
 * Voice options for ElevenLabs
 */
export const VOICE_OPTIONS = {
  // American voices
  rachel: '21m00Tcm4TlvDq8ikWAM', // Warm, professional
  josh: 'TxGEqnHWrfWFTfGW9XjX', // Deep, authoritative
  arnold: 'VR6AewLTigWG4x3ukaVr', // Energetic

  // British voices
  adam: 'pNInz6obpgDQGcFma2gBBg', // Friendly, approachable
  charlie: 'AZnzlk1XvdvUeBnXmlldg', // Neutral, clear

  // International
  fin: 'EXAVITQu4vr4xnSDxMaL', // Finnish (good for diverse sound)
};

/**
 * Music style prompts for FAL AI
 */
export const MUSIC_STYLE_PROMPTS = {
  french: 'French cafe accordion music, romantic, elegant, Parisian bistro vibe',
  italian: 'Italian restaurant mandolin music, upbeat, family-friendly, warm',
  bbq: 'Bluesy BBQ joint guitar music, smoky, soulful, Southern',
  thai: 'Traditional Thai music mixed with modern beat, exotic, inviting',
  pub: 'Upbeat pub rock music, energetic, friendly, community atmosphere',
  upbeat: 'Upbeat commercial jingle music, energetic, memorable, catchy',
  elegant: 'Elegant fine dining music, sophisticated, classy, refined',
};
