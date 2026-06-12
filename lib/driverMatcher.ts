"use server";

import { mockDrivers } from "../data/mockDrivers";
import { Driver } from "../types/driver";
import { calculateDriverScore } from "./scoringEngine";
import { getGeminiReason } from "./gemini";

export interface DriverRecommendation {
  driver: Driver;
  score: number;
  reason: string;
}

export async function getTopDrivers(bookingDetails: any): Promise<DriverRecommendation[]> {
  // 1. Filter unavailable drivers
  const availableDrivers = mockDrivers.filter(driver => driver.availability);

  // 2. Calculate scores
  const scoredDrivers = availableDrivers.map(driver => ({
    driver,
    score: calculateDriverScore(driver),
    reason: "" // will be populated
  }));

  // 3. Sort drivers by score (descending)
  scoredDrivers.sort((a, b) => b.score - a.score);

  // 4. Return Top 3 recommendations
  const topDrivers = scoredDrivers.slice(0, 3);

  // 5. Generate explanations (try Gemini, use fallback if it fails)
  for (const item of topDrivers) {
    try {
      // Create a simplified driver representation for the prompt
      const driverData = `Name: ${item.driver.name}, Rating: ${item.driver.rating}, ETA: ${item.driver.eta} mins, Distance: ${item.driver.distance} km, Vehicle: ${item.driver.vehicle}`;
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
      item.reason = `${item.driver.name} is recommended because they have a ${item.driver.rating} rating and are only ${item.driver.eta} mins away.`;
    }
  }

  return topDrivers;
}
