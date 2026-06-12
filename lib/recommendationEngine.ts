"use server";

import { SmartRecommendation } from "../types/analytics";
import { mockUserHistory } from "../data/mockAnalytics";

export async function generateRecommendations(): Promise<SmartRecommendation[]> {
  const recommendations: SmartRecommendation[] = [];

  // 1. Habit-based recommendation
  const destinationCounts: Record<string, number> = {};
  mockUserHistory.forEach(dest => {
    destinationCounts[dest] = (destinationCounts[dest] || 0) + 1;
  });

  let mostFrequent = "";
  let maxCount = 0;
  Object.keys(destinationCounts).forEach(dest => {
    if (destinationCounts[dest] > maxCount) {
      maxCount = destinationCounts[dest];
      mostFrequent = dest;
    }
  });

  if (maxCount >= 3) {
    recommendations.push({
      type: "habit",
      title: `Frequent trips to ${mostFrequent}`,
      description: `You frequently travel to ${mostFrequent}. Would you like to create a recurring booking?`,
      actionText: "Setup Recurring Ride"
    });
  }

  // 2. Promotional Offer
  const totalRidesThisMonth = mockUserHistory.length; // Just using the mock length
  if (totalRidesThisMonth >= 5) {
    recommendations.push({
      type: "offer",
      title: "Loyalty Discount Unlocked",
      description: `You have completed ${totalRidesThisMonth} rides this month. Unlock a loyalty discount on your next booking.`,
      actionText: "Claim Discount"
    });
  } else {
    recommendations.push({
      type: "offer",
      title: "Weekend Special",
      description: "Premium rides are 15% off this weekend. Upgrade today and save.",
      actionText: "View Offers"
    });
  }

  return recommendations;
}
