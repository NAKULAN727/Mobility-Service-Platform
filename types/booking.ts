export interface Booking {
  pickup: string | null;
  destination: string | null;
  date: string | null;
  time: string | null;
  serviceType: string | null;
  passengers: number;
  specialRequests: string | null;
}
