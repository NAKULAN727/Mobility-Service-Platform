"use server";

import { FareEstimate } from "../types/fare";
import { getFareExplanation } from "./gemini";

export interface CalculateFareParams {
  pickup: string;
  destination: string;
  serviceType: string;
  trafficLevel: "Normal" | "Moderate" | "High";
}

export interface FareResult {
  estimate: FareEstimate;
  explanation: string;
  distance: number;
  duration: number;
}

export async function calculateFare(params: CalculateFareParams): Promise<FareResult> {
  const { pickup, destination, serviceType, trafficLevel } = params;

  // Generate stable distance/duration using a simple hash of pickup + destination
  const key = pickup + destination;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  const distance = Math.abs(hash % 22) + 4; // 4 to 25 km
  const duration = Math.round(distance * (2 + Math.abs(hash % 2))); // 2x or 3x distance in minutes
  const route = { pickup, destination, distance, duration };

  const { distance: d, duration: dur } = route;

  // 2. Base parameters
  const DRIVER_BASE_FEE = 150; // base fee just for driver
  const VEHICLE_RENTAL_BASE = 300; // base fee for providing a vehicle
  const DRIVER_HOURLY_RATE = 100; // per hour (or ~1.6 per minute)
  const DISTANCE_RATE = 12; // per km

  // 3. Modifiers
  const trafficMultipliers = {
    "Normal": 1.0,
    "Moderate": 1.2,
    "High": 1.5
  };

  const trafficMultiplier = trafficMultipliers[trafficLevel] || 1.0;
  const experienceMultiplier = 1.1; // flat multiplier for verified drivers
  
  let estimate: FareEstimate;
  let rawTotal = 0;

  if (serviceType === "DRIVER_ONLY") {
    // Driver Only Logic: Base Driver Fee + Hours + Distance + Experience
    const timeCharge = (dur / 60) * DRIVER_HOURLY_RATE;
    const distanceCharge = d * DISTANCE_RATE * 0.5; // lower distance impact since user provides car/fuel
    rawTotal = (DRIVER_BASE_FEE + timeCharge + distanceCharge) * experienceMultiplier;
    
    estimate = {
      driverBaseFee: DRIVER_BASE_FEE,
      distanceCharge: Math.round(distanceCharge),
      timeCharge: Math.round(timeCharge),
      experienceMultiplier,
      totalFare: Math.round(rawTotal),
      distanceKm: d,
      estimatedDurationMin: dur
    };
  } else {
    // Car + Driver Logic: Vehicle Rental Base + Driver Fee + Distance + Time + Traffic + Fuel
    const timeCharge = (dur / 60) * DRIVER_HOURLY_RATE;
    const distanceCharge = d * DISTANCE_RATE;
    const fuelAdjustment = d * 2; // minor fuel surcharge
    
    rawTotal = (VEHICLE_RENTAL_BASE + DRIVER_BASE_FEE + distanceCharge + timeCharge + fuelAdjustment) * trafficMultiplier;
    
    estimate = {
      vehicleRentalBase: VEHICLE_RENTAL_BASE,
      driverBaseFee: DRIVER_BASE_FEE,
      distanceCharge: Math.round(distanceCharge),
      timeCharge: Math.round(timeCharge),
      fuelAdjustment: Math.round(fuelAdjustment),
      trafficMultiplier,
      totalFare: Math.round(rawTotal),
      distanceKm: d,
      estimatedDurationMin: dur
    };
  }

  const totalFare = Math.round(rawTotal);

  // 6. Get AI Explanation
  let explanation = "";
  try {
    const prompt = `Explain this fare estimate in simple language for a ${serviceType === "DRIVER_ONLY" ? "Driver Only" : "Car + Driver"} service.

Base Fee: ₹${estimate.driverBaseFee || 0}
${estimate.vehicleRentalBase ? `Vehicle Rental: ₹${estimate.vehicleRentalBase}` : ''}
Distance: ${d} km
Duration: ${dur} minutes
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
    distance: d,
    duration: dur
  };
}
