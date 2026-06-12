"use client";

import React, { useState } from "react";
import { calculateFare, FareResult, CalculateFareParams } from "../../lib/fareCalculator";
import FareCard from "../../components/FareCard";
import { mockRoutes } from "../../data/mockRoutes";

export default function FareEstimatorPage() {
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [rideType, setRideType] = useState("Standard");
  const [trafficLevel, setTrafficLevel] = useState<"Normal" | "Moderate" | "High">("Normal");
  
  const [result, setResult] = useState<FareResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availablePickups = Array.from(new Set(mockRoutes.map(r => r.pickup)));
  const availableDestinations = pickup 
    ? mockRoutes.filter(r => r.pickup === pickup).map(r => r.destination)
    : [];

  const handleCalculate = async () => {
    if (!pickup || !destination) {
      setError("Please select both pickup and destination.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setResult(null);

      const params: CalculateFareParams = {
        pickup,
        destination,
        rideType,
        trafficLevel
      };

      const fareResult = await calculateFare(params);
      setResult(fareResult);
    } catch (err: any) {
      console.error("Error calculating fare:", err);
      setError(err.message || "Failed to calculate fare. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Column - Input Form */}
        <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-100 h-fit">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-6">
            Dynamic Fare Estimator
          </h1>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Location</label>
              <select 
                value={pickup} 
                onChange={(e) => {
                  setPickup(e.target.value);
                  setDestination(""); // reset destination when pickup changes
                }}
                className="w-full border border-gray-300 rounded-lg p-3 text-gray-700 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Pickup</option>
                {availablePickups.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
              <select 
                value={destination} 
                onChange={(e) => setDestination(e.target.value)}
                disabled={!pickup}
                className="w-full border border-gray-300 rounded-lg p-3 text-gray-700 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="">Select Destination</option>
                {availableDestinations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ride Type</label>
              <select 
                value={rideType} 
                onChange={(e) => setRideType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 text-gray-700 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Standard">Standard</option>
                <option value="Premium">Premium</option>
                <option value="Luxury">Luxury</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Traffic Level</label>
              <select 
                value={trafficLevel} 
                onChange={(e) => setTrafficLevel(e.target.value as any)}
                className="w-full border border-gray-300 rounded-lg p-3 text-gray-700 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Normal">Normal</option>
                <option value="Moderate">Moderate</option>
                <option value="High">High</option>
              </select>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleCalculate}
              disabled={isLoading || !pickup || !destination}
              className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 transition-colors mt-4"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin"></div>
                  Calculating...
                </span>
              ) : (
                "Calculate Fare"
              )}
            </button>
          </div>
        </div>

        {/* Right Column - Results */}
        <div className="flex items-start justify-center">
          {result ? (
            <FareCard result={result} rideType={rideType} trafficLevel={trafficLevel} />
          ) : (
            <div className="w-full h-full min-h-[300px] flex items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl bg-white/50 text-gray-400 p-8 text-center">
              <p>Select your route details and calculate the fare to see the breakdown here.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
