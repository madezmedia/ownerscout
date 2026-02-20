import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Bookmark, Play, Trash2, Clock, Database, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchArea, SearchFilters } from '../types';
import { getAuthToken } from '../services/authService';

interface SavedSearch {
  id: string;
  name: string;
  zip_code: string;
  radius_km: number;
  filters: SearchFilters;
  has_cached_result: boolean;
  last_run_at: string | null;
  created_at: string;
}

interface SavedSearchesProps {
  currentArea: SearchArea;
  currentFilters: SearchFilters;
  onLoadSearch: (area: SearchArea, filters: SearchFilters) => void;
}

const SavedSearches: React.FC<SavedSearchesProps> = ({
  currentArea,
  currentFilters,
  onLoadSearch,
}) => {
  const { getToken } = useAuth();
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSearches = async () => {
    try {
      const token = await getAuthToken(getToken);
      const res = await fetch('/api/saved-searches', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load saved searches');
      const data = await res.json();
      setSearches(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSearches();
  }, []);

  const handleSave = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const token = await getAuthToken(getToken);
      const res = await fetch('/api/saved-searches', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newName.trim(),
          zipCode: currentArea.zipCode,
          radiusKm: currentArea.radiusKm,
          filters: currentFilters,
        }),
      });
      if (!res.ok) throw new Error('Failed to save search');
      setNewName('');
      setShowSaveForm(false);
      fetchSearches();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = await getAuthToken(getToken);
      await fetch(`/api/saved-searches?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setSearches((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return 'Never run';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-white/60 backdrop-blur-sm border border-white/40 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Bookmark size={15} className="text-indigo-500" />
          Saved Searches
        </h3>
        <button
          onClick={() => setShowSaveForm((v) => !v)}
          className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg transition-colors"
        >
          <Plus size={12} />
          Save current
        </button>
      </div>

      {/* Save form */}
      <AnimatePresence>
        {showSaveForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-3"
          >
            <div className="flex gap-2 pt-1">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                placeholder="Search name…"
                className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
              />
              <button
                onClick={handleSave}
                disabled={saving || !newName.trim()}
                className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {saving ? '…' : 'Save'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : searches.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-4">
          No saved searches yet. Save your current filters to quickly re-run them.
        </p>
      ) : (
        <div className="space-y-2">
          {searches.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-2 bg-white/80 border border-slate-100 rounded-xl px-3 py-2 group hover:border-indigo-200 hover:bg-indigo-50/30 transition-all"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{s.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-400">
                    {s.zip_code} · {s.radius_km}km
                  </span>
                  {s.has_cached_result && (
                    <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                      <Database size={9} />
                      cached
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onLoadSearch({ zipCode: s.zip_code, radiusKm: s.radius_km }, s.filters)}
                  className="p-1.5 rounded-lg hover:bg-indigo-100 text-indigo-600 transition-colors"
                  title="Load this search"
                >
                  <Play size={13} />
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedSearches;
