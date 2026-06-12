"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChatMessage, ChatContext, NLPEntities } from "../types/chat";
import { handleUserMessage } from "../lib/chatbotOrchestrator";
import { WorkflowState } from "../lib/workflowManager";
import { markRideAsCompletedIntegration } from "../lib/integrationService";

import FareCard from "./FareCard";
import DriverCard from "./DriverCard";
import WorkflowTimeline from "./WorkflowTimeline";
import BookingSummary from "./BookingSummary";
import SentimentCard from "./SentimentCard";
import RecommendationPanel from "./RecommendationPanel";

export default function NLPBotUI() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      role: "bot",
      content: "Hello! I'm DriveMate AI. I can orchestrate your entire mobility experience from booking a ride to collecting your feedback. Where would you like to go today?",
      timestamp: Date.now()
    }
  ]);

  const [currentEntities, setCurrentEntities] = useState<NLPEntities>({
    pickup: null, destination: null, date: null, time: null,
    rideType: "Standard", passengers: 1, priority: null, specialRequests: null, reviewText: null
  });

  const [workflowState, setWorkflowState] = useState<WorkflowState>({ currentStep: "INIT" });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: Date.now()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    const context: ChatContext = {
      messages: newMessages,
      currentEntities,
      workflowState
    };

    try {
      const { newMessage, updatedEntities, updatedWorkflow } = await handleUserMessage(text, context);
      setMessages(prev => [...prev, newMessage]);
      setCurrentEntities(updatedEntities);
      setWorkflowState(updatedWorkflow);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const markCompleted = async () => {
    setIsLoading(true);
    await markRideAsCompletedIntegration(workflowState.fare?.totalFare || 0);
    
    setWorkflowState(prev => ({ ...prev, currentStep: "COMPLETED" }));
    
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: "bot",
      content: "Ride completed successfully! I've updated your analytics dashboard. How was your ride today?",
      timestamp: Date.now()
    }]);
    setIsLoading(false);
  };

  const quickActions = [
    "🚖 Book a Ride", "👍 Yes, confirm booking", "🚗 Find Fastest Driver"
  ];

  return (
    <div className="flex flex-col h-[800px] w-full max-w-5xl mx-auto bg-gray-50 rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-inner">
            <span className="text-2xl">🤖</span>
          </div>
          <div>
            <h2 className="font-bold text-lg leading-tight">DriveMate E2E Workflow</h2>
            <p className="text-blue-200 text-xs font-medium">Orchestrating all AI Modules</p>
          </div>
        </div>
      </div>

      <div className="p-4 bg-white border-b border-gray-200 shadow-sm z-10">
         <WorkflowTimeline currentStep={workflowState.currentStep} />
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
            <div 
              className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                msg.role === "user" 
                  ? "bg-blue-600 text-white rounded-tr-sm" 
                  : "bg-white text-gray-800 border border-gray-100 rounded-tl-sm"
              }`}
            >
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{msg.content}</p>
            </div>

            {/* Enriched Data Plugins */}
            {msg.enrichedData && (
              <div className="w-full max-w-[85%] mt-4 space-y-4">
                
                {msg.enrichedData.fareEstimate && workflowState.currentStep !== "CONFIRMED" && workflowState.currentStep !== "COMPLETED" && workflowState.currentStep !== "REVIEWED" && (
                  <div className="animate-fade-in-up">
                    <FareCard 
                      result={msg.enrichedData.fareEstimate} 
                      rideType={currentEntities.rideType || "Standard"} 
                      trafficLevel="Normal" 
                    />
                  </div>
                )}
                
                {msg.enrichedData.driverRecommendations && workflowState.currentStep !== "CONFIRMED" && workflowState.currentStep !== "COMPLETED" && workflowState.currentStep !== "REVIEWED" && (
                  <div className="space-y-3 animate-fade-in-up">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Top Recommended Driver</h4>
                    <DriverCard recommendation={msg.enrichedData.driverRecommendations[0]} />
                  </div>
                )}

                {msg.enrichedData.bookingConfirmed && (
                  <BookingSummary 
                    bookingId={workflowState.bookingId!}
                    entities={currentEntities}
                    fare={workflowState.fare}
                    driver={workflowState.driver}
                    status={workflowState.currentStep as any}
                    onComplete={markCompleted}
                  />
                )}

                {msg.enrichedData.reviewAnalyzed && (
                  <div className="animate-fade-in-up w-full">
                    <SentimentCard 
                      analysis={msg.enrichedData.reviewAnalyzed}
                    />
                  </div>
                )}

                {msg.enrichedData.recommendations && (
                  <div className="animate-fade-in-up w-full mt-4 h-64">
                    <RecommendationPanel recommendations={msg.enrichedData.recommendations} />
                  </div>
                )}

              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm p-4 shadow-sm flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-2 bg-white border-t border-gray-100 overflow-x-auto flex gap-2 no-scrollbar">
        {quickActions.map((action, i) => (
          <button 
            key={i}
            onClick={() => handleSend(action.replace(/^[^\s]+\s/, ''))}
            className="flex-shrink-0 bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 text-xs font-semibold px-4 py-2 rounded-full border border-gray-200 hover:border-blue-200 transition-colors"
          >
            {action}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
          className="flex gap-2"
        >
          <input 
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your message here..."
            className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors text-gray-900 placeholder-gray-400"
            disabled={isLoading}
          />
          <button 
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-1">
              <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
