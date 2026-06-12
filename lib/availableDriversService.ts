import { DriverType, ServiceType } from "@prisma/client";
import prisma from "./prisma";

export type ServiceCapability = "DRIVER_ONLY" | "CAR_WITH_DRIVER" | "BOTH";

export interface AvailableDriverResult {
  id: string;
  userId: string;
  fullName: string;
  profileImage: string | null;
  rating: number;
  experienceYears: number;
  serviceCapability: ServiceCapability;
  canDriveCustomerVehicle: boolean;
  canProvideOwnVehicle: boolean;
  vehicle: {
    id: string;
    make: string;
    model: string;
    registrationNumber: string;
    vehicleType: string;
  } | null;
  distanceKm: number;
  etaMinutes: number;
  availabilityStatus: boolean;
  priceEstimate: number;
  locationHint: string | null;
  createdAt: string;
}

function stableHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

/** Driver can drive the customer's own vehicle (Driver Only service). */
export function canDriveCustomerVehicle(
  driverType: DriverType,
  ownsVehicle: boolean
): boolean {
  if (driverType === DriverType.DRIVER_ONLY) return true;
  // DRIVER_WITH_VEHICLE partners can also take driver-only jobs
  return driverType === DriverType.DRIVER_WITH_VEHICLE;
}

/** Driver can provide their own vehicle (Car + Driver service). */
export function canProvideOwnVehicle(
  driverType: DriverType,
  ownsVehicle: boolean,
  vehicleId: string | null | undefined
): boolean {
  return (
    driverType === DriverType.DRIVER_WITH_VEHICLE &&
    ownsVehicle &&
    !!vehicleId
  );
}

function getServiceCapability(
  driverType: DriverType,
  ownsVehicle: boolean,
  vehicleId: string | null | undefined
): ServiceCapability {
  const drives = canDriveCustomerVehicle(driverType, ownsVehicle);
  const provides = canProvideOwnVehicle(driverType, ownsVehicle, vehicleId);
  if (drives && provides) return "BOTH";
  if (provides) return "CAR_WITH_DRIVER";
  return "DRIVER_ONLY";
}

function isEligibleForService(
  driverType: DriverType,
  ownsVehicle: boolean,
  vehicleId: string | null | undefined,
  serviceType: ServiceType
): boolean {
  if (serviceType === ServiceType.DRIVER_ONLY) {
    return canDriveCustomerVehicle(driverType, ownsVehicle);
  }
  return canProvideOwnVehicle(driverType, ownsVehicle, vehicleId);
}

function computePriceEstimate(
  fareAmount: number,
  experienceYears: number,
  rating: number
): number {
  const experienceBonus = 1 + experienceYears * 0.015;
  const ratingBonus = 1 + (rating - 4) * 0.05;
  return Math.round(fareAmount * experienceBonus * Math.max(0.9, ratingBonus));
}

async function getDriverRatings(userIds: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (userIds.length === 0) return map;

  const reviews = await prisma.review.findMany({
    where: { booking: { driverId: { in: userIds } } },
    select: { rating: true, booking: { select: { driverId: true } } },
  });

  const sums = new Map<string, { total: number; count: number }>();
  for (const r of reviews) {
    const id = r.booking.driverId;
    if (!id) continue;
    const cur = sums.get(id) ?? { total: 0, count: 0 };
    cur.total += r.rating;
    cur.count += 1;
    sums.set(id, cur);
  }

  for (const id of userIds) {
    const s = sums.get(id);
    map.set(id, s ? Math.round((s.total / s.count) * 10) / 10 : 4.5);
  }
  return map;
}

export interface FetchAvailableDriversParams {
  serviceType: ServiceType;
  pickupLocation?: string;
  destinationLocation?: string;
  distanceKm?: number;
  estimatedDurationMin?: number;
}

export async function fetchAvailableDrivers(
  params: FetchAvailableDriversParams
): Promise<AvailableDriverResult[]> {
  const {
    serviceType,
    pickupLocation = "",
    destinationLocation = "",
    distanceKm = 12,
    estimatedDurationMin = 28,
  } = params;

  const baseFare = computeBaseFare(distanceKm, serviceType);

  const users = await prisma.user.findMany({
    where: {
      role: "DRIVER",
      driverProfile: {
        verificationStatus: "APPROVED",
        availabilityStatus: true,
      },
    },
    include: { driverProfile: true },
    orderBy: { createdAt: "desc" },
  });

  const vehicleIds = users
    .map((u) => u.driverProfile?.vehicleId)
    .filter((id): id is string => !!id);

  const vehicles = vehicleIds.length
    ? await prisma.vehicle.findMany({ where: { id: { in: vehicleIds } } })
    : [];

  const vehicleMap = new Map(vehicles.map((v) => [v.id, v]));
  const ratings = await getDriverRatings(users.map((u) => u.id));

  const results: AvailableDriverResult[] = [];

  for (const user of users) {
    const profile = user.driverProfile;
    if (!profile) continue;

    if (
      !isEligibleForService(
        profile.driverType,
        profile.ownsVehicle,
        profile.vehicleId,
        serviceType
      )
    ) {
      continue;
    }

    if (
      serviceType === ServiceType.CAR_WITH_DRIVER &&
      profile.vehicleId
    ) {
      const v = vehicleMap.get(profile.vehicleId);
      if (!v || v.availabilityStatus !== "AVAILABLE") continue;
    }

    const rating = ratings.get(user.id) ?? 4.5;
    const geoKey = `${user.id}:${pickupLocation || "default"}`;
    const hash = stableHash(geoKey);
    const distanceKmSim = (hash % 80) / 10 + 0.5;
    const etaMinutes = Math.round(distanceKmSim * 3 + (hash % 8));

    const vehicle = profile.vehicleId
      ? vehicleMap.get(profile.vehicleId) ?? null
      : null;

    const drives = canDriveCustomerVehicle(profile.driverType, profile.ownsVehicle);
    const provides = canProvideOwnVehicle(
      profile.driverType,
      profile.ownsVehicle,
      profile.vehicleId
    );

    results.push({
      id: profile.id,
      userId: user.id,
      fullName: user.fullName,
      profileImage: user.profileImage,
      rating,
      experienceYears: profile.experienceYears,
      serviceCapability: getServiceCapability(
        profile.driverType,
        profile.ownsVehicle,
        profile.vehicleId
      ),
      canDriveCustomerVehicle: drives,
      canProvideOwnVehicle: provides,
      vehicle: vehicle
        ? {
            id: vehicle.id,
            make: vehicle.make,
            model: vehicle.model,
            registrationNumber: vehicle.registrationNumber,
            vehicleType: vehicle.vehicleType,
          }
        : null,
      distanceKm: Math.round(distanceKmSim * 10) / 10,
      etaMinutes,
      availabilityStatus: profile.availabilityStatus,
      priceEstimate: computePriceEstimate(baseFare, profile.experienceYears, rating),
      locationHint: pickupLocation
        ? `${pickupLocation.split(",")[0]} area`
        : destinationLocation
          ? `Near ${destinationLocation.split(",")[0]}`
          : null,
      createdAt: profile.createdAt.toISOString(),
    });
  }

  return results;
}

function computeBaseFare(distanceKm: number, serviceType: ServiceType): number {
  const BASE = 5;
  const SERVICE_PCT = 0.05;
  const ratePerKm = serviceType === ServiceType.CAR_WITH_DRIVER ? 3.5 : 2.0;
  const distanceFare = parseFloat((distanceKm * ratePerKm).toFixed(2));
  const serviceFee = parseFloat(((BASE + distanceFare) * SERVICE_PCT).toFixed(2));
  return parseFloat((BASE + distanceFare + serviceFee).toFixed(2));
}

export async function validateDriverForManualBooking(
  driverUserId: string,
  serviceType: ServiceType
): Promise<{ ok: boolean; message?: string; vehicleId?: string | null }> {
  const user = await prisma.user.findUnique({
    where: { id: driverUserId },
    include: { driverProfile: true },
  });

  if (!user || user.role !== "DRIVER" || !user.driverProfile) {
    return { ok: false, message: "Driver not found" };
  }

  const profile = user.driverProfile;

  if (profile.verificationStatus !== "APPROVED") {
    return { ok: false, message: "Driver is not verified" };
  }

  if (!profile.availabilityStatus) {
    return { ok: false, message: "Driver is currently offline" };
  }

  if (
    !isEligibleForService(
      profile.driverType,
      profile.ownsVehicle,
      profile.vehicleId,
      serviceType
    )
  ) {
    return { ok: false, message: "Driver cannot fulfill this service type" };
  }

  if (serviceType === ServiceType.CAR_WITH_DRIVER && profile.vehicleId) {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: profile.vehicleId },
    });
    if (!vehicle || vehicle.availabilityStatus !== "AVAILABLE") {
      return { ok: false, message: "Driver vehicle is not available" };
    }
    return { ok: true, vehicleId: profile.vehicleId };
  }

  return { ok: true, vehicleId: null };
}
