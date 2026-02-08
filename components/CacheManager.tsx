/**
 * Cache Manager Component
 *
 * Displays cache statistics and provides cache management controls.
 */

import React, { useEffect, useState } from 'react';
import { Database, Trash2, RefreshCw, Zap } from 'lucide-react';
import { getCache, CacheStats } from '../services/cacheService';

interface CacheManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

const formatHitRate = (rate: number): string => {
  return `${(rate * 100).toFixed(1)}%`;
};

export const CacheStatsPanel: React.FC = () => {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const cache = getCache();
      const cacheStats = await cache.getStats();
      setStats(cacheStats);
    } catch (error) {
      console.error('Failed to load cache stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    // Refresh stats every 5 seconds
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) {
    return (
      <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-white/20">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Loading cache stats...
        </div>
      </div>
    );
  }

  const totalRequests = stats.hits + stats.misses;
  const hitRateColor = stats.hitRate >= 0.8 ? 'text-green-600' : stats.hitRate >= 0.5 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-white/20 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-indigo-600" />
          <span className="text-sm font-semibold text-slate-700">Cache Statistics</span>
        </div>
        <button
          onClick={loadStats}
          disabled={isLoading}
          className="p-1 hover:bg-white/50 rounded transition-colors"
          title="Refresh stats"
        >
          <RefreshCw className={`w-4 h-4 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="space-y-1">
          <div className="text-slate-500">Hit Rate</div>
          <div className={`text-lg font-bold ${hitRateColor}`}>
            {formatHitRate(stats.hitRate)}
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-slate-500">Total Requests</div>
          <div className="text-lg font-bold text-slate-700">
            {totalRequests.toLocaleString()}
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-slate-500">Cache Hits</div>
          <div className="text-sm font-semibold text-green-600">
            {stats.hits.toLocaleString()}
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-slate-500">Cache Misses</div>
          <div className="text-sm font-semibold text-red-600">
            {stats.misses.toLocaleString()}
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-slate-500">Memory Entries</div>
          <div className="text-sm font-semibold text-slate-700">
            {stats.memoryEntries}
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-slate-500">IndexedDB Entries</div>
          <div className="text-sm font-semibold text-slate-700">
            {stats.indexedDBEntries.toLocaleString()}
          </div>
        </div>

        <div className="space-y-1 col-span-2">
          <div className="text-slate-500">Total Storage</div>
          <div className="text-sm font-semibold text-slate-700">
            {formatBytes(stats.totalSize)}
          </div>
        </div>
      </div>

      {/* Savings estimate */}
      {totalRequests > 0 && stats.hits > 0 && (
        <div className="pt-2 border-t border-slate-200">
          <div className="flex items-center gap-2 text-xs">
            <Zap className="w-3 h-3 text-yellow-500" />
            <span className="text-slate-600">
              Saved <strong>{stats.hits.toLocaleString()}</strong> API calls
              (~${(stats.hits * 0.005).toFixed(2)})
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export const CacheManager: React.FC<CacheManagerProps> = ({ isOpen, onClose }) => {
  const [isClearing, setIsClearing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const handleClearCache = async () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }

    setIsClearing(true);
    try {
      const cache = getCache();
      await cache.clear();
      setConfirmClear(false);
      // Force reload to reset stats
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      console.error('Failed to clear cache:', error);
      setIsClearing(false);
      setConfirmClear(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            Cache Management
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <p className="text-sm text-slate-600">
          OwnerScout uses intelligent caching to reduce API costs and improve performance.
          Cached data includes restaurant details, tech stack analysis, and more.
        </p>

        <CacheStatsPanel />

        <div className="pt-4 border-t border-slate-200 space-y-3">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
            <strong>Tip:</strong> Clear cache if you're experiencing issues or want to force fresh data.
            Cached data automatically expires after 3-30 days depending on the data type.
          </div>

          <button
            onClick={handleClearCache}
            disabled={isClearing}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              confirmClear
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {isClearing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Clearing...
              </>
            ) : confirmClear ? (
              <>
                <Trash2 className="w-4 h-4" />
                Confirm Clear Cache
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Clear Cache
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CacheManager;
