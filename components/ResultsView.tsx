import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Download, Grid, Info, ChevronRight, ExternalLink, Smartphone, Globe, CreditCard } from 'lucide-react';
import { AggregateResponse, InsightType, PlaceResult } from '../types';
import { PRICE_LEVEL_LABELS } from '../constants';
import { exportToCSV } from '../services/placesService';
import { analyzeRestaurant, AIAnalysisResult } from '../services/aiService';
import { motion, AnimatePresence } from 'framer-motion';
import { SkeletonPanel } from './SkeletonLoader';
import { Sparkles, Loader2, MessageSquare, Target, Zap } from 'lucide-react';

interface ResultsViewProps {
    data: AggregateResponse | null;
    onFetchPlaces: () => void;
    isLoading: boolean;
}

const ResultsView: React.FC<ResultsViewProps> = ({ data, onFetchPlaces, isLoading }) => {
    const [expandedIds, setExpandedIds] = React.useState<string[]>([]);
    const [analyzing, setAnalyzing] = React.useState<Record<string, boolean>>({});
    const [analysisResults, setAnalysisResults] = React.useState<Record<string, AIAnalysisResult>>({});

    const handleAnalyze = async (place: PlaceResult) => {
        if (expandedIds.includes(place.placeId) && analysisResults[place.placeId]) {
            setExpandedIds(prev => prev.filter(id => id !== place.placeId));
            return;
        }

        if (!expandedIds.includes(place.placeId)) {
            setExpandedIds(prev => [...prev, place.placeId]);
        }

        if (!analysisResults[place.placeId]) {
            setAnalyzing(prev => ({ ...prev, [place.placeId]: true }));
            const result = await analyzeRestaurant(place.name, place.website || "", place.rating.toString());
            setAnalysisResults(prev => ({ ...prev, [place.placeId]: result }));
            setAnalyzing(prev => ({ ...prev, [place.placeId]: false }));
        }
    };
    if (isLoading && !data) {
        return <SkeletonPanel />;
    }

    if (!data) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-24 h-24 rounded-full bg-white/40 backdrop-blur-sm mb-4 flex items-center justify-center shadow-lg border border-white/30"
                >
                    <Grid size={40} className="text-slate-400" />
                </motion.div>
                <h3 className="text-lg font-medium text-slate-700">Start Prospecting</h3>
                <p className="max-w-md mt-2 text-slate-600">Define your territory and target criteria. We'll identify independent restaurants and score them on Owner.com fit.</p>
            </div>
        );
    }

    const chartData = Object.entries(data.breakdownByType).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
        value
    }));

    const COLORS = ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc'];

    // Calculate some insights for the summary
    const fitPercentage = data.fitStats
        ? Math.round((data.fitStats.highFitCount / data.totalCount) * 100)
        : 0;

    return (
        <div className="flex-1 flex flex-col bg-transparent h-full overflow-hidden relative">
            {/* Header */}
            <div className="bg-white/40 border-b border-white/20 px-8 py-6 flex justify-between items-center shadow-sm z-10 backdrop-blur-md">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">
                        {data.totalCount.toLocaleString()} <span className="text-slate-400 font-normal text-lg">Restaurants Found</span>
                    </h2>
                    <div className="flex gap-4 text-sm text-slate-500 mt-2">
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                            {data.fitStats?.avgScore || 0} Avg Fit Score
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            {data.fitStats?.highFitCount} High Fit Prospects
                        </span>
                    </div>
                </div>

                <div className="flex gap-3">
                    {data.insightType === InsightType.PLACES && (
                        <button
                            onClick={() => data.places && exportToCSV(data.places)}
                            className="flex items-center gap-2 px-4 py-2 bg-white/50 border border-white/40 text-slate-700 rounded-lg hover:bg-white/70 text-sm font-medium transition-colors backdrop-blur-sm shadow-sm"
                        >
                            <Download size={16} /> Export Leads
                        </button>
                    )}

                    {data.insightType === InsightType.COUNT && data.totalCount > 0 && (
                        <button
                            onClick={onFetchPlaces}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium shadow-md transition-all"
                        >
                            {isLoading ? 'Scanning Sites...' : 'View Lead List'}
                            <ChevronRight size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
                {data.insightType === InsightType.COUNT && (
                    <div className="max-w-4xl mx-auto space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Insight Card 1 */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                                className="glass-card rounded-xl p-6"
                            >
                                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Market Composition</h3>
                                <div className="h-48 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                                            <Tooltip cursor={{ fill: '#f1f5f9' }} />
                                            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                                                {chartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </motion.div>
                            {/* Insight Card 2 */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                                className="glass-card rounded-xl p-6 flex flex-col justify-center items-center text-center"
                            >
                                <div className="w-16 h-16 rounded-full bg-indigo-100/50 flex items-center justify-center mb-4 backdrop-blur-sm">
                                    <span className="text-2xl font-bold text-indigo-600">{fitPercentage}%</span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-800">High Fit Opportunity</h3>
                                <p className="text-sm text-slate-500 mt-2 px-4">
                                    Based on your filters, approx. <strong>{data.fitStats?.highFitCount}</strong> restaurants are prime candidates for Owner.com (Independent, healthy rating, tech gaps detected).
                                </p>
                            </motion.div>
                        </div>
                    </div>
                )
                }

                {
                    data.insightType === InsightType.PLACES && data.places && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card rounded-xl overflow-hidden"
                        >
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-700">
                                    <thead className="bg-white/30 border-b border-white/20 text-xs uppercase font-semibold text-slate-600 backdrop-blur-sm">
                                        <tr>
                                            <th className="px-6 py-4 w-1/4">Restaurant</th>
                                            <th className="px-6 py-4">Fit Score</th>
                                            <th className="px-6 py-4">Sonic Brand 🎵</th>
                                            <th className="px-6 py-4">Tech Stack Analysis</th>
                                            <th className="px-6 py-4">Stats</th>
                                            <th className="px-6 py-4 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/20">
                                        {data.places.map((place, idx) => (
                                            <React.Fragment key={place.placeId}>
                                                <motion.tr
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className="hover:bg-white/40 transition-colors group"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-start gap-3">
                                                            <div>
                                                                <div className="font-bold text-slate-900 flex items-center gap-2">
                                                                    {place.name}
                                                                    {place.fit.isIndependent && (
                                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">INDIE</span>
                                                                    )}
                                                                </div>
                                                                <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[180px]">{place.address}</div>
                                                                <div className="flex gap-2 mt-2">
                                                                    {place.website && (
                                                                        <a href={place.website} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                                                            <ExternalLink size={10} /> Website
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-lg font-bold ${place.fit.score >= 80 ? 'text-emerald-600' : place.fit.score >= 50 ? 'text-amber-500' : 'text-slate-400'}`}>
                                                                    {place.fit.score}
                                                                </span>
                                                                <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full rounded-full ${place.fit.score >= 80 ? 'bg-emerald-500' : place.fit.score >= 50 ? 'bg-amber-400' : 'bg-slate-300'}`}
                                                                        style={{ width: `${place.fit.score}%` }}
                                                                    ></div>
                                                                </div>
                                                            </div>
                                                            <span className="text-[10px] text-slate-500 font-medium">{place.fit.reason}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-sm font-bold ${place.sonicBrand?.sonicBrandScore && place.sonicBrand.sonicBrandScore >= 60 ? 'text-purple-600' : 'text-slate-400'}`}>
                                                                    🎵 {place.sonicBrand?.sonicBrandScore ?? 0}
                                                                </span>
                                                            </div>
                                                            <span className="text-[9px] text-slate-500 leading-tight">
                                                                {place.sonicBrand?.opportunity ?? 'Analyze...'}
                                                            </span>
                                                            {place.sonicBrand && place.sonicBrand.sonicBrandScore < 50 && (
                                                                <button className="text-[9px] text-purple-600 hover:text-purple-700 font-medium mt-1">
                                                                    + Create Audio
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="space-y-1.5">
                                                            {/* Website */}
                                                            <div className="flex items-center gap-2 text-xs">
                                                                <Globe size={12} className="text-slate-400" />
                                                                <span className="text-slate-700">{place.techStack.websitePlatform || 'Unknown'}</span>
                                                                <span className="text-[9px] text-slate-400">({place.techStack.confidence}% conf.)</span>
                                                            </div>
                                                            {/* Ordering */}
                                                            <div className="flex items-center gap-2 text-xs">
                                                                <Smartphone size={12} className={place.techStack.hasFirstPartyOrdering ? "text-green-500" : "text-red-400"} />
                                                                <span className={place.techStack.hasFirstPartyOrdering ? "text-slate-700" : "text-red-600 font-medium"}>
                                                                    {place.techStack.hasFirstPartyOrdering ? '1P Ordering' : 'No 1P Ordering'}
                                                                </span>
                                                            </div>
                                                            {/* Ordering Systems */}
                                                            {place.techStack.onlineOrdering.length > 0 && (
                                                                <div className="flex flex-wrap gap-1">
                                                                    {place.techStack.onlineOrdering.map(o => (
                                                                        <span key={o} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] rounded border border-blue-200">{o}</span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {/* Delivery */}
                                                            <div className="flex flex-wrap gap-1">
                                                                {place.techStack.delivery.length > 0 ? (
                                                                    place.techStack.delivery.map(d => (
                                                                        <span key={d} className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded border border-slate-200">{d}</span>
                                                                    ))
                                                                ) : (
                                                                    <span className="text-[10px] text-slate-400">No Delivery Apps</span>
                                                                )}
                                                            </div>
                                                            {/* Reservations */}
                                                            {place.techStack.reservations.length > 0 && (
                                                                <div className="flex flex-wrap gap-1">
                                                                    {place.techStack.reservations.map(r => (
                                                                        <span key={r} className="px-1.5 py-0.5 bg-purple-50 text-purple-600 text-[10px] rounded border border-purple-200">{r}</span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-xs text-slate-600 space-y-1">
                                                            <div className="font-medium">{place.rating} ★ <span className="text-slate-400 font-normal">({place.userRatingCount})</span></div>
                                                            <div>{place.priceLevel ? PRICE_LEVEL_LABELS[place.priceLevel] : '-'}</div>
                                                            <div>{place.types[0].replace('_', ' ')}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => handleAnalyze(place)}
                                                            disabled={analyzing[place.placeId]}
                                                            className={`text-xs font-medium border px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5
                                                            ${expandedIds.includes(place.placeId)
                                                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                                                    : 'text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 hover:shadow-sm'
                                                                }`}
                                                        >
                                                            {analyzing[place.placeId] ? (
                                                                <Loader2 size={12} className="animate-spin" />
                                                            ) : (
                                                                <Sparkles size={12} />
                                                            )}
                                                            {expandedIds.includes(place.placeId) ? 'Vibe Check' : 'Analyze'}
                                                        </button>
                                                    </td>
                                                </motion.tr>
                                                <AnimatePresence>
                                                    {expandedIds.includes(place.placeId) && (
                                                        <motion.tr
                                                            key="details"
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            className="bg-indigo-50/50"
                                                        >
                                                            <td colSpan={5} className="px-6 py-4">
                                                                <div className="bg-white/80 rounded-lg p-4 border border-indigo-100 shadow-sm backdrop-blur-sm">
                                                                    {analyzing[place.placeId] ? (
                                                                        <div className="flex items-center gap-3 text-sm text-indigo-600 py-2">
                                                                            <Loader2 className="animate-spin" />
                                                                            Asking Gemini to analyze {place.name}...
                                                                        </div>
                                                                    ) : analysisResults[place.placeId] && (
                                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                                            <div className="space-y-2">
                                                                                <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                                                                                    <Zap size={12} /> The Vibe
                                                                                </h4>
                                                                                <p className="text-sm font-medium text-slate-800">{analysisResults[place.placeId].vibe}</p>
                                                                                <p className="text-xs text-slate-500">{analysisResults[place.placeId].targetAudience}</p>
                                                                            </div>
                                                                            <div className="space-y-2">
                                                                                <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                                                                                    <Target size={12} /> Sales Angle
                                                                                </h4>
                                                                                <p className="text-sm text-slate-700">{analysisResults[place.placeId].usp}</p>
                                                                                <div className="flex items-center gap-2 mt-1">
                                                                                    <span className="text-xs font-bold text-slate-500">Fit Score:</span>
                                                                                    <div className="h-2 w-24 bg-slate-200 rounded-full overflow-hidden">
                                                                                        <div
                                                                                            className="h-full bg-indigo-500 rounded-full"
                                                                                            style={{ width: `${analysisResults[place.placeId].ownerFitScore}%` }}
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="space-y-2 bg-indigo-100/50 p-3 rounded border border-indigo-200/50">
                                                                                <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                                                                                    <MessageSquare size={12} /> Icebreaker Pitch
                                                                                </h4>
                                                                                <p className="text-xs italic text-slate-700">"{analysisResults[place.placeId].suggestedPitch}"</p>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </motion.tr>
                                                    )}
                                                </AnimatePresence>
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )
                }
            </div>
        </div>
    );
};

export default ResultsView;