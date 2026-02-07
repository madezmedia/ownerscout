# Quick Start: Generate 5 Sample Jingles

*Ready to generate real audio for SonicBrand samples*

---

## ⚡ **QUICK SETUP (2 minutes):**

### **Step 1: Install Dependencies**
```bash
cd /Users/michaelshaw/dyad-apps/ownerscout
npm install
```

### **Step 2: Get API Keys**

**FAL AI (Free Tier):**
1. Go to https://fal.ai
2. Sign up → Get API key
3. Copy key

**ElevenLabs (Free Tier):**
1. Go to https://elevenlabs.io
2. Sign up → Get API key
3. Copy key

### **Step 3: Set Keys as Environment Variables**

**Option A: Terminal (temporary)**
```bash
export FAL_KEY="your_fal_key_here"
export ELEVENLABS_API_KEY="your_elevenlabs_key_here"
```

**Option B: .env file (permanent)**
```bash
# Create .env.local file
echo "FAL_KEY=your_fal_key_here" > .env.local
echo "ELEVENLABS_API_KEY=your_elevenlabs_key_here" >> .env.local
```

**Option C: Vercel (for deployment)**
```bash
# Add to Vercel environment variables
vercel env add FAL_KEY
vercel env add ELEVENLABS_API_KEY
```

---

## 🎵 **GENERATE 5 JINGLES:**

Once keys are set, run:

```bash
npm run generate:audio
```

**This will generate:**
1. ✅ Amélie's French Bakery jingle
2. ✅ Cuzzo's Cuisine II jingle
3. ✅ Midwood Smokehouse jingle
4. ✅ Copper Thai jingle
5. ✅ The Goodyear House jingle

**Output:** `public/samples/*.mp3`

**Cost:** ~$0.45 total (free tier credits should cover it)

**Time:** ~2-3 minutes

---

## 📂 **OUTPUT STRUCTURE:**

```
public/samples/
├── amelies-jingle.mp3       # French cafe vibe
├── cuzzos-jingle.mp3        # Italian family warmth
├── midwood-jingle.mp3       # Bluesy BBQ soul
├── copper-jingle.mp3        # Thai exotic flair
└── goodyear-jingle.mp3      # Pub rock energy
```

---

## 🚀 **AFTER GENERATION:**

### **1. Test Audio Files**
```bash
# Play one to test
open public/samples/amelies-jingle.mp3
```

### **2. Update Samples Page**
The audio URLs should automatically work since they're in `public/samples/`

### **3. Deploy to Vercel**
```bash
git add public/samples/
git commit -m "Add real audio samples"
git push
vercel --prod
```

### **4. Test Live Site**
Go to: https://ownerscout.vercel.app
Click "Listen to Samples" → Play the jingles!

---

## 🎯 **CUSTOMIZATION:**

Want different voices or music styles?

**Edit:** `scripts/generateSamples.ts`

**Voice options:**
- `VOICE_OPTIONS.rachel` - Warm, professional
- `VOICE_OPTIONS.josh` - Deep, authoritative
- `VOICE_OPTIONS.arnold` - Energetic
- `VOICE_OPTIONS.adam` - British, friendly
- `VOICE_OPTIONS.charlie` - Neutral, clear
- `VOICE_OPTIONS.fin` - Finnish, exotic

**Music styles:**
- `MUSIC_STYLE_PROMPTS.french` - French cafe accordion
- `MUSIC_STYLE_PROMPTS.italian` - Italian mandolin
- `MUSIC_STYLE_PROMPTS.bbq` - Bluesy guitar
- `MUSIC_STYLE_PROMPTS.thai` - Thai traditional
- `MUSIC_STYLE_PROMPTS.pub` - Pub rock energy

---

## 💰 **COST BREAKDOWN:**

| Service | Per Jingle | 5 Jingles |
|---------|-----------|-----------|
| FAL AI (music) | $0.05 | $0.25 |
| ElevenLabs (voice) | $0.03 | $0.15 |
| FFmpeg (mixing) | $0.01 | $0.05 |
| **Total** | **$0.09** | **$0.45** |

**Free tiers:**
- FAL AI: $5 free credit (~100 jingles)
- ElevenLabs: 10,000 characters free (~50 jingles)

---

## 🐛 **TROUBLESHOOTING:**

### **"FAL_KEY not found"**
```bash
# Check if key is set
echo $FAL_KEY

# If empty, set it
export FAL_KEY="your_key_here"
```

### **"ElevenLabs quota exceeded"**
- You may have used free tier
- Upgrade to paid plan ($5/month)
- Or use alternative voice synthesis

### **"FFmpeg not found"**
```bash
# Install FFmpeg
brew install ffmpeg  # macOS
```

### **Audio quality issues**
- Adjust `volume=0.3` in mix command (lower = quieter music)
- Change voice in `generateSamples.ts`
- Adjust music prompt for better generation

---

## ✅ **SUCCESS CHECKLIST:**

- [ ] API keys set up
- [ ] Dependencies installed
- [ ] `npm run generate:audio` run successfully
- [ ] 5 MP3 files in `public/samples/`
- [ ] Audio files tested and sound good
- [ ] Samples page plays audio correctly
- [ ] Deployed to Vercel
- [ ] Live site works

---

## 🎉 **ONCE COMPLETE:**

You'll have:
- ✅ 5 real AI-generated jingles
- ✅ Working samples page with audio
- ✅ Ready-to-use outreach materials
- ✅ Professional demo for prospects

**Start closing deals!** 🚀💰

---

**Need help?** Check the full setup guide:
`/Users/michaelshaw/clawd/projects/ugcaudio-integration/audio-setup-guide.md`
