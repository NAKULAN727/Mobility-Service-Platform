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
        {estimate.driverBaseFee && (
          <div className="flex justify-between">
            <span>Driver Base Fee</span>
            <span className="font-medium text-gray-900">₹{estimate.driverBaseFee}</span>
          </div>
        )}
        {estimate.vehicleRentalBase && (
          <div className="flex justify-between">
            <span>Vehicle Rental</span>
            <span className="font-medium text-gray-900">₹{estimate.vehicleRentalBase}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Distance Charge</span>
          <span className="font-medium text-gray-900">₹{estimate.distanceCharge}</span>
        </div>
        <div className="flex justify-between">
          <span>Time Charge</span>
          <span className="font-medium text-gray-900">₹{estimate.timeCharge}</span>
        </div>
        {estimate.trafficMultiplier && estimate.trafficMultiplier !== 1 ? (
          <div className="flex justify-between">
            <span>Traffic Multiplier</span>
            <span className="font-medium text-gray-900">{estimate.trafficMultiplier}×</span>
          </div>
        ) : null}
        {estimate.experienceMultiplier && estimate.experienceMultiplier !== 1 ? (
          <div className="flex justify-between">
            <span>Experience Multiplier</span>
            <span className="font-medium text-gray-900">{estimate.experienceMultiplier}×</span>
          </div>
        ) : null}
        {estimate.fuelAdjustment ? (
          <div className="flex justify-between">
            <span>Fuel Surcharge</span>
            <span className="font-medium text-gray-900">₹{estimate.fuelAdjustment}</span>
          </div>
        ) : null}
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
