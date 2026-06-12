import { Driver } from "../types/driver";

export function calculateDriverScore(driver: Driver): number {
  // Weights
  const RATING_WEIGHT = 0.40;
  const DISTANCE_WEIGHT = 0.25;
  const ETA_WEIGHT = 0.20;
  const ACCEPTANCE_WEIGHT = 0.15;

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
