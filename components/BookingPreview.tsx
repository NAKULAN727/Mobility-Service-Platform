import { Booking } from "../types/booking";
import { MapPin, Calendar, Clock, Car, Users } from "lucide-react";

interface BookingPreviewProps {
  booking: Booking;
}

export default function BookingPreview({ booking }: BookingPreviewProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full border border-gray-100">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">Booking Summary</h3>
      
      <div className="space-y-4">
        <div className="flex items-start">
          <MapPin className="w-5 h-5 text-blue-500 mt-1 mr-3 shrink-0" />
          <div>
            <p className="text-sm text-gray-500">Pickup</p>
            <p className="font-medium text-gray-900">{booking.pickup || <span className="text-red-500 italic">Missing</span>}</p>
          </div>
        </div>

        <div className="flex items-start">
          <MapPin className="w-5 h-5 text-green-500 mt-1 mr-3 shrink-0" />
          <div>
            <p className="text-sm text-gray-500">Destination</p>
            <p className="font-medium text-gray-900">{booking.destination || <span className="text-red-500 italic">Missing</span>}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center">
            <Calendar className="w-5 h-5 text-indigo-500 mr-2 shrink-0" />
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-medium text-gray-900">{booking.date || "Not set"}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <Clock className="w-5 h-5 text-indigo-500 mr-2 shrink-0" />
            <div>
              <p className="text-sm text-gray-500">Time</p>
              <p className="font-medium text-gray-900">{booking.time || "Not set"}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
          <div className="flex items-center">
            <Car className="w-5 h-5 text-gray-600 mr-2 shrink-0" />
            <div>
              <p className="text-sm text-gray-500">Ride Type</p>
              <p className="font-medium text-gray-900">{booking.rideType}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <Users className="w-5 h-5 text-gray-600 mr-2 shrink-0" />
            <div>
              <p className="text-sm text-gray-500">Passengers</p>
              <p className="font-medium text-gray-900">{booking.passengers}</p>
            </div>
          </div>
        </div>

        {booking.specialRequests && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-sm text-gray-500">Special Requests</p>
            <p className="text-sm font-medium text-gray-900">{booking.specialRequests}</p>
          </div>
        )}
      </div>
    </div>
  );
}
