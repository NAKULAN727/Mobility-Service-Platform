"use server";

import { AnalyticsData, DriverPerformance, PopularDestination, SentimentStats } from "../types/analytics";
import prisma from "./prisma";

export async function fetchAnalyticsData(): Promise<AnalyticsData> {
  const dbBookingsCount = await prisma.booking.count();

  // 1. Overall stats aggregation
  const completedRides = await prisma.booking.count({ where: { bookingStatus: "TRIP_COMPLETED" } });
  const cancelledRides = await prisma.booking.count({ where: { bookingStatus: "CANCELLED" } });
  
  const revenueAgg = await prisma.booking.aggregate({
    _sum: { fareAmount: true },
    where: { bookingStatus: "TRIP_COMPLETED" }
  });

  const driverOnlyCount = await prisma.booking.count({ where: { serviceType: "DRIVER_ONLY" } });
  const carAndDriverCount = await prisma.booking.count({ where: { serviceType: "CAR_WITH_DRIVER" } });
  
  const totalRevenue = Number(revenueAgg._sum?.fareAmount || 0);
  
  const activeDrivers = await prisma.driverProfile.count({
    where: { verificationStatus: "APPROVED" }
  });
  
  const reviewAgg = await prisma.review.aggregate({
    _avg: { rating: true }
  });
  const avgRating = reviewAgg._avg.rating ? parseFloat(reviewAgg._avg.rating.toFixed(1)) : 0;

  // 2. Trends
  const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const trendsCount: Record<string, number> = {
    Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0
  };
  const allBookings = await prisma.booking.findMany({ select: { createdAt: true } });
  allBookings.forEach(b => {
    const day = weekdayNames[new Date(b.createdAt).getDay()];
    trendsCount[day] += 1;
  });

  const trends = weekdayNames.map(day => ({
    day,
    bookings: trendsCount[day]
  }));

  // 3. Peak Hours
  const peakHoursCount: Record<string, number> = {};
  allBookings.forEach(b => {
    const hour = new Date(b.createdAt).getHours();
    const formatted = `${hour.toString().padStart(2, "0")}:00`;
    peakHoursCount[formatted] = (peakHoursCount[formatted] || 0) + 1;
  });

  const getPeriod = (hour: number): string => {
    if (hour >= 5 && hour < 12) return "Morning";
    if (hour >= 12 && hour < 17) return "Afternoon";
    if (hour >= 17 && hour < 21) return "Evening";
    return "Night";
  };

  const peakHours = Object.keys(peakHoursCount).map(time => {
    const hour = parseInt(time.split(":")[0]);
    const nextHour = (hour + 1).toString().padStart(2, "0");
    return {
      period: getPeriod(hour),
      timeRange: `${time} - ${nextHour}:00`,
      time,
      demand: peakHoursCount[time]
    };
  }).sort((a, b) => a.time!.localeCompare(b.time!));

  // 4. Popular Destinations
  const locations = await prisma.location.findMany({
    select: { destinationLocation: true }
  });
  const destCount: Record<string, number> = {};
  locations.forEach(loc => {
    const dest = loc.destinationLocation;
    destCount[dest] = (destCount[dest] || 0) + 1;
  });

  const popularDestinations: PopularDestination[] = Object.keys(destCount)
    .map(name => ({ name, count: destCount[name] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // 5. Driver Performance
  const driversFromDb = await prisma.driverProfile.findMany({
    include: {
      user: true
    }
  });

  const dbDrivers: DriverPerformance[] = [];
  for (const dr of driversFromDb) {
    const tripsCount = await prisma.booking.count({
      where: { driverId: dr.userId, bookingStatus: "TRIP_COMPLETED" }
    });
    const totalAssigned = await prisma.booking.count({
      where: { driverId: dr.userId }
    });
    const acceptance = totalAssigned > 0 ? Math.round((tripsCount / totalAssigned) * 100) : 100;
    
    const driverReviewsAgg = await prisma.review.aggregate({
      _avg: { rating: true },
      where: {
        booking: { driverId: dr.userId }
      }
    });

    dbDrivers.push({
      id: dr.id,
      name: dr.user.fullName,
      rating: driverReviewsAgg._avg.rating ? parseFloat(driverReviewsAgg._avg.rating.toFixed(1)) : 5.0,
      trips: tripsCount,
      acceptance: acceptance,
      avgEta: 5 // Default simulation
    });
  }

  // Highlight top performer
  let topDriver = dbDrivers[0];
  let topScore = 0;
  dbDrivers.forEach(driver => {
    const score = (driver.rating * 100) + driver.trips + driver.acceptance;
    if (score > topScore) {
      topScore = score;
      topDriver = driver;
    }
  });

  const finalDrivers = dbDrivers.map(d => ({
    ...d,
    isTopPerformer: topDriver && d.id === topDriver.id
  }));

  // 6. Sentiment aggregation
  const reviewSentimentCount = await prisma.review.groupBy({
    by: ['sentiment'],
    _count: { sentiment: true }
  });

  const sentiments: SentimentStats = {
    positive: 0,
    neutral: 0,
    negative: 0
  };

  reviewSentimentCount.forEach(group => {
    const s = group.sentiment?.toLowerCase();
    if (s === "positive") sentiments.positive += group._count.sentiment;
    else if (s === "neutral") sentiments.neutral += group._count.sentiment;
    else if (s === "negative") sentiments.negative += group._count.sentiment;
  });

  return {
    overall: {
      totalBookings: dbBookingsCount,
      driverOnlyBookings: driverOnlyCount,
      carAndDriverBookings: carAndDriverCount,
      completedRides: completedRides,
      cancelledRides: cancelledRides,
      totalRevenue,
      activeDrivers,
      avgRating
    },
    trends,
    peakHours,
    popularDestinations,
    drivers: finalDrivers,
    sentiment: sentiments
  };
}
