import React from "react";
import NLPBotUI from "../../components/NLPBotUI";

export const metadata = {
  title: "End-to-End Chatbot - DriveMate",
  description: "Experience the complete intelligent workflow of DriveMate.",
};

export default function ChatbotPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 flex flex-col items-center">
      <div className="text-center mb-6 max-w-2xl">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">
          DriveMate AI 
        </h1>
        <p className="text-lg text-gray-600">
          The single entry point for parsing, booking, reviews, and personalized recommendations.
        </p>
      </div>
      
      <NLPBotUI />
    </div>
  );
}
