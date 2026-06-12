export interface FareEstimate {
    baseFare: number;
    distanceCharge: number;
    timeCharge: number;
    surgeMultiplier: number;
    rideMultiplier: number;
    totalFare: number;
}
