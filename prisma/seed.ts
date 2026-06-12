import { PrismaClient, VehicleType, AvailabilityStatus, BookingType, BookingStatus, PaymentMethod, PaymentStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning up existing database records...");
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.location.deleteMany();
  await prisma.vehicle.deleteMany();

  console.log("Seeding Vehicles...");
  const vehicle1 = await prisma.vehicle.create({
    data: {
      vehicleNumber: "TX-9988-B",
      vehicleType: VehicleType.SEDAN,
      model: "Toyota Camry Hybrid 2024",
      seatingCapacity: 4,
      availabilityStatus: AvailabilityStatus.AVAILABLE,
    },
  });

  const vehicle2 = await prisma.vehicle.create({
    data: {
      vehicleNumber: "SUV-1122-C",
      vehicleType: VehicleType.SUV,
      model: "Tesla Model X 2023",
      seatingCapacity: 6,
      availabilityStatus: AvailabilityStatus.BOOKED,
    },
  });

  const vehicle3 = await prisma.vehicle.create({
    data: {
      vehicleNumber: "LX-7777-A",
      vehicleType: VehicleType.LUXURY,
      model: "Mercedes-Benz S-Class 2024",
      seatingCapacity: 4,
      availabilityStatus: AvailabilityStatus.MAINTENANCE,
    },
  });

  const vehicle4 = await prisma.vehicle.create({
    data: {
      vehicleNumber: "VN-5544-D",
      vehicleType: VehicleType.VAN,
      model: "Ford Transit Custom 2022",
      seatingCapacity: 12,
      availabilityStatus: AvailabilityStatus.AVAILABLE,
    },
  });

  console.log("Seeding Locations (Routes)...");
  const location1 = await prisma.location.create({
    data: {
      pickupLocation: "JFK International Airport Terminal 4, NY",
      destinationLocation: "Times Square Manhattan, NY",
      distance: 28.5,
      estimatedDuration: 45,
    },
  });

  const location2 = await prisma.location.create({
    data: {
      pickupLocation: "Grand Central Terminal, NY",
      destinationLocation: "Metropolitan Museum of Art, NY",
      distance: 4.2,
      estimatedDuration: 15,
    },
  });

  const location3 = await prisma.location.create({
    data: {
      pickupLocation: "Brooklyn Bridge Park, NY",
      destinationLocation: "LaGuardia Airport Terminal B, NY",
      distance: 16.8,
      estimatedDuration: 30,
    },
  });

  console.log("Seeding Bookings...");
  // 1. Vehicle + Driver Booking (Completed)
  const booking1 = await prisma.booking.create({
    data: {
      customerId: "cust-uuid-001",
      driverId: "driver-uuid-101",
      vehicleId: vehicle1.id,
      bookingType: BookingType.VEHICLE_AND_DRIVER,
      locationId: location1.id,
      bookingDate: new Date("2026-06-10T00:00:00Z"),
      bookingTime: "08:30:00",
      fareAmount: 85.50,
      bookingStatus: BookingStatus.COMPLETED,
    },
  });

  // 2. Driver Only Booking (Active - User owns the vehicle, so vehicleId is null)
  const booking2 = await prisma.booking.create({
    data: {
      customerId: "cust-uuid-002",
      driverId: "driver-uuid-102",
      vehicleId: null,
      bookingType: BookingType.DRIVER_ONLY,
      locationId: location2.id,
      bookingDate: new Date("2026-06-12T00:00:00Z"),
      bookingTime: "14:00:00",
      fareAmount: 35.00,
      bookingStatus: BookingStatus.ACTIVE,
    },
  });

  // 3. Vehicle + Driver Booking (Requested / Matching)
  const booking3 = await prisma.booking.create({
    data: {
      customerId: "cust-uuid-003",
      driverId: null,
      vehicleId: vehicle4.id,
      bookingType: BookingType.VEHICLE_AND_DRIVER,
      locationId: location3.id,
      bookingDate: new Date("2026-06-13T00:00:00Z"),
      bookingTime: "18:15:00",
      fareAmount: 65.00,
      bookingStatus: BookingStatus.REQUESTED,
    },
  });

  console.log("Seeding Payments...");
  // Payment for Booking 1 (SUCCESS)
  await prisma.payment.create({
    data: {
      bookingId: booking1.id,
      amount: 85.50,
      paymentMethod: PaymentMethod.CARD,
      paymentStatus: PaymentStatus.SUCCESS,
      transactionId: "CARD-TX-9922883344",
    },
  });

  // Payment for Booking 2 (PENDING)
  await prisma.payment.create({
    data: {
      bookingId: booking2.id,
      amount: 35.00,
      paymentMethod: PaymentMethod.UPI,
      paymentStatus: PaymentStatus.PENDING,
      transactionId: "UPI-TX-1122334455",
    },
  });

  // Payment for Booking 3 (PENDING)
  await prisma.payment.create({
    data: {
      bookingId: booking3.id,
      amount: 65.00,
      paymentMethod: PaymentMethod.CARD,
      paymentStatus: PaymentStatus.PENDING,
      transactionId: null,
    },
  });

  console.log("Database Seeding Completed Successfully!");
}

main()
  .catch((e) => {
    console.error("Error during database seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
