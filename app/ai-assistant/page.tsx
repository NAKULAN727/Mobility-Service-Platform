import React from "react";
import NLPBotUI from "../../components/NLPBotUI";

export const metadata = {
  title: "NLP Chatbot - DriveMate",
  description: "Experience conversational booking, fare estimation, and driver matching.",
};

export default function AIAssistantPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <div className="text-center mb-8 max-w-2xl">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
          NLP AI Chatbot
        </h1>
        <p className="text-lg text-gray-600">
          Experience conversational booking, fare estimation, and driver matching powered by advanced Natural Language Processing.
        </p>
      </div>
      
      <NLPBotUI />
    </div>
  );
}
