import React from "react";
import { DriverRecommendation } from "../lib/driverMatcher";

interface DriverCardProps {
  recommendation: DriverRecommendation;
}

export default function DriverCard({ recommendation }: DriverCardProps) {
  const { driver, score, reason } = recommendation;

  return (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-300 border border-gray-100 flex flex-col md:flex-row gap-6">
      <div className="flex-1">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-xl font-bold text-gray-800">{driver.name}</h3>
            <p className="text-gray-500 text-sm font-medium">{driver.vehicle}</p>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-md text-yellow-600 font-semibold mb-1">
              <span>⭐</span>
              <span>{driver.rating.toFixed(1)}</span>
            </div>
            <p className="text-xs text-gray-500">{driver.acceptanceRate}% Acceptance</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">🕒</span>
            <span className="font-medium text-gray-700">{driver.eta} mins</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">📍</span>
            <span className="font-medium text-gray-700">{driver.distance.toFixed(1)} km away</span>
          </div>
        </div>
      </div>

      <div className="md:w-1/3 flex flex-col justify-between bg-blue-50/50 rounded-lg p-4">
        <div className="text-center mb-3">
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider block mb-1">Match Score</span>
          <div className="text-3xl font-bold text-blue-700">{score}%</div>
        </div>
        <div>
          <p className="text-xs text-blue-800 italic leading-relaxed text-center">
            "{reason}"
          </p>
        </div>
      </div>
    </div>
  );
}
