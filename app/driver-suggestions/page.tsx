"use client";

import React, { useEffect, useState } from "react";
import DriverSuggestions from "../../components/DriverSuggestions";
import { getTopDrivers, DriverRecommendation } from "../../lib/driverMatcher";

export default function DriverSuggestionsPage() {
  const [recommendations, setRecommendations] = useState<DriverRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock booking data
  const booking = {
    pickup: "Anna Nagar",
    destination: "Chennai Airport",
    rideType: "Standard"
  };

  useEffect(() => {
    async function fetchDrivers() {
      try {
        setIsLoading(true);
        // Using mock booking data for now, will replace with output from Phase 1 later
        const results = await getTopDrivers(booking);
        setRecommendations(results);
      } catch (err) {
        console.error("Error matching drivers:", err);
        setError("Failed to find driver recommendations. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchDrivers();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 text-center mb-6">
            Smart Driver Matching
          </h1>
          
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200 mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Booking Summary</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="block text-gray-500 mb-1">Pickup</span>
                <span className="font-medium text-gray-900">{booking.pickup}</span>
              </div>
              <div>
                <span className="block text-gray-500 mb-1">Destination</span>
                <span className="font-medium text-gray-900">{booking.destination}</span>
              </div>
              <div>
                <span className="block text-gray-500 mb-1">Ride Type</span>
                <span className="font-medium text-gray-900">{booking.rideType}</span>
              </div>
            </div>
          </div>
        </div>

        <DriverSuggestions 
          recommendations={recommendations} 
          isLoading={isLoading} 
          error={error} 
        />
      </div>
    </div>
  );
}
