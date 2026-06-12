import React from "react";
import { FareEstimate } from "../types/fare";

interface FareBreakdownProps {
  estimate: FareEstimate;
}

export default function FareBreakdown({ estimate }: FareBreakdownProps) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Fare Breakdown</h3>
      
      <div className="space-y-3 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Base Fare</span>
          <span className="font-medium text-gray-900">₹{estimate.baseFare}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Distance Charge</span>
          <span className="font-medium text-gray-900">₹{estimate.distanceCharge}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Time Charge</span>
          <span className="font-medium text-gray-900">₹{estimate.timeCharge}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Surge Multiplier</span>
          <span className="font-medium text-gray-900">{estimate.surgeMultiplier}×</span>
        </div>
        
        <div className="flex justify-between">
          <span>Ride Multiplier</span>
          <span className="font-medium text-gray-900">{estimate.rideMultiplier}×</span>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
        <div className="flex justify-between items-center">
          <span className="font-bold text-gray-800">Estimated Total</span>
          <span className="text-xl font-extrabold text-blue-700">₹{estimate.totalFare}</span>
        </div>
      </div>
    </div>
  );
}
