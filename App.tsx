import React, { useState, useCallback } from 'react';
import { Filter, Music } from 'lucide-react';
import SearchPanel from './components/SearchPanel';
import ResultsView from './components/ResultsView';
import MapVisualization from './components/MapVisualization';
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

const App: React.FC = () => {
  // State for search configuration
  const [area, setArea] = useState<SearchArea>({
    zipCode: '28202',
    radiusKm: 5
  });

  const [filters, setFilters] = useState<SearchFilters>({
    includedTypes: ['restaurant', 'meal_takeaway'],
    minRating: 3.8,
    maxRating: 4.8, // Avoid 5.0 typically (too few reviews) or 1.0 (bad)
    priceLevels: [PriceLevel.MODERATE, PriceLevel.EXPENSIVE],
    status: OperationalStatus.OPERATIONAL,
    independentOnly: true,
    requireNoFirstPartyOrdering: false,
    requireThirdPartyDelivery: false
  });

  // State for results
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<AggregateResponse | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  const [currentView, setCurrentView] = useState<'dashboard' | 'samples'>('dashboard');

  // Handlers
  const handleInitialSearch = useCallback(async () => {
    setIsLoading(true);
    setResults(null);
    // Auto-hide filters on mobile after search
    if (window.innerWidth < 768) {
      setShowFilters(false);
    }
    try {
      // First call is typically just a COUNT to be cost-effective
      const data = await searchPlacesAggregate(area, filters, InsightType.COUNT);
      setResults(data);
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setIsLoading(false);
    }
  }, [area, filters]);

  const handleFetchDetailedPlaces = useCallback(async () => {
    setIsLoading(true);
    try {
      // User explicitly requests the list (INSIGHT_PLACES)
      // This step also performs the "Tech Scan" enrichment in our mock service
      const data = await searchPlacesAggregate(area, filters, InsightType.PLACES);
      setResults(data);
    } catch (error) {
       console.error("Details fetch failed", error);
    } finally {
      setIsLoading(false);
    }
  }, [area, filters]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-900">

      {/* Show Samples Page if selected */}
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
          {/* Navigation Header */}
          <div className="fixed top-4 right-4 z-50 flex gap-2">
            <button
              onClick={() => setCurrentView('samples')}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2 font-medium"
            >
              <Music size={18} />
              Listen to Samples
            </button>
          </div>

          {/* Mobile Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden fixed top-4 left-4 z-50 bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
            aria-label="Toggle filters"
          >
            <Filter size={20} />
          </button>

      {/* Left Sidebar: Controls */}
      {showFilters && (
        <div className="fixed inset-y-0 left-0 z-40 lg:relative lg:z-10">
          <SearchPanel 
            area={area} 
            setArea={setArea}
            filters={filters}
            setFilters={setFilters}
            onSearch={handleInitialSearch}
            isLoading={isLoading}
            onCloseMobile={() => setShowFilters(false)}
          />
        </div>
      )}

      {/* Overlay for mobile when filters are open */}
      {showFilters && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setShowFilters(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 flex flex-col lg:flex-row h-full">
          
          {/* Center: Data/Results */}
          <div className="flex-1 h-1/2 lg:h-full lg:w-3/5 border-r border-slate-200">
            <ResultsView 
              data={results}
              onFetchPlaces={handleFetchDetailedPlaces}
              isLoading={isLoading}
            />
          </div>

          {/* Right: Map */}
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

export default App;