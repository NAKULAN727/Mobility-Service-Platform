export interface OverallStats {
  totalBookings: number;
  completedRides: number;
  cancelledRides: number;
  totalRevenue: number;
  activeDrivers: number;
  avgRating: number;
}

export interface BookingTrend {
  day: string;
  bookings: number;
}

export interface PeakHour {
  period: string;
  timeRange: string;
}

export interface PopularDestination {
  name: string;
  count: number;
}

export interface DriverPerformance {
  id: string;
  name: string;
  rating: number;
  trips: number;
  acceptance: number;
  avgEta: number;
  isTopPerformer?: boolean;
}

export interface SentimentStats {
  positive: number;
  neutral: number;
  negative: number;
}

export interface AnalyticsData {
  overall: OverallStats;
  trends: BookingTrend[];
  peakHours: PeakHour[];
  popularDestinations: PopularDestination[];
  drivers: DriverPerformance[];
  sentiment: SentimentStats;
}

export interface SmartRecommendation {
  type: "habit" | "offer";
  title: string;
  description: string;
  actionText: string;
}
