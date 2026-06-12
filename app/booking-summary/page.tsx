import React from "react";
import Link from "next/link";

export const metadata = {
  title: "Booking Summary - DriveMate",
};

export default function BookingSummaryPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-16 px-4 flex flex-col items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
        <div className="text-6xl mb-4">🚖</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Flow is in the Chat!</h1>
        <p className="text-gray-600 mb-6">
          The booking summary and ride completion steps have been seamlessly integrated directly into the conversational interface.
        </p>
        <Link 
          href="/chatbot"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          Go to AI Chatbot
        </Link>
      </div>
    </div>
  );
}
