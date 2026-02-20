import React, { useState, useCallback } from 'react';
import { useAuth, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { Filter, Music } from 'lucide-react';
import SearchPanel from './components/SearchPanel';
import ResultsView from './components/ResultsView';
import MapVisualization from './components/MapVisualization';
import SavedSearches from './components/SavedSearches';
import UserMenu from './components/UserMenu';
import { SamplesPage } from './pages/SamplesPage';
import {
  SearchArea,
  SearchFilters,
  AggregateResponse,
  InsightType,
  PriceLevel,
  OperationalStatus
} from './types';
import { searchPlacesAggregate } from './services/placesService';

// ─── Dashboard (only rendered when signed in) ────────────────────────────────
const Dashboard: React.FC = () => {
  const { getToken } = useAuth();

  const [area, setArea] = useState<SearchArea>({
    zipCode: '28202',
    radiusKm: 5
  });

  const [filters, setFilters] = useState<SearchFilters>({
    includedTypes: ['restaurant', 'meal_takeaway'],
    minRating: 3.8,
    maxRating: 4.8,
    priceLevels: [PriceLevel.MODERATE, PriceLevel.EXPENSIVE],
    status: OperationalStatus.OPERATIONAL,
    independentOnly: true,
    requireNoFirstPartyOrdering: false,
    requireThirdPartyDelivery: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<AggregateResponse | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  const [currentView, setCurrentView] = useState<'dashboard' | 'samples'>('dashboard');

  const handleInitialSearch = useCallback(async () => {
    setIsLoading(true);
    setResults(null);
    if (window.innerWidth < 768) setShowFilters(false);
    try {
      const token = await getToken();
      const data = await searchPlacesAggregate(area, filters, InsightType.COUNT, token ?? undefined);
      setResults(data);
    } catch (error) {
      console.error('Search failed', error);
    } finally {
      setIsLoading(false);
    }
  }, [area, filters, getToken]);

  const handleFetchDetailedPlaces = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      const data = await searchPlacesAggregate(area, filters, InsightType.PLACES, token ?? undefined);
      setResults(data);
    } catch (error) {
      console.error('Details fetch failed', error);
    } finally {
      setIsLoading(false);
    }
  }, [area, filters, getToken]);

  const handleLoadSavedSearch = useCallback((savedArea: SearchArea, savedFilters: SearchFilters) => {
    setArea(savedArea);
    setFilters(savedFilters);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-900">

      {/* Samples Page */}
      {currentView === 'samples' ? (
        <div className="w-full h-full overflow-auto">
          <div className="fixed top-4 left-4 z-50">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2 font-medium"
            >
              ← Back to Dashboard
            </button>
          </div>
          <SamplesPage />
        </div>
      ) : (
        <>
          {/* Top-right nav */}
          <div className="fixed top-4 right-4 z-50 flex gap-2 items-center">
            <button
              onClick={() => setCurrentView('samples')}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2 font-medium"
            >
              <Music size={18} />
              <span className="hidden sm:inline">Listen to Samples</span>
            </button>
            <UserMenu />
          </div>

          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden fixed top-4 left-4 z-50 bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
            aria-label="Toggle filters"
          >
            <Filter size={20} />
          </button>

          {/* Left Sidebar */}
          {showFilters && (
            <div className="fixed inset-y-0 left-0 z-40 lg:relative lg:z-10 flex flex-col w-full md:w-96 shrink-0">
              <SearchPanel
                area={area}
                setArea={setArea}
                filters={filters}
                setFilters={setFilters}
                onSearch={handleInitialSearch}
                isLoading={isLoading}
                onCloseMobile={() => setShowFilters(false)}
              />
              {/* Saved Searches panel below search */}
              <div className="px-3 pb-3 bg-white/30 backdrop-blur-sm border-t border-white/20 overflow-y-auto">
                <SavedSearches
                  currentArea={area}
                  currentFilters={filters}
                  onLoadSearch={handleLoadSavedSearch}
                />
              </div>
            </div>
          )}

          {/* Mobile overlay */}
          {showFilters && (
            <div
              className="lg:hidden fixed inset-0 bg-black/50 z-30"
              onClick={() => setShowFilters(false)}
            />
          )}

          {/* Main Content */}
          <main className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 flex flex-col lg:flex-row h-full">
              <div className="flex-1 h-1/2 lg:h-full lg:w-3/5 border-r border-slate-200">
                <ResultsView
                  data={results}
                  onFetchPlaces={handleFetchDetailedPlaces}
                  isLoading={isLoading}
                />
              </div>
              <div className="h-1/2 lg:h-full lg:w-2/5 relative hidden md:block">
                <MapVisualization data={results} />
              </div>
            </div>
          </main>
        </>
      )}
    </div>
  );
};

// ─── Root: gate access with Clerk ────────────────────────────────────────────
const App: React.FC = () => (
  <>
    <SignedIn>
      <Dashboard />
    </SignedIn>
    <SignedOut>
      <RedirectToSignIn />
    </SignedOut>
  </>
);

export default App;
