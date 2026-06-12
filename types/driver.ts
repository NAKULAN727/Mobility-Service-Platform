export interface Driver {
  id: string;
  fullName?: string;
  name?: string;
  rating: number;
  distance: number;
  eta: number;
  acceptanceRate: number;
  experienceYears?: number;
  driverType?: "DRIVER_ONLY" | "DRIVER_WITH_VEHICLE";
  ownsVehicle?: boolean;
  vehicle?: string;
  availability?: boolean;
}
