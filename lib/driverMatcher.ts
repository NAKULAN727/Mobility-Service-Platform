"use server";

import prisma from "./prisma";
import { calculateDriverScore } from "./scoringEngine";
import { getGeminiReason } from "./gemini";

export interface DriverRecommendation {
  driver: any;
  score: number;
  reason: string;
}

export async function getTopDrivers(bookingDetails: any): Promise<DriverRecommendation[]> {
  // 1. Fetch available verified drivers from PostgreSQL
  const whereClause: any = {
    role: "DRIVER",
    driverProfile: {
      availabilityStatus: true,
      verificationStatus: "APPROVED"
    }
  };

  // If CAR_WITH_DRIVER, we might prioritize DRIVER_WITH_VEHICLE, but for now just get available drivers.
  // Real implementation would filter based on fleet logic.

  const availableUsers = await prisma.user.findMany({
    where: whereClause,
    include: {
      driverProfile: true
    }
  });

  // Map to the format scoringEngine expects, simulating live GPS data like ETA
  const availableDrivers = availableUsers.map(u => ({
    id: u.id,
    fullName: u.fullName, // Use fullName for chatbot orchestrator
    rating: 4.8 + (Math.random() * 0.2), // In real life, calculate average rating from Review table
    distance: Math.floor(Math.random() * 5) + 1,
    eta: Math.floor(Math.random() * 15) + 5,
    acceptanceRate: 90 + Math.floor(Math.random() * 10),
    experienceYears: u.driverProfile?.experienceYears || 1,
    driverType: u.driverProfile?.driverType || "DRIVER_ONLY"
  }));

  if (availableDrivers.length === 0) return [];

  // 2. Calculate scores
  const scoredDrivers = availableDrivers.map(driver => ({
    driver,
    score: calculateDriverScore(driver as any, bookingDetails.serviceType),
    reason: "" 
  }));

  // 3. Sort drivers by score (descending)
  scoredDrivers.sort((a, b) => b.score - a.score);

  // 4. Return Top 3 recommendations
  const topDrivers = scoredDrivers.slice(0, 3);

  // 5. Generate explanations
  for (const item of topDrivers) {
    try {
      const driverData = `Name: ${item.driver.fullName}, Rating: ${item.driver.rating.toFixed(1)}, ETA: ${item.driver.eta} mins, Distance: ${item.driver.distance} km`;
      const bookingData = JSON.stringify(bookingDetails);

      const prompt = `Given the following driver information and booking request, explain in one sentence why this driver is recommended.
Driver:
${driverData}
Booking:
${bookingData}
Keep the explanation short and user-friendly. Do not start with "This driver is recommended because". Make it sound natural, e.g. "Rajesh is recommended because..."`;

      const reason = await getGeminiReason(prompt);
      item.reason = reason;
    } catch (e) {
      console.error("Failed to fetch Gemini reason, using fallback", e);
      item.reason = `${item.driver.fullName} is recommended because they have a ${item.driver.rating.toFixed(1)} rating and are only ${item.driver.eta} mins away.`;
    }
  }

  return topDrivers;
}
