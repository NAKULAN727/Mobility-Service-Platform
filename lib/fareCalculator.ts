"use server";

import { mockRoutes } from "../data/mockRoutes";
import { FareEstimate } from "../types/fare";
import { getFareExplanation } from "./gemini";

export interface CalculateFareParams {
  pickup: string;
  destination: string;
  rideType: string;
  trafficLevel: "Normal" | "Moderate" | "High";
}

export interface FareResult {
  estimate: FareEstimate;
  explanation: string;
  distance: number;
  duration: number;
}

export async function calculateFare(params: CalculateFareParams): Promise<FareResult> {
  const { pickup, destination, rideType, trafficLevel } = params;

  // 1. Find route (with normalized comparison) or dynamically generate a mock route
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const normPickup = normalize(pickup);
  const normDest = normalize(destination);

  let route = mockRoutes.find(
    r => normalize(r.pickup) === normPickup && normalize(r.destination) === normDest
  );

  if (!route) {
    // Generate stable distance/duration using a simple hash of pickup + destination
    const key = pickup + destination;
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }
    const distance = Math.abs(hash % 22) + 4; // 4 to 25 km
    const duration = Math.round(distance * (2 + Math.abs(hash % 2))); // 2x or 3x distance in minutes
    route = { pickup, destination, distance, duration };
  }

  const { distance, duration } = route;

  // 2. Base parameters
  const BASE_FARE = 50;
  const DISTANCE_RATE = 12; // per km
  const TIME_RATE = 2; // per minute

  // 3. Modifiers
  const surgeMultipliers = {
    "Normal": 1.0,
    "Moderate": 1.2,
    "High": 1.5
  };

  const rideTypeMultipliers: Record<string, number> = {
    "Standard": 1.0,
    "Premium": 1.3,
    "Luxury": 1.6
  };

  const surgeMultiplier = surgeMultipliers[trafficLevel] || 1.0;
  const rideMultiplier = rideTypeMultipliers[rideType] || 1.0;

  // 4. Calculate charges
  const distanceCharge = DISTANCE_RATE * distance;
  const timeCharge = TIME_RATE * duration;

  // 5. Calculate total
  const rawTotal = (BASE_FARE + distanceCharge + timeCharge) * surgeMultiplier * rideMultiplier;
  const totalFare = Math.round(rawTotal);

  const estimate: FareEstimate = {
    baseFare: BASE_FARE,
    distanceCharge,
    timeCharge,
    surgeMultiplier,
    rideMultiplier,
    totalFare
  };

  // 6. Get AI Explanation
  let explanation = "";
  try {
    const prompt = `Explain this fare estimate in simple language.

Base Fare: ₹${BASE_FARE}
Distance: ${distance} km
Duration: ${duration} minutes
Ride Type: ${rideType}
Surge: ${surgeMultiplier}x
Final Fare: ₹${totalFare}

Keep the explanation under 40 words.`;

    explanation = await getFareExplanation(prompt);
  } catch (e) {
    console.error("Failed to generate AI fare explanation", e);
    explanation = `The estimated fare of ₹${totalFare} is based on distance, time, and your selected ride options.`;
  }

  return {
    estimate,
    explanation,
    distance,
    duration
  };
}
