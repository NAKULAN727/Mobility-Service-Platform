import React from "react";

interface BookingSummaryProps {
  bookingId: string;
  entities: any;
  fare: any;
  driver: any;
  onComplete: () => void;
  status: "CONFIRMED" | "COMPLETED" | "REVIEWED";
}

export default function BookingSummary({ bookingId, entities, fare, driver, onComplete, status }: BookingSummaryProps) {
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden w-full max-w-md mx-auto my-4 animate-fade-in-up">
      <div className="bg-blue-600 p-5 text-white flex justify-between items-center">
        <div>
          <p className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">Booking Confirmed</p>
          <h3 className="text-xl font-bold">ID: {bookingId}</h3>
        </div>
        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
          <span className="text-2xl">🚕</span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-lg shadow-inner">📍</div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Pickup</p>
              <p className="font-bold text-gray-900">{entities.pickup}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-lg shadow-inner">🏁</div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Destination</p>
              <p className="font-bold text-gray-900">{entities.destination}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">Schedule</p>
            <p className="font-bold text-gray-900 text-sm">{entities.date} at {entities.time}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">Fare</p>
            <p className="font-bold text-green-600 text-sm">₹{fare?.totalFare ?? fare?.estimate?.totalFare ?? 0}</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3 border border-gray-200">
          <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
            {driver?.name?.charAt(0) || "D"}
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500 font-medium">Your Driver</p>
            <div className="flex justify-between items-center">
              <p className="font-bold text-gray-900 text-sm">{driver?.name || "Driver"}</p>
              <span className="text-xs font-bold bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded shadow-sm">
                ⭐ {driver?.rating || "N/A"}
              </span>
            </div>
          </div>
        </div>
        
        {status === "CONFIRMED" ? (
          <button 
            onClick={onComplete}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors shadow-md mt-4"
          >
            Mark Ride as Completed
          </button>
        ) : (
          <div className="w-full bg-green-50 text-green-700 font-bold py-3 rounded-xl text-center border border-green-200 shadow-sm mt-4">
            ✅ Ride Completed
          </div>
        )}
      </div>
    </div>
  );
}
