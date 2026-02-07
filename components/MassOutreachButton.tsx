import React, { useState } from 'react';
import { Wand2, Mail, Download, BarChart3, Loader2, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { PlaceResult } from '../types';
import { massOutreachSonicBrands, generateOutreachStats, exportEmailsAsCSV } from '../services/massOutreach';

interface MassOutreachButtonProps {
  restaurants: PlaceResult[];
}

export const MassOutreachButton: React.FC<MassOutreachButtonProps> = ({ restaurants }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);

  const stats = generateOutreachStats(restaurants);

  const handleMassOutreach = async () => {
    setIsGenerating(true);
    setShowResults(false);

    try {
      const result = await massOutreachSonicBrands(restaurants, {
        maxRestaurants: 20,
        minSonicBrandScore: 30,
        includeOwnerCTA: true
      });

      setResult(result);
      setShowResults(true);
    } catch (error) {
      console.error('Mass outreach error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportCSV = () => {
    if (!result) return;

    const csv = exportEmailsAsCSV(result.emails);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sonic-brand-outreach-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <button
        onClick={handleMassOutreach}
        disabled={isGenerating || stats.lowScore === 0}
        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGenerating ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Generating {stats.lowScore} Packages...
          </>
        ) : (
          <>
            <Wand2 size={18} />
            Mass Outreach ({stats.lowScore} Targets)
          </>
        )}
      </button>

      {/* Results Modal */}
      {showResults && result && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
          >
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <CheckCircle2 className="text-green-500" size={24} />
                Mass Outreach Complete!
              </h3>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="text-3xl font-bold text-purple-600">{result.totalProcessed}</div>
                  <div className="text-sm text-purple-700">Packages Generated</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="text-3xl font-bold text-green-600">${result.summary.estimatedValue.toLocaleString()}</div>
                  <div className="text-sm text-green-700">Estimated Value</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-3xl font-bold text-blue-600">{Math.floor(result.summary.estimatedTime / 60)}m</div>
                  <div className="text-sm text-blue-700">Production Time</div>
                </div>
              </div>

              {/* Restaurant List */}
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-700 mb-3">Generated Packages:</h4>
                {result.pipelines.map((pipeline: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{pipeline.restaurant.name}</div>
                      <div className="text-sm text-gray-500">{pipeline.restaurant.tagline}</div>
                    </div>
                    <div className="flex gap-2">
                      <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                        View
                      </button>
                      <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                        Email
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {result.successful} successful • {result.failed} failed
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResults(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Close
                </button>
                <button
                  onClick={handleExportCSV}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
                >
                  <Download size={16} />
                  Export CSV
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default MassOutreachButton;
