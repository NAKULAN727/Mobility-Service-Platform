import { Driver } from "../types/driver";

export const mockDrivers: Driver[] = [
  {
    id: "D001",
    name: "Rajesh",
    rating: 4.9,
    distance: 1.2,
    eta: 4,
    availability: true,
    acceptanceRate: 98,
    vehicle: "Sedan"
  },
  {
    id: "D002",
    name: "Karthik",
    rating: 4.7,
    distance: 2.5,
    eta: 7,
    availability: true,
    acceptanceRate: 95,
    vehicle: "SUV"
  },
  {
    id: "D003",
    name: "Priya",
    rating: 4.8,
    distance: 0.8,
    eta: 2,
    availability: false,
    acceptanceRate: 92,
    vehicle: "Hatchback"
  },
  {
    id: "D004",
    name: "Suresh",
    rating: 4.5,
    distance: 3.1,
    eta: 9,
    availability: true,
    acceptanceRate: 88,
    vehicle: "Sedan"
  },
  {
    id: "D005",
    name: "Anita",
    rating: 5.0,
    distance: 1.5,
    eta: 5,
    availability: true,
    acceptanceRate: 100,
    vehicle: "Luxury"
  },
  {
    id: "D006",
    name: "Manoj",
    rating: 4.2,
    distance: 0.5,
    eta: 2,
    availability: true,
    acceptanceRate: 80,
    vehicle: "Hatchback"
  }
];
