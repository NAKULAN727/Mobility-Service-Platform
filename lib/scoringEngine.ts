import { Driver } from "../types/driver";

export function calculateDriverScore(driver: Driver, serviceType?: string): number {
  // Dynamic Weights based on Service Type
  let RATING_WEIGHT = 0.40;
  let DISTANCE_WEIGHT = 0.25;
  let ETA_WEIGHT = 0.20;
  let ACCEPTANCE_WEIGHT = 0.15;

  if (serviceType === "DRIVER_ONLY") {
    // For Driver Only: heavily weight rating and distance (experience is key)
    RATING_WEIGHT = 0.50;
    DISTANCE_WEIGHT = 0.30;
    ETA_WEIGHT = 0.10;
    ACCEPTANCE_WEIGHT = 0.10;
  } else if (serviceType === "CAR_WITH_DRIVER") {
    // For Car + Driver: heavily weight ETA and Vehicle availability
    RATING_WEIGHT = 0.30;
    DISTANCE_WEIGHT = 0.20;
    ETA_WEIGHT = 0.40;
    ACCEPTANCE_WEIGHT = 0.10;
  }

  // Max expected values for normalization
  const MAX_RATING = 5.0;
  const MAX_DISTANCE = 10.0; // Assume anything over 10km gets 0 score for distance
  const MAX_ETA = 20.0; // Assume anything over 20 mins gets 0 score for ETA
  const MAX_ACCEPTANCE = 100.0;

  // Rating Score (Higher is better)
  const ratingScore = (driver.rating / MAX_RATING) * 100;

  // Distance Score (Lower is better)
  const distanceScore = Math.max(0, ((MAX_DISTANCE - driver.distance) / MAX_DISTANCE) * 100);

  // ETA Score (Lower is better)
  const etaScore = Math.max(0, ((MAX_ETA - driver.eta) / MAX_ETA) * 100);

  // Acceptance Score (Higher is better)
  const acceptanceScore = (driver.acceptanceRate / MAX_ACCEPTANCE) * 100;

  // Final Weighted Score
  const score = (
    (RATING_WEIGHT * ratingScore) +
    (DISTANCE_WEIGHT * distanceScore) +
    (ETA_WEIGHT * etaScore) +
    (ACCEPTANCE_WEIGHT * acceptanceScore)
  );

  return Math.min(100, Math.max(0, Math.round(score)));
}
