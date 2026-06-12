import {
  VehicleType,
  AvailabilityStatus,
  BookingType,
  BookingStatus,
  PaymentMethod,
  PaymentStatus,
} from "@prisma/client";
import { GraphQLError } from "graphql";
import { GraphQLContext, requireAuth, requireRole } from "../lib/auth";

// --- VALIDATION HELPERS ---

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;
const VEHICLE_PLATE_REGEX = /^[A-Z0-9-]{3,12}$/i;

function validateBookingInput(input: BookingCreateInput) {
  const errors: Array<{ field: string[]; message: string; code: string }> = [];

  if (input.distance <= 0)
    errors.push({ field: ["distance"], message: "Distance must be a positive number greater than zero", code: "VALIDATION_FAILED" });

  if (input.estimatedDuration <= 0)
    errors.push({ field: ["estimatedDuration"], message: "Estimated duration must be greater than zero minutes", code: "VALIDATION_FAILED" });

  if (input.fareAmount <= 0)
    errors.push({ field: ["fareAmount"], message: "Fare amount must be a positive value", code: "VALIDATION_FAILED" });

  if (isNaN(Date.parse(input.bookingDate)))
    errors.push({ field: ["bookingDate"], message: "Booking date must be a valid ISO Date format (YYYY-MM-DD)", code: "INVALID_INPUT" });

  if (!TIME_REGEX.test(input.bookingTime))
    errors.push({ field: ["bookingTime"], message: "Booking time must be in HH:MM or HH:MM:SS 24-hour format", code: "INVALID_INPUT" });

  if (!input.pickupLocation?.trim())
    errors.push({ field: ["pickupLocation"], message: "Pickup location is required", code: "VALIDATION_FAILED" });

  if (!input.destinationLocation?.trim())
    errors.push({ field: ["destinationLocation"], message: "Destination location is required", code: "VALIDATION_FAILED" });

  return errors;
}

function validateVehicleInput(input: { vehicleNumber: string; seatingCapacity: number }) {
  const errors: Array<{ field: string[]; message: string; code: string }> = [];

  if (!VEHICLE_PLATE_REGEX.test(input.vehicleNumber))
    errors.push({ field: ["vehicleNumber"], message: "Vehicle number must be a valid alphanumeric registration plate code (3-12 characters)", code: "INVALID_INPUT" });

  if (input.seatingCapacity <= 0)
    errors.push({ field: ["seatingCapacity"], message: "Seating capacity must be a positive integer greater than zero", code: "VALIDATION_FAILED" });

  return errors;
}

// --- TYPED INPUT INTERFACES ---

interface BookingCreateInput {
  customerId: string;
  bookingType: BookingType;
  vehicleId?: string;
  pickupLocation: string;
  destinationLocation: string;
  distance: number;
  estimatedDuration: number;
  bookingDate: string;
  bookingTime: string;
  fareAmount: number;
}

interface VehicleCreateInput {
  vehicleNumber: string;
  vehicleType: VehicleType;
  model: string;
  seatingCapacity: number;
  availabilityStatus?: AvailabilityStatus;
}

interface VehicleUpdateInput {
  vehicleNumber?: string;
  vehicleType?: VehicleType;
  model?: string;
  seatingCapacity?: number;
  availabilityStatus?: AvailabilityStatus;
}

interface PaymentCreateInput {
  bookingId: string;
  amount: number;
  paymentMethod: PaymentMethod;
}

// --- RESOLVERS IMPLEMENTATION ---

export const resolvers = {
  Query: {
    // 1. Retrieve available vehicles
    getAvailableVehicles: async (
      _: any,
      args: { type?: VehicleType; minCapacity?: number; limit?: number; offset?: number },
      context: GraphQLContext
    ) => {
      const { prisma } = context;
      const whereClause: any = {};

      if (!context.user || context.user.role === "CUSTOMER" || context.user.role === "DRIVER") {
        whereClause.availabilityStatus = AvailabilityStatus.AVAILABLE;
      }
      if (args.type) whereClause.vehicleType = args.type;
      if (args.minCapacity) whereClause.seatingCapacity = { gte: args.minCapacity };

      return prisma.vehicle.findMany({
        where: whereClause,
        take: Math.min(args.limit ?? 10, 100),
        skip: Math.max(args.offset ?? 0, 0),
        orderBy: { model: "asc" },
      });
    },

    // 2. Retrieve single vehicle by ID
    getVehicleById: async (_: any, args: { id: string }, context: GraphQLContext) => {
      return context.prisma.vehicle.findUnique({ where: { id: args.id } });
    },

    // 3. Retrieve single booking by ID
    getBookingById: async (_: any, args: { id: string }, context: GraphQLContext) => {
      const user = requireAuth(context);

      const booking = await context.prisma.booking.findUnique({
        where: { id: args.id },
        include: { location: true, payment: true },
      });

      if (!booking) {
        throw new GraphQLError("Booking not found", { extensions: { code: "NOT_FOUND" } });
      }

      if (
        (user.role === "CUSTOMER" && booking.customerId !== user.userId) ||
        (user.role === "DRIVER" && booking.driverId !== user.userId)
      ) {
        throw new GraphQLError("You are not authorized to view this booking", {
          extensions: { code: "FORBIDDEN" },
        });
      }

      return booking;
    },

    // 4. Paginated booking history (Relay spec)
    getBookingHistory: async (
      _: any,
      args: { customerId: string; first?: number; after?: string; last?: number; before?: string },
      context: GraphQLContext
    ) => {
      const { prisma } = context;
      const user = requireAuth(context);

      if (user.role === "CUSTOMER" && args.customerId !== user.userId) {
        throw new GraphQLError("You are not authorized to view this customer's history", {
          extensions: { code: "FORBIDDEN" },
        });
      }

      let cursorId: string | undefined;
      if (args.after) cursorId = Buffer.from(args.after, "base64").toString("utf-8");
      else if (args.before) cursorId = Buffer.from(args.before, "base64").toString("utf-8");

      const takeCount = Math.min(args.first ?? args.last ?? 10, 50);
      const isReverse = !!args.last;

      const bookings = await prisma.booking.findMany({
        where: { customerId: args.customerId },
        take: takeCount + 1,
        cursor: cursorId ? { id: cursorId } : undefined,
        skip: cursorId ? 1 : 0,
        orderBy: { createdAt: isReverse ? "asc" : "desc" },
        include: { location: true, payment: true },
      });

      const hasMore = bookings.length > takeCount;
      if (hasMore) bookings.pop();

      const edges = bookings.map((b: any) => ({
        node: b,
        cursor: Buffer.from(b.id).toString("base64"),
      }));

      const totalCount = await prisma.booking.count({ where: { customerId: args.customerId } });

      return {
        edges,
        pageInfo: {
          hasNextPage: !isReverse ? hasMore : false,
          hasPreviousPage: isReverse ? hasMore : false,
          startCursor: edges.length > 0 ? edges[0].cursor : null,
          endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
        },
        totalCount,
      };
    },

    // 5. Admin: all bookings
    getAllBookings: async (_: any, args: { limit?: number; offset?: number }, context: GraphQLContext) => {
      requireRole(context, ["ADMIN", "FLEET_MANAGER"]);
      return context.prisma.booking.findMany({
        take: Math.min(args.limit ?? 20, 100),
        skip: Math.max(args.offset ?? 0, 0),
        orderBy: { createdAt: "desc" },
        include: { location: true, payment: true },
      });
    },

    // 6. Payment details for a booking
    getPaymentDetails: async (_: any, args: { bookingId: string }, context: GraphQLContext) => {
      requireAuth(context);
      return context.prisma.payment.findUnique({ where: { bookingId: args.bookingId } });
    },

    // 7. AI-facing: estimate fare before booking
    estimateFare: async (
      _: any,
      args: { distanceKm: number; vehicleType: string; bookingType: string },
      context: GraphQLContext
    ) => {
      const RATES: Record<string, number> = { SEDAN: 3.5, SUV: 4.2, LUXURY: 5.8, VAN: 5.0, HATCHBACK: 2.8 };
      const BASE = 5;
      const SERVICE_PCT = 0.05;
      const distKm = Number(args.distanceKm);
      const ratePerKm = args.bookingType === "VEHICLE_AND_DRIVER"
        ? (RATES[args.vehicleType.toUpperCase()] ?? 3.5)
        : 2.0;
      const distanceFare = parseFloat((distKm * ratePerKm).toFixed(2));
      const serviceFee = parseFloat(((BASE + distanceFare) * SERVICE_PCT).toFixed(2));
      const totalFare = parseFloat((BASE + distanceFare + serviceFee).toFixed(2));
      const estimatedDurationMin = Math.round(distKm * 2.5); // ~2.5 min/km avg
      return {
        baseFare: BASE,
        distanceFare,
        serviceFee,
        totalFare,
        ratePerKm,
        distanceKm: distKm,
        estimatedDurationMin,
        vehicleType: args.vehicleType.toUpperCase(),
        bookingType: args.bookingType,
      };
    },

    // 8. AI-facing: get all active bookings
    getActiveBookings: async (_: any, __: any, context: GraphQLContext) => {
      requireAuth(context);
      return context.prisma.booking.findMany({
        where: {
          bookingStatus: { in: ["REQUESTED", "MATCHING", "ACCEPTED", "ARRIVING", "ARRIVED", "ACTIVE"] },
        },
        orderBy: { createdAt: "desc" },
        include: { location: true, payment: true },
      });
    },
  },

  Mutation: {
    // 1. Create booking
    createBooking: async (_: any, args: { input: BookingCreateInput }, context: GraphQLContext) => {
      const { prisma } = context;
      requireRole(context, ["CUSTOMER", "ADMIN"]);

      // Explicitly extract and type all fields — no raw object spreading
      const input: BookingCreateInput = {
        customerId: String(args.input.customerId ?? "").trim(),
        bookingType: args.input.bookingType,
        vehicleId: args.input.vehicleId ? String(args.input.vehicleId).trim() : undefined,
        pickupLocation: String(args.input.pickupLocation ?? "").trim(),
        destinationLocation: String(args.input.destinationLocation ?? "").trim(),
        distance: Number(args.input.distance),
        estimatedDuration: Number(args.input.estimatedDuration),
        bookingDate: String(args.input.bookingDate ?? "").trim(),
        bookingTime: String(args.input.bookingTime ?? "").trim(),
        fareAmount: Number(args.input.fareAmount),
      };

      const validationErrors = validateBookingInput(input);
      if (validationErrors.length > 0) return { success: false, errors: validationErrors, booking: null };

      try {
        return await prisma.$transaction(async (tx: any) => {
          let selectedVehicle = null;

          if (input.bookingType === BookingType.VEHICLE_AND_DRIVER) {
            if (!input.vehicleId) {
              return {
                success: false,
                errors: [{ field: ["vehicleId"], message: "vehicleId is required for VEHICLE_AND_DRIVER bookings", code: "INVALID_INPUT" }],
                booking: null,
              };
            }

            selectedVehicle = await tx.vehicle.findUnique({ where: { id: input.vehicleId } });

            if (!selectedVehicle || selectedVehicle.availabilityStatus !== AvailabilityStatus.AVAILABLE) {
              return {
                success: false,
                errors: [{ field: ["vehicleId"], message: "Requested vehicle is not available", code: "VEHICLE_UNAVAILABLE" }],
                booking: null,
              };
            }

            await tx.vehicle.update({
              where: { id: selectedVehicle.id },
              data: { availabilityStatus: AvailabilityStatus.BOOKED },
            });
          }

          const location = await tx.location.create({
            data: {
              pickupLocation: input.pickupLocation,
              destinationLocation: input.destinationLocation,
              distance: input.distance,
              estimatedDuration: input.estimatedDuration,
            },
          });

          const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

          const booking = await tx.booking.create({
            data: {
              customerId: input.customerId,
              bookingType: input.bookingType,
              vehicleId: selectedVehicle?.id ?? null,
              locationId: location.id,
              bookingDate: new Date(input.bookingDate),
              bookingTime: input.bookingTime,
              fareAmount: input.fareAmount,
              bookingStatus: BookingStatus.REQUESTED,
              otpCode,
            },
            include: { location: true, payment: true },
          });

          return { success: true, errors: [], booking };
        });
      } catch (error) {
        return {
          success: false,
          errors: [{ field: [], message: (error as Error).message, code: "VALIDATION_FAILED" }],
          booking: null,
        };
      }
    },

    // 2. Cancel booking
    cancelBooking: async (_: any, args: { bookingId: string; reason?: string }, context: GraphQLContext) => {
      const { prisma } = context;
      const user = requireAuth(context);

      const bookingId = String(args.bookingId ?? "").trim();
      const booking = await prisma.booking.findUnique({ where: { id: bookingId } });

      if (!booking) {
        return {
          success: false,
          errors: [{ field: ["bookingId"], message: "Booking not found", code: "NOT_FOUND" }],
          booking: null,
        };
      }

      const isOwner = booking.customerId === user.userId;
      if (!isOwner && user.role !== "ADMIN" && user.role !== "FLEET_MANAGER") {
        return {
          success: false,
          errors: [{ field: [], message: "You are not authorized to cancel this booking", code: "UNAUTHORIZED" }],
          booking: null,
        };
      }

      if (booking.bookingStatus === BookingStatus.COMPLETED || booking.bookingStatus === BookingStatus.CANCELLED) {
        return {
          success: false,
          errors: [{ field: [], message: "Cannot cancel a booking that is already completed or cancelled", code: "STATE_TRANSITION_FORBIDDEN" }],
          booking: null,
        };
      }

      try {
        const updatedBooking = await prisma.$transaction(async (tx: any) => {
          if (booking.vehicleId) {
            await tx.vehicle.update({
              where: { id: booking.vehicleId },
              data: { availabilityStatus: AvailabilityStatus.AVAILABLE },
            });
          }

          const payment = await tx.payment.findUnique({ where: { bookingId: booking.id } });
          if (payment?.paymentStatus === PaymentStatus.PENDING) {
            await tx.payment.update({
              where: { id: payment.id },
              data: { paymentStatus: PaymentStatus.FAILED },
            });
          }

          return tx.booking.update({
            where: { id: booking.id },
            data: { bookingStatus: BookingStatus.CANCELLED },
            include: { location: true, payment: true },
          });
        });

        return { success: true, errors: [], booking: updatedBooking };
      } catch (error) {
        return {
          success: false,
          errors: [{ field: [], message: (error as Error).message, code: "VALIDATION_FAILED" }],
          booking: null,
        };
      }
    },

    // 3. Driver accepts booking
    acceptBooking: async (_: any, args: { bookingId: string; driverId: string }, context: GraphQLContext) => {
      const { prisma } = context;
      const user = requireRole(context, ["DRIVER", "ADMIN"]);

      const bookingId = String(args.bookingId ?? "").trim();
      const driverId = String(args.driverId ?? "").trim();

      if (user.role === "DRIVER" && driverId !== user.userId) {
        return {
          success: false,
          errors: [{ field: ["driverId"], message: "You cannot accept a booking on behalf of another driver", code: "UNAUTHORIZED" }],
          booking: null,
        };
      }

      const booking = await prisma.booking.findUnique({ where: { id: bookingId } });

      if (!booking) {
        return {
          success: false,
          errors: [{ field: ["bookingId"], message: "Booking not found", code: "NOT_FOUND" }],
          booking: null,
        };
      }

      if (booking.bookingStatus !== BookingStatus.REQUESTED && booking.bookingStatus !== BookingStatus.MATCHING) {
        return {
          success: false,
          errors: [{ field: [], message: "Booking is no longer open for acceptance", code: "STATE_TRANSITION_FORBIDDEN" }],
          booking: null,
        };
      }

      const updatedBooking = await prisma.booking.update({
        where: { id: booking.id },
        data: { driverId, bookingStatus: BookingStatus.ACCEPTED },
        include: { location: true, payment: true },
      });

      return { success: true, errors: [], booking: updatedBooking };
    },

    // 4. Start trip (validates OTP)
    startTrip: async (_: any, args: { bookingId: string; otpCode: string }, context: GraphQLContext) => {
      const { prisma } = context;
      const user = requireRole(context, ["DRIVER", "ADMIN"]);

      const bookingId = String(args.bookingId ?? "").trim();
      const otpCode = String(args.otpCode ?? "").trim();

      const booking = await prisma.booking.findUnique({ where: { id: bookingId } });

      if (!booking) {
        return {
          success: false,
          errors: [{ field: ["bookingId"], message: "Booking not found", code: "NOT_FOUND" }],
          booking: null,
        };
      }

      if (user.role === "DRIVER" && booking.driverId !== user.userId) {
        return {
          success: false,
          errors: [{ field: [], message: "You are not the assigned driver for this trip", code: "UNAUTHORIZED" }],
          booking: null,
        };
      }

      if (booking.bookingStatus !== BookingStatus.ACCEPTED) {
        return {
          success: false,
          errors: [{ field: [], message: "Trip status must be ACCEPTED to start", code: "STATE_TRANSITION_FORBIDDEN" }],
          booking: null,
        };
      }

      if (booking.otpCode !== otpCode) {
        return {
          success: false,
          errors: [{ field: ["otpCode"], message: "Invalid OTP verification code. Access Denied.", code: "VALIDATION_FAILED" }],
          booking: null,
        };
      }

      const updatedBooking = await prisma.booking.update({
        where: { id: booking.id },
        data: { bookingStatus: BookingStatus.ACTIVE, actualStartTime: new Date() },
        include: { location: true, payment: true },
      });

      return { success: true, errors: [], booking: updatedBooking };
    },

    // 5. Complete trip
    completeTrip: async (_: any, args: { bookingId: string }, context: GraphQLContext) => {
      const { prisma } = context;
      const user = requireRole(context, ["DRIVER", "ADMIN"]);

      const bookingId = String(args.bookingId ?? "").trim();

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { payment: true },
      });

      if (!booking) {
        return {
          success: false,
          errors: [{ field: ["bookingId"], message: "Booking not found", code: "NOT_FOUND" }],
          booking: null,
        };
      }

      if (user.role === "DRIVER" && booking.driverId !== user.userId) {
        return {
          success: false,
          errors: [{ field: [], message: "You are not the assigned driver for this trip", code: "UNAUTHORIZED" }],
          booking: null,
        };
      }

      if (booking.bookingStatus !== BookingStatus.ACTIVE) {
        return {
          success: false,
          errors: [{ field: [], message: "Cannot complete a trip that is not currently active", code: "STATE_TRANSITION_FORBIDDEN" }],
          booking: null,
        };
      }

      try {
        const updatedBooking = await prisma.$transaction(async (tx: any) => {
          if (booking.vehicleId) {
            await tx.vehicle.update({
              where: { id: booking.vehicleId },
              data: { availabilityStatus: AvailabilityStatus.AVAILABLE },
            });
          }

          if (booking.payment?.paymentStatus === PaymentStatus.PENDING) {
            await tx.payment.update({
              where: { id: booking.payment.id },
              data: {
                paymentStatus: PaymentStatus.SUCCESS,
                transactionId: `${booking.payment.paymentMethod}-TX-${Math.floor(100000 + Math.random() * 900000)}`,
              },
            });
          }

          return tx.booking.update({
            where: { id: booking.id },
            data: { bookingStatus: BookingStatus.COMPLETED, actualEndTime: new Date() },
            include: { location: true, payment: true },
          });
        });

        return { success: true, errors: [], booking: updatedBooking };
      } catch (error) {
        return {
          success: false,
          errors: [{ field: [], message: (error as Error).message, code: "VALIDATION_FAILED" }],
          booking: null,
        };
      }
    },

    // 6. Create payment
    createPayment: async (_: any, args: { input: PaymentCreateInput }, context: GraphQLContext) => {
      const { prisma } = context;
      requireRole(context, ["CUSTOMER", "ADMIN"]);

      const bookingId = String(args.input.bookingId ?? "").trim();
      const amount = Number(args.input.amount);
      const paymentMethod = args.input.paymentMethod;

      if (amount <= 0) {
        return {
          success: false,
          errors: [{ field: ["amount"], message: "Payment amount must be greater than zero", code: "VALIDATION_FAILED" }],
          payment: null,
        };
      }

      const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
      if (!booking) {
        return {
          success: false,
          errors: [{ field: ["bookingId"], message: "Booking not found for payment allocation", code: "NOT_FOUND" }],
          payment: null,
        };
      }

      try {
        const payment = await prisma.payment.create({
          data: {
            bookingId,
            amount,
            paymentMethod,
            paymentStatus: PaymentStatus.PENDING,
            transactionId: null,
          },
        });

        return { success: true, errors: [], payment };
      } catch (error) {
        return {
          success: false,
          errors: [{ field: [], message: (error as Error).message, code: "DUPLICATE_RESOURCE" }],
          payment: null,
        };
      }
    },

    // 7. Add vehicle
    addVehicle: async (_: any, args: { input: VehicleCreateInput }, context: GraphQLContext) => {
      const { prisma } = context;
      requireRole(context, ["ADMIN", "FLEET_MANAGER"]);

      const input: VehicleCreateInput = {
        vehicleNumber: String(args.input.vehicleNumber ?? "").trim().toUpperCase(),
        vehicleType: args.input.vehicleType,
        model: String(args.input.model ?? "").trim(),
        seatingCapacity: Number(args.input.seatingCapacity),
        availabilityStatus: args.input.availabilityStatus,
      };

      const validationErrors = validateVehicleInput(input);
      if (validationErrors.length > 0) return { success: false, errors: validationErrors, vehicle: null };

      try {
        const vehicle = await prisma.vehicle.create({
          data: {
            vehicleNumber: input.vehicleNumber,
            vehicleType: input.vehicleType,
            model: input.model,
            seatingCapacity: input.seatingCapacity,
            availabilityStatus: input.availabilityStatus ?? AvailabilityStatus.AVAILABLE,
          },
        });

        return { success: true, errors: [], vehicle };
      } catch (error) {
        return {
          success: false,
          errors: [{ field: ["vehicleNumber"], message: "Vehicle number registration already exists", code: "DUPLICATE_RESOURCE" }],
          vehicle: null,
        };
      }
    },

    // 8. Update vehicle — fixed: validates only supplied fields, no bypass
    updateVehicle: async (_: any, args: { id: string; input: VehicleUpdateInput }, context: GraphQLContext) => {
      const { prisma } = context;
      requireRole(context, ["ADMIN", "FLEET_MANAGER"]);

      const id = String(args.id ?? "").trim();
      const errors: Array<{ field: string[]; message: string; code: string }> = [];

      // Validate vehicleNumber only if it's being updated
      if (args.input.vehicleNumber !== undefined) {
        const cleaned = String(args.input.vehicleNumber).trim().toUpperCase();
        if (!VEHICLE_PLATE_REGEX.test(cleaned)) {
          errors.push({ field: ["vehicleNumber"], message: "Vehicle number must be a valid alphanumeric registration plate code (3-12 characters)", code: "INVALID_INPUT" });
        }
      }

      // Validate seatingCapacity only if it's being updated
      if (args.input.seatingCapacity !== undefined) {
        const cap = Number(args.input.seatingCapacity);
        if (!Number.isInteger(cap) || cap <= 0) {
          errors.push({ field: ["seatingCapacity"], message: "Seating capacity must be a positive integer greater than zero", code: "VALIDATION_FAILED" });
        }
      }

      if (errors.length > 0) return { success: false, errors, vehicle: null };

      // Build explicit update data — no raw spread of user input
      const updateData: Record<string, unknown> = {};
      if (args.input.vehicleNumber !== undefined) updateData.vehicleNumber = String(args.input.vehicleNumber).trim().toUpperCase();
      if (args.input.vehicleType !== undefined) updateData.vehicleType = args.input.vehicleType;
      if (args.input.model !== undefined) updateData.model = String(args.input.model).trim();
      if (args.input.seatingCapacity !== undefined) updateData.seatingCapacity = Number(args.input.seatingCapacity);
      if (args.input.availabilityStatus !== undefined) updateData.availabilityStatus = args.input.availabilityStatus;

      try {
        const vehicle = await prisma.vehicle.update({ where: { id }, data: updateData });
        return { success: true, errors: [], vehicle };
      } catch (error) {
        return {
          success: false,
          errors: [{ field: ["id"], message: "Vehicle update failed. Resource not found or unique constraint broken.", code: "NOT_FOUND" }],
          vehicle: null,
        };
      }
    },

    // 9. Delete vehicle
    deleteVehicle: async (_: any, args: { id: string }, context: GraphQLContext) => {
      const { prisma } = context;
      requireRole(context, ["ADMIN", "FLEET_MANAGER"]);

      const id = String(args.id ?? "").trim();

      try {
        const vehicle = await prisma.vehicle.delete({ where: { id } });
        return { success: true, errors: [], vehicle };
      } catch (error) {
        return {
          success: false,
          errors: [{ field: ["id"], message: "Cannot delete vehicle. It is referenced by existing bookings or does not exist.", code: "STATE_TRANSITION_FORBIDDEN" }],
          vehicle: null,
        };
      }
    },

    // 10. Update payment status
    updatePaymentStatus: async (
      _: any,
      args: { paymentId: string; status: PaymentStatus },
      context: GraphQLContext
    ) => {
      const { prisma } = context;
      requireRole(context, ["ADMIN", "DRIVER"]);

      const paymentId = String(args.paymentId ?? "").trim();

      try {
        const payment = await prisma.payment.findUnique({ where: { id: paymentId } });

        if (!payment) {
          return {
            success: false,
            errors: [{ field: ["paymentId"], message: "Payment transaction not found", code: "NOT_FOUND" }],
            payment: null,
          };
        }

        const updatedPayment = await prisma.payment.update({
          where: { id: paymentId },
          data: {
            paymentStatus: args.status,
            ...(args.status === PaymentStatus.SUCCESS && !payment.transactionId
              ? { transactionId: `${payment.paymentMethod}-TX-${Math.floor(100000 + Math.random() * 900000)}` }
              : {}),
          },
        });

        return { success: true, errors: [], payment: updatedPayment };
      } catch (error) {
        return {
          success: false,
          errors: [{ field: [], message: (error as Error).message, code: "VALIDATION_FAILED" }],
          payment: null,
        };
      }
    },
  },
};
