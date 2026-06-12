import React from "react";
import { DriverPerformance } from "../types/analytics";

interface DriverPerformanceProps {
  drivers: DriverPerformance[];
}

export default function DriverPerformanceCard({ drivers }: DriverPerformanceProps) {
  // Sort by rating and trips
  const sortedDrivers = [...drivers].sort((a, b) => b.rating - a.rating || b.trips - a.trips);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 overflow-hidden flex flex-col h-full">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Driver Leaderboard</h3>
      
      <div className="flex-1 overflow-y-auto pr-2 space-y-4 no-scrollbar">
        {sortedDrivers.map((driver, idx) => (
          <div key={driver.id} className={`p-4 rounded-lg border ${driver.isTopPerformer ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-100'}`}>
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                  {driver.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 flex items-center gap-1">
                    {driver.name}
                    {driver.isTopPerformer && <span title="Top Performer">🏆</span>}
                  </h4>
                  <p className="text-xs text-gray-500">#{idx + 1} in Rank</p>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-white px-2 py-1 rounded shadow-sm">
                <span className="text-yellow-400 text-sm">★</span>
                <span className="font-bold text-gray-900 text-sm">{driver.rating}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-200/60">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Trips</p>
                <p className="font-bold text-gray-800 text-sm">{driver.trips}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Acceptance</p>
                <p className="font-bold text-gray-800 text-sm">{driver.acceptance}%</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Avg ETA</p>
                <p className="font-bold text-gray-800 text-sm">{driver.avgEta}m</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
