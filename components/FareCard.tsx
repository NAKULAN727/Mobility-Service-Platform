import React from "react";
import { FareResult } from "../lib/fareCalculator";
import FareBreakdown from "./FareBreakdown";

interface FareCardProps {
  result: FareResult;
  rideType: string;
  trafficLevel: string;
}

export default function FareCard({ result, rideType, trafficLevel }: FareCardProps) {
  const { estimate, explanation, distance, duration } = result;

  return (
    <div className="w-full max-w-lg mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-center text-white">
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-2 opacity-80">Estimated Fare</h2>
        <div className="text-5xl font-extrabold mb-4">₹{estimate.totalFare}</div>
        
        <div className="flex justify-center gap-6 text-sm">
          <div className="flex flex-col">
            <span className="opacity-75">Distance</span>
            <span className="font-medium">{distance} km</span>
          </div>
          <div className="flex flex-col border-l border-white/20 pl-6">
            <span className="opacity-75">Duration</span>
            <span className="font-medium">{duration} min</span>
          </div>
        </div>
      </div>
      
      <div className="p-6 bg-gray-50">
        <div className="flex justify-between items-center mb-4 text-sm font-medium text-gray-700">
          <div className="bg-white px-3 py-1 rounded-full shadow-sm border border-gray-200">
            🚕 {rideType}
          </div>
          <div className={`px-3 py-1 rounded-full shadow-sm text-white ${
            trafficLevel === 'High' ? 'bg-red-500' : 
            trafficLevel === 'Moderate' ? 'bg-orange-400' : 
            'bg-green-500'
          }`}>
            🚦 {trafficLevel} Traffic
          </div>
        </div>

        <div className="bg-blue-50 text-blue-800 p-4 rounded-lg italic text-sm leading-relaxed">
          "{explanation}"
        </div>

        <FareBreakdown estimate={estimate} />
      </div>
    </div>
  );
}
