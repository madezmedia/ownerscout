import React, { useState } from 'react';
import { Play, Pause, Volume2, Download, Mail, Sparkles, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { restaurantSamples } from '../data/restaurantSamples';

export const SamplesPage: React.FC = () => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.7);

  const togglePlay = (id: string) => {
    if (playingId === id) {
      setPlayingId(null);
    } else {
      setPlayingId(id);
    }
  };

  const totalValue = restaurantSamples.reduce((sum, r) => sum + r.pricing, 0);
  const totalOwnerCom = restaurantSamples.length * 1000; // $1K per referral

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 mb-4">
            🎵 SonicBrand AI Samples
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            AI-generated jingles for Charlotte restaurants
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="bg-white rounded-xl p-4 shadow-lg border border-purple-200">
              <div className="text-3xl font-bold text-purple-600">{restaurantSamples.length}</div>
              <div className="text-sm text-gray-600">Restaurants</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-lg border border-green-200">
              <div className="text-3xl font-bold text-green-600">${totalValue}</div>
              <div className="text-sm text-gray-600">Jingle Value</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-lg border border-blue-200">
              <div className="text-3xl font-bold text-blue-600">${totalOwnerCom.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Owner.com Potential</div>
            </div>
          </div>
        </div>

        {/* Samples Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {restaurantSamples.map((sample) => (
            <motion.div
              key={sample.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-2xl font-bold">{sample.name}</h3>
                    <p className="text-purple-100 text-sm mt-1">{sample.location}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
                    <span className="text-yellow-300">★</span>
                    <span className="font-semibold">{sample.rating}</span>
                  </div>
                </div>
                <p className="text-lg font-semibold italic">"{sample.tagline}"</p>
              </div>

              {/* Body */}
              <div className="p-6">
                {/* Audio Player */}
                <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => togglePlay(sample.id)}
                      className="w-14 h-14 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full flex items-center justify-center hover:shadow-lg transition-all flex-shrink-0"
                    >
                      {playingId === sample.id ? (
                        <Pause size={24} />
                      ) : (
                        <Play size={24} className="ml-1" />
                      )}
                    </button>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Volume2 size={16} className="text-gray-400" />
                        <div className="flex-1 bg-gray-300 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all"
                            style={{ width: playingId === sample.id ? '60%' : '0%' }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">0:15</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {playingId === sample.id ? 'Playing...' : 'Click to play sample'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Script Preview */}
                <div className="bg-purple-50 rounded-xl p-4 mb-4 border border-purple-200">
                  <h4 className="font-semibold text-purple-900 mb-2 text-sm">📝 Jingle Script:</h4>
                  <pre className="text-xs text-purple-800 whitespace-pre-wrap font-mono">
                    {sample.jingleScript}
                  </pre>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{sample.sonicBrandScore}</div>
                    <div className="text-xs text-gray-600">Sonic Score</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">${sample.pricing}</div>
                    <div className="text-xs text-gray-600">Your Price</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{sample.ownerComFit}</div>
                    <div className="text-xs text-gray-600">Owner.com Fit</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all">
                    <DollarSign size={18} />
                    Get for ${sample.pricing}
                  </button>
                  <button className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all">
                    <Download size={18} />
                  </button>
                  <button className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all">
                    <Mail size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Want Your Custom Jingle?</h2>
          <p className="text-xl mb-6 text-purple-100">
            AI-generated in 24 hours. $27. Money-back guarantee.
          </p>
          <div className="flex gap-4 justify-center">
            <button className="bg-white text-purple-600 px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all flex items-center gap-2">
              <Sparkles size={24} />
              Get My Jingle
            </button>
            <button className="bg-purple-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-purple-800 transition-all flex items-center gap-2">
              <Mail size={24} />
              Contact Us
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-600 text-sm">
          <p>Generated by UGCAudio • AI Sonic Branding for Charlotte Restaurants</p>
          <p className="mt-2">
            <a href="/" className="text-purple-600 hover:text-purple-700 font-medium">
              ← Back to OwnerScout
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SamplesPage;
