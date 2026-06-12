import { AnalyticsData, DriverPerformance } from "../types/analytics";
import { mockAnalyticsData } from "../data/mockAnalytics";

export async function fetchAnalyticsData(): Promise<AnalyticsData> {
  // In a real app, this would aggregate data from database
  const data = { ...mockAnalyticsData };
  
  // Calculate top performer
  if (data.drivers && data.drivers.length > 0) {
    let topDriver = data.drivers[0];
    let topScore = 0;
    
    data.drivers.forEach(driver => {
      // Score logic: Rating * 100 + trips + acceptance
      const score = (driver.rating * 100) + driver.trips + driver.acceptance;
      if (score > topScore) {
        topScore = score;
        topDriver = driver;
      }
    });
    
    // Mark the top performer
    data.drivers = data.drivers.map(d => ({
      ...d,
      isTopPerformer: d.id === topDriver.id
    }));
  }

  return data;
}
