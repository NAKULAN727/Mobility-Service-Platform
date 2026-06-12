"use server";

import { mockAnalyticsData } from "../data/mockAnalytics";

export async function generateMockBookingId(): Promise<string> {
  return `DM${Math.floor(10000 + Math.random() * 90000)}`;
}

export async function markRideAsCompletedIntegration(fareAmount: number): Promise<void> {
  // Simulate updating the analytics dashboard automatically
  mockAnalyticsData.overall.totalBookings += 1;
  mockAnalyticsData.overall.completedRides += 1;
  mockAnalyticsData.overall.totalRevenue += fareAmount;
  
  console.log("Mock Analytics Updated. New Total Bookings:", mockAnalyticsData.overall.totalBookings);
}

export async function saveReviewIntegration(sentiment: "Positive" | "Neutral" | "Negative"): Promise<void> {
  // Simulate updating review analytics
  if (sentiment === "Positive") mockAnalyticsData.sentiment.positive += 1;
  if (sentiment === "Neutral") mockAnalyticsData.sentiment.neutral += 1;
  if (sentiment === "Negative") mockAnalyticsData.sentiment.negative += 1;
  
  console.log("Mock Review Analytics Updated.");
}
