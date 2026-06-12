export interface Booking {
  pickup: string | null;
  destination: string | null;
  date: string | null;
  time: string | null;
  rideType: string | null;
  passengers: number;
  specialRequests: string | null;
}
