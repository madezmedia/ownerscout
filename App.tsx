import React, { useState, useCallback } from 'react';
import SearchPanel from './components/SearchPanel';
import ResultsView from './components/ResultsView';
import MapVisualization from './components/MapVisualization';
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

  // Handlers
  const handleInitialSearch = useCallback(async () => {
    setIsLoading(true);
    setResults(null);
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
      
      {/* Left Sidebar: Controls */}
      <SearchPanel 
        area={area} 
        setArea={setArea}
        filters={filters}
        setFilters={setFilters}
        onSearch={handleInitialSearch}
        isLoading={isLoading}
      />

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
      
    </div>
  );
};

export default App;