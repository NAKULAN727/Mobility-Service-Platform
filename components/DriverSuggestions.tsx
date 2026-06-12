import React from "react";
import { DriverRecommendation } from "../lib/driverMatcher";
import DriverCard from "./DriverCard";

interface DriverSuggestionsProps {
  recommendations: DriverRecommendation[];
  isLoading: boolean;
  error?: string | null;
}

export default function DriverSuggestions({ recommendations, isLoading, error }: DriverSuggestionsProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
        <p className="font-medium text-center">{error}</p>
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="bg-yellow-50 text-yellow-700 p-6 rounded-lg border border-yellow-200 text-center">
        <h3 className="text-lg font-semibold mb-2">No Drivers Available</h3>
        <p>Sorry, there are no drivers available matching your request right now. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Recommended Drivers</h2>
      <div className="flex flex-col gap-4">
        {recommendations.map((rec) => (
          <DriverCard key={rec.driver.id} recommendation={rec} />
        ))}
      </div>
    </div>
  );
}
