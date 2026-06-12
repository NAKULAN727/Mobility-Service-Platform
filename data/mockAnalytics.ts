import { AnalyticsData } from "../types/analytics";

export const mockAnalyticsData: AnalyticsData = {
  overall: {
    totalBookings: 2350,
    completedRides: 2180,
    cancelledRides: 170,
    totalRevenue: 845000,
    activeDrivers: 145,
    avgRating: 4.7
  },
  trends: [
    { day: "Mon", bookings: 320 },
    { day: "Tue", bookings: 295 },
    { day: "Wed", bookings: 340 },
    { day: "Thu", bookings: 310 },
    { day: "Fri", bookings: 420 },
    { day: "Sat", bookings: 510 },
    { day: "Sun", bookings: 460 }
  ],
  peakHours: [
    { period: "Morning Peak", timeRange: "8 AM – 10 AM" },
    { period: "Evening Peak", timeRange: "5 PM – 8 PM" }
  ],
  popularDestinations: [
    { name: "Chennai Airport", count: 850 },
    { name: "Marina Beach", count: 620 },
    { name: "T Nagar", count: 480 },
    { name: "Central Station", count: 410 },
    { name: "OMR IT Expressway", count: 350 }
  ],
  drivers: [
    { id: "D1", name: "Rajesh", rating: 4.9, trips: 540, acceptance: 98, avgEta: 4 },
    { id: "D2", name: "Karthik", rating: 4.7, trips: 412, acceptance: 92, avgEta: 6 },
    { id: "D3", name: "Anita", rating: 4.8, trips: 480, acceptance: 95, avgEta: 5 },
    { id: "D4", name: "Manoj", rating: 4.5, trips: 310, acceptance: 85, avgEta: 8 },
    { id: "D5", name: "Priya", rating: 4.9, trips: 520, acceptance: 96, avgEta: 4.5 }
  ],
  sentiment: {
    positive: 72,
    neutral: 18,
    negative: 10
  }
};

// Mock user ride history for recommendations
export const mockUserHistory = [
  "Chennai Airport",
  "Chennai Airport",
  "Office",
  "Chennai Airport",
  "Marina Beach"
];
