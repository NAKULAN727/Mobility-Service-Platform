"use client";

import { useState } from "react";
import { parseBooking } from "../lib/bookingParser";
import { Booking } from "../types/booking";
import BookingPreview from "./BookingPreview";
import { Send, Loader2, Edit3, CheckCircle } from "lucide-react";

export default function AIAssistant() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [bookingData, setBookingData] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleSubmit = async () => {
    if (!input.trim()) {
      setError("Please enter a booking request.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsConfirmed(false);

    try {
      const parsedBooking = await parseBooking(input);
      
      if (!parsedBooking) {
        setError("Could not parse the booking request. Please try again.");
      } else {
        setBookingData(parsedBooking);
        
        if (!parsedBooking.pickup || !parsedBooking.destination) {
          setError("Pickup or destination seems to be missing. Please verify.");
        }
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setBookingData(null);
    setIsConfirmed(false);
  };

  const handleConfirm = () => {
    setIsConfirmed(true);
    setError(null);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto space-y-8">
      {/* Input Area */}
      {!isConfirmed && (
        <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What would you like to book?
          </label>
          <div className="relative">
            <textarea
              className="w-full min-h-[120px] p-4 pr-12 rounded-xl border border-gray-200 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-all"
              placeholder="E.g., Book a cab from Anna Nagar to Chennai Airport tomorrow at 9 AM for 2 people"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            <button
              onClick={handleSubmit}
              disabled={isLoading || !input.trim()}
              className="absolute bottom-4 right-4 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        </div>
      )}

      {/* Results Area */}
      {bookingData && !isConfirmed && (
        <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <BookingPreview booking={bookingData} />
          
          <div className="flex space-x-4 mt-6">
            <button
              onClick={handleEdit}
              className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Request
            </button>
            <button
              onClick={handleConfirm}
              disabled={!bookingData.pickup || !bookingData.destination}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-md shadow-blue-500/20"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirm Booking
            </button>
          </div>
        </div>
      )}

      {/* Confirmed State */}
      {isConfirmed && (
        <div className="w-full bg-green-50 border border-green-200 rounded-2xl p-8 text-center animate-in zoom-in-95 duration-300 shadow-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-green-800 mb-2">Booking Ready for Submission</h3>
          <p className="text-green-600 mb-6">Your request has been successfully parsed and is ready to be sent to the booking service.</p>
          <button
            onClick={() => {
              setInput("");
              setBookingData(null);
              setIsConfirmed(false);
            }}
            className="px-6 py-2 bg-white text-green-700 font-medium rounded-lg shadow-sm border border-green-200 hover:bg-green-50 transition-colors"
          >
            Start New Booking
          </button>
        </div>
      )}
    </div>
  );
}
