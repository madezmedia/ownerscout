import React, { useState } from 'react';
import { Search, MapPin, Filter, AlertCircle, Zap, ShieldCheck, X, Crosshair } from 'lucide-react';
import { motion } from 'framer-motion';
import { PLACE_CATEGORIES, PRICE_LEVEL_LABELS } from '../constants';
import { PriceLevel, SearchArea, SearchFilters, OperationalStatus } from '../types';
import { getZipFromCoordinates } from '../services/placesService';

interface SearchPanelProps {
  area: SearchArea;
  setArea: React.Dispatch<React.SetStateAction<SearchArea>>;
  filters: SearchFilters;
  setFilters: React.Dispatch<React.SetStateAction<SearchFilters>>;
  onSearch: () => void;
  isLoading: boolean;
  onCloseMobile?: () => void;
}

const SearchPanel: React.FC<SearchPanelProps> = ({
  area,
  setArea,
  filters,
  setFilters,
  onSearch,
  isLoading,
  onCloseMobile
}) => {
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const handleUseMyLocation = async () => {
    setIsLoadingLocation(true);
    try {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        return;
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;
      const zipCode = await getZipFromCoordinates(latitude, longitude);
      
      setArea({ ...area, zipCode });
      console.log(`📍 Location detected: ${zipCode} (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
    } catch (error) {
      console.error('Error getting location:', error);
      alert('Unable to get your location. Please enter ZIP code manually.');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const toggleType = (typeId: string) => {
    setFilters(prev => {
      const exists = prev.includedTypes.includes(typeId);
      if (exists) {
        return { ...prev, includedTypes: prev.includedTypes.filter(t => t !== typeId) };
      }
      return { ...prev, includedTypes: [...prev.includedTypes, typeId] };
    });
  };

  const togglePrice = (price: PriceLevel) => {
    setFilters(prev => {
      const exists = prev.priceLevels.includes(price);
      if (exists) {
        return { ...prev, priceLevels: prev.priceLevels.filter(p => p !== price) };
      }
      return { ...prev, priceLevels: [...prev.priceLevels, price] };
    });
  };

  return (
    <motion.div
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="h-full flex flex-col glass-panel w-full md:w-96 shrink-0 overflow-y-auto z-10 shadow-xl"
    >
      <div className="p-6 border-b border-white/20 bg-white/40 backdrop-blur-sm flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Zap className="text-indigo-600 fill-indigo-600" />
            OwnerScout
          </h1>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wide font-medium">Restaurant Prospecting</p>
        </div>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Close filters"
          >
            <X size={20} className="text-slate-600" />
          </button>
        )}
      </div>

      <div className="p-6 space-y-8 flex-1">
        {/* Location Section */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Search size={14} /> Territory
          </h2>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">ZIP Code / City</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={area.zipCode}
                onChange={(e) => setArea({ ...area, zipCode: e.target.value })}
                placeholder="e.g. 28202"
                className="flex-1 rounded-md border border-white/30 bg-white/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500 backdrop-blur-sm transition-colors"
              />
              <button
                onClick={handleUseMyLocation}
                disabled={isLoadingLocation}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md border border-indigo-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                title="Use my current location"
              >
                {isLoadingLocation ? (
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <Crosshair size={18} />
                )}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">📍 Click target icon to auto-detect your location</p>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <label className="font-medium text-slate-700">Radius</label>
              <span className="text-slate-500">{area.radiusKm} km</span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              value={area.radiusKm}
              onChange={(e) => setArea({ ...area, radiusKm: parseInt(e.target.value) })}
              className="w-full h-2 bg-slate-200/50 rounded-lg appearance-none cursor-pointer accent-indigo-600 backdrop-blur-sm"
            />
          </div>
        </section>

        {/* Lead Qualification Section */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck size={14} /> Lead Qualification
          </h2>

          <div className="bg-white/40 p-3 rounded-lg border border-white/30 space-y-3 shadow-sm backdrop-blur-sm">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.independentOnly}
                onChange={(e) => setFilters({ ...filters, independentOnly: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
              />
              <span className="text-sm font-medium text-slate-700">Independent Only</span>
            </label>
            <p className="text-xs text-slate-500 pl-7">Excludes known major chains.</p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-700">Tech Stack Gaps (Enrichment)</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.requireNoFirstPartyOrdering}
                  onChange={(e) => setFilters({ ...filters, requireNoFirstPartyOrdering: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                />
                <span className="text-sm text-slate-600">No 1st Party Ordering</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.requireThirdPartyDelivery}
                  onChange={(e) => setFilters({ ...filters, requireThirdPartyDelivery: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                />
                <span className="text-sm text-slate-600">Uses 3rd Party Delivery</span>
              </label>
            </div>
          </div>
        </section>

        {/* Filters Section */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Filter size={14} /> Restaurant Filters
          </h2>

          {/* Categories */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">Place Type</label>
            <div className="flex flex-wrap gap-2">
              {PLACE_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => toggleType(cat.id)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${filters.includedTypes.includes(cat.id)
                    ? 'bg-indigo-100 border-indigo-200 text-indigo-700 font-medium'
                    : 'bg-white/40 border-white/30 text-slate-700 hover:bg-white/60 backdrop-blur-sm'
                    }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <label className="font-medium text-slate-700">Rating Band</label>
              <span className="text-slate-500">{filters.minRating} - {filters.maxRating} ★</span>
            </div>
            <div className="flex gap-4">
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={filters.minRating}
                onChange={(e) => setFilters({ ...filters, minRating: parseFloat(e.target.value) })}
                className="w-1/2 rounded border border-slate-300 px-2 py-1 text-sm"
              />
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={filters.maxRating}
                onChange={(e) => setFilters({ ...filters, maxRating: parseFloat(e.target.value) })}
                className="w-1/2 rounded border border-slate-300 px-2 py-1 text-sm"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Target range 3.8 - 4.8 is ideal.</p>
          </div>

          {/* Price */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">Price Level</label>
            <div className="flex rounded-md shadow-sm" role="group">
              {[PriceLevel.INEXPENSIVE, PriceLevel.MODERATE, PriceLevel.EXPENSIVE, PriceLevel.VERY_EXPENSIVE].map((level, idx, arr) => (
                <button
                  key={level}
                  onClick={() => togglePrice(level)}
                  className={`flex-1 px-2 py-1.5 text-xs font-medium border
                    ${idx === 0 ? 'rounded-l-md' : ''} 
                    ${idx === arr.length - 1 ? 'rounded-r-md' : ''}
                    ${filters.priceLevels.includes(level)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white/40 text-slate-700 border-white/30 hover:bg-white/60 backdrop-blur-sm'
                    }
                  `}
                >
                  {PRICE_LEVEL_LABELS[level]}
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="p-6 border-t border-white/20 bg-white/40 backdrop-blur-md">
        <button
          onClick={onSearch}
          disabled={isLoading || filters.includedTypes.length === 0}
          className="w-full bg-indigo-600/90 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg shadow-lg hover:shadow-indigo-500/30 ring-1 ring-white/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Enriching Data...
            </>
          ) : (
            'Find Prospects'
          )}
        </button>
        <p className="text-xs text-center text-slate-400 mt-2">
          Queries Places API + Simulates Tech Scan
        </p>
      </div>
    </motion.div>
  );
};

export default SearchPanel;