"use server";

import prisma from "./prisma";
import { SmartRecommendation } from "../types/analytics";

export async function generateRecommendations(customerId?: string): Promise<SmartRecommendation[]> {
  const recommendations: SmartRecommendation[] = [];

  if (!customerId) {
    recommendations.push({
      type: "offer",
      title: "Welcome to DriveMate",
      description: "Book your first premium ride today and get 15% off.",
      actionText: "View Offers"
    });
    return recommendations;
  }

  // 1. Habit-based recommendation
  const bookings = await prisma.booking.findMany({
    where: { customerId, bookingStatus: "TRIP_COMPLETED" },
    include: { location: true }
  });

  const destinationCounts: Record<string, number> = {};
  bookings.forEach(b => {
    if (b.location?.destinationLocation) {
      destinationCounts[b.location.destinationLocation] = (destinationCounts[b.location.destinationLocation] || 0) + 1;
    }
  });

  let mostFrequent = "";
  let maxCount = 0;
  Object.keys(destinationCounts).forEach(dest => {
    if (destinationCounts[dest] > maxCount) {
      maxCount = destinationCounts[dest];
      mostFrequent = dest;
    }
  });

  if (maxCount >= 2) {
    recommendations.push({
      type: "habit",
      title: `Frequent trips to ${mostFrequent}`,
      description: `You frequently travel to ${mostFrequent}. Would you like to create a recurring booking?`,
      actionText: "Setup Recurring Ride"
    });
  }

  // 2. Promotional Offer
  const thisMonth = new Date();
  thisMonth.setDate(1); // naive start of month
  
  const ridesThisMonth = bookings.filter(b => b.createdAt >= thisMonth).length;
  if (ridesThisMonth >= 3) {
    recommendations.push({
      type: "offer",
      title: "Loyalty Discount Unlocked",
      description: `You have completed ${ridesThisMonth} rides this month. Unlock a loyalty discount on your next booking.`,
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
