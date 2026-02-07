import React, { useState } from 'react';
import { Play, Wand2, Download, Mail, Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { PlaceResult } from '../types';
import { generateSonicBrandPipeline, SonicBrandOutput, generatePreviewScript } from '../services/sonicBrandPipeline';

interface SonicBrandPipelineProps {
  restaurant: PlaceResult;
  onComplete?: (output: SonicBrandOutput) => void;
}

export const SonicBrandPipeline: React.FC<SonicBrandPipelineProps> = ({ restaurant, onComplete }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState<SonicBrandOutput | null>(null);
  const [previewScript, setPreviewScript] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [pricing, setPricing] = useState<{ amount: number; label: string }>({
    amount: 27,
    label: 'Starter'
  });

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await generateSonicBrandPipeline(restaurant);
      setOutput(result);

      // Set pricing based on sonic brand score
      const score = restaurant.sonicBrand?.sonicBrandScore ?? 0;
      if (score < 20) {
        setPricing({ amount: 27, label: 'Starter' });
      } else if (score < 40) {
        setPricing({ amount: 47, label: '3 Jingles' });
      } else {
        setPricing({ amount: 97, label: 'Full Brand' });
      }

      onComplete?.(result);
    } catch (error) {
      console.error('Pipeline generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreview = async () => {
    setShowPreview(true);
    try {
      const script = await generatePreviewScript(restaurant);
      setPreviewScript(script);
    } catch (error) {
      console.error('Preview generation error:', error);
    }
  };

  const handleSendEmail = () => {
    if (!output) return;

    const subject = encodeURIComponent(`$${pricing.amount} jingle for ${restaurant.name} 🎵`);
    const body = encodeURIComponent(`Hi,

I can create a custom jingle for ${restaurant.name} by tomorrow.

$${pricing.amount}. Delivered in 24 hours.

Here's what you get:
✅ Custom 15-second jingle
✅ AI-generated music (matches your vibe)
✅ Professional voiceover
✅ Commercial rights included
✅ Money-back guarantee

**Why $${pricing.amount}?**
I'm building my portfolio with 100 Charlotte restaurants. You get a great deal, I get to show off my work.

**Listen to your custom jingle:**
${output.audio.jingleUrl}

Want it? Just reply "YES" and it's yours by tomorrow.

24-hour turnaround or your money back.

Best,
Michael Shaw
UGCAudio | AI Sonic Branding for Charlotte

P.S. I also help restaurants with better online ordering systems through Owner.com. If you're looking to upgrade yours, let me know!`);

    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const handleDownload = () => {
    if (!output) return;

    // Download all scripts as text file
    const content = `
SONIC BRAND PACKAGE - ${restaurant.name}
Generated: ${output.metadata.generatedAt}

====================================
JINGLE SCRIPT
====================================

${output.scripts.jingleScript}

====================================
LEAD MAGNET SCRIPT
====================================

${output.scripts.leadMagnetScript}

====================================
PODCAST INTRO SCRIPT
====================================

${output.scripts.podcastIntroScript}

====================================
OUTREACH EMAIL
====================================

Subject: ${output.outreach.emailSubject}

${output.outreach.emailBody}

====================================
AUDIO FILES
====================================

Jingle: ${output.audio.jingleUrl}
Voiceover: ${output.audio.voiceoverUrl}
Lead Magnet: ${output.audio.leadMagnetUrl}

Generated in ${output.metadata.productionTime} seconds
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sonic-brand-${restaurant.name.replace(/\s+/g, '-').toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative">
      {!output ? (
        <div className="flex gap-2">
          {/* Preview Script Button */}
          <button
            onClick={handlePreview}
            className="text-[9px] text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
          >
            <Play size={10} /> Preview Script
          </button>

          {/* Generate Pipeline Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="text-[9px] bg-purple-100 hover:bg-purple-200 text-purple-700 px-2 py-1 rounded font-medium flex items-center gap-1 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 size={10} className="animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Wand2 size={10} /> 1-Click Generate
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          {/* Download Scripts */}
          <button
            onClick={handleDownload}
            className="text-[9px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            <Download size={10} /> Scripts
          </button>

          {/* Send Email */}
          <button
            onClick={handleSendEmail}
            className="text-[9px] text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
          >
            <Mail size={10} /> Email
          </button>

          {/* Regenerate */}
          <button
            onClick={() => {
              setOutput(null);
              handleGenerate();
            }}
            className="text-[9px] text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
          >
            <Sparkles size={10} /> Refresh
          </button>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
          >
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">
                🎵 Sonic Brand Preview: {restaurant.name}
              </h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {previewScript ? (
                <pre className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border border-gray-200">
                  {previewScript}
                </pre>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin text-purple-600" size={32} />
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowPreview(false);
                  handleGenerate();
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium flex items-center gap-2"
              >
                <Wand2 size={16} /> Generate Full Package
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default SonicBrandPipeline;
