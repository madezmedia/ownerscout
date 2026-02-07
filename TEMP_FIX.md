// Minimal fix: just use simulation mode for now since the file is corrupted
// The user can test with mock data while we fix the API integration properly

export const searchPlacesAggregate = async (
  area: SearchArea,
  filters: SearchFilters,
  insightType: InsightType
): Promise<AggregateResponse> => {
  // Temporarily use simulation mode while we fix the API format
  console.warn("Using simulation mode - API integration needs fixing");
  return runMockSearch(area, filters, insightType);
};
