export interface FareEstimate {
    driverBaseFee?: number;
    vehicleRentalBase?: number;
    distanceCharge: number;
    timeCharge: number;
    trafficMultiplier?: number;
    fuelAdjustment?: number;
    experienceMultiplier?: number;
    totalFare: number;
    distanceKm: number;
    estimatedDurationMin: number;
}
