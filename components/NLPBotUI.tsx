"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChatMessage, ChatContext, NLPEntities } from "../types/chat";
import { handleUserMessage } from "../lib/chatbotOrchestrator";
import { WorkflowState } from "../lib/workflowManager";
import { useRouter } from "next/navigation";
import { useAuth } from "../app/providers";
import { customerAuthHeader } from "../lib/session";
import { 
  Car, Shield, Send, User, MapPin, Navigation, Clock, 
  Key, CheckCircle, RefreshCw, Star, AlertCircle, Sparkles, MessageSquare
} from "lucide-react";

import FareCard from "./FareCard";
import DriverCard from "./DriverCard";
import WorkflowTimeline from "./WorkflowTimeline";
import BookingSummary from "./BookingSummary";
import SentimentCard from "./SentimentCard";
import RecommendationPanel from "./RecommendationPanel";

export default function NLPBotUI() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!loading && user?.role === "DRIVER") {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      role: "bot",
      content: `Hello ${user?.fullName || "there"}! I'm DriveMate AI. I can orchestrate your entire booking experience, from finding a ride to collecting feedback. Where would you like to go today?`,
      timestamp: Date.now()
    }
  ]);

  const [currentEntities, setCurrentEntities] = useState<NLPEntities>({
    pickup: null, destination: null, date: null, time: null,
    serviceType: null, passengers: 1, priority: null, specialRequests: null, reviewText: null
  });

  const [workflowState, setWorkflowState] = useState<WorkflowState>({ currentStep: "INIT" });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"MAP" | "DRIVER">("MAP");
  const [driverOtpInput, setDriverOtpInput] = useState("");
  const [simError, setSimError] = useState("");
  const [simSuccess, setSimSuccess] = useState("");
  
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Synchronize dynamic status updates by polling the booking if active
  useEffect(() => {
    if (!workflowState.bookingId || ["INIT", "ESTIMATED", "MATCHED", "TRIP_COMPLETED", "REVIEW_PENDING", "REVIEWED", "CLOSED", "CANCELLED", "DISPUTED"].includes(workflowState.currentStep)) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/graphql", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json", 
            Authorization: `Bearer ${localStorage.getItem("token")}` 
          },
          body: JSON.stringify({
            query: `
              query GetBookingById($id: ID!) {
                getBookingById(id: $id) {
                  id
                  bookingStatus
                  otpCode
                }
              }
            `,
            variables: { id: workflowState.bookingId }
          })
        });
        
        const json = await res.json();
        const status = json.data?.getBookingById?.bookingStatus;
        if (status && status !== workflowState.currentStep) {
          setWorkflowState(prev => ({ ...prev, currentStep: status }));
          
          let botUpdate = "";
          if (status === "ACCEPTED") {
            botUpdate = "Driver accepted your request!";
          } else if (status === "DRIVER_ARRIVING") {
            botUpdate = "Your driver Bob is on the way to your pickup location.";
          } else if (status === "OTP_PENDING") {
            botUpdate = "Driver has arrived at the pickup location. Please share your 6-digit PIN with the driver to start the trip.";
          } else if (status === "OTP_VERIFIED") {
            botUpdate = "OTP verified! Buckle up, we're ready to go.";
          } else if (status === "TRIP_STARTED") {
            botUpdate = "Your trip has started. Have a safe journey!";
          } else if (status === "TRIP_COMPLETED") {
            botUpdate = "You have reached your destination! Please leave a review of your experience below.";
          } else if (status === "CANCELLED") {
            botUpdate = "Your ride was cancelled.";
          }

          if (botUpdate) {
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: "bot",
              content: botUpdate,
              timestamp: Date.now()
            }]);
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [workflowState.bookingId, workflowState.currentStep]);

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
      workflowState,
      customerId: user?.id
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
    try {
      await fetch("/api/graphql", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${localStorage.getItem("token")}` 
        },
        body: JSON.stringify({
          query: `
            mutation CompleteTrip($bookingId: ID!) {
              completeTrip(bookingId: $bookingId) {
                success
                errors { message }
              }
            }
          `,
          variables: { bookingId: workflowState.bookingId }
        })
      });
      
      setWorkflowState(prev => ({ ...prev, currentStep: "TRIP_COMPLETED" }));
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "bot",
        content: "Ride completed successfully! I've updated your analytics dashboard. How was your ride today?",
        timestamp: Date.now()
      }]);
    } catch (e) {
      console.error("Complete trip failed", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Driver Simulator Actions
  const runSimMutation = async (mutationName: string, query: string, variables: any) => {
    setSimError("");
    setSimSuccess("");
    try {
      const res = await fetch("/api/graphql", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${localStorage.getItem("token")}` 
        },
        body: JSON.stringify({ query, variables })
      });
      const json = await res.json();
      const payload = json.data?.[mutationName];
      if (payload?.success) {
        setSimSuccess(`Action successfully simulated: ${mutationName}`);
        setWorkflowState(prev => ({ ...prev, currentStep: payload.booking?.bookingStatus || prev.currentStep }));
      } else {
        setSimError(payload?.errors?.[0]?.message || "Action failed.");
      }
    } catch (err: any) {
      setSimError(err.message || "Network failure.");
    }
  };

  const handleSimAccept = () => {
    const q = `
      mutation AcceptBooking($bookingId: ID!, $driverId: ID!) {
        acceptBooking(bookingId: $bookingId, driverId: $driverId) {
          success
          errors { message }
          booking { bookingStatus }
        }
      }
    `;
    runSimMutation("acceptBooking", q, { bookingId: workflowState.bookingId, driverId: "driver-id-123" });
  };

  const handleSimDriverArriving = () => {
    const q = `
      mutation DriverArriving($bookingId: ID!) {
        driverArriving(bookingId: $bookingId) {
          success
          errors { message }
          booking { bookingStatus }
        }
      }
    `;
    runSimMutation("driverArriving", q, { bookingId: workflowState.bookingId });
  };

  const handleSimArriveAtPickup = () => {
    const q = `
      mutation ArriveAtPickup($bookingId: ID!) {
        arriveAtPickup(bookingId: $bookingId) {
          success
          errors { message }
          booking { bookingStatus }
        }
      }
    `;
    runSimMutation("arriveAtPickup", q, { bookingId: workflowState.bookingId });
  };

  const handleSimVerifyOTP = () => {
    if (!driverOtpInput.trim()) {
      setSimError("Please enter the boarding OTP.");
      return;
    }
    const q = `
      mutation VerifyOTP($bookingId: ID!, $otpCode: String!) {
        verifyOTP(bookingId: $bookingId, otpCode: $otpCode) {
          success
          errors { message }
          booking { bookingStatus }
        }
      }
    `;
    runSimMutation("verifyOTP", q, { bookingId: workflowState.bookingId, otpCode: driverOtpInput });
  };

  const handleSimStart = () => {
    const q = `
      mutation StartTrip($bookingId: ID!) {
        startTrip(bookingId: $bookingId) {
          success
          errors { message }
          booking { bookingStatus }
        }
      }
    `;
    runSimMutation("startTrip", q, { bookingId: workflowState.bookingId });
  };

  const handleSimComplete = () => {
    const q = `
      mutation CompleteTrip($bookingId: ID!) {
        completeTrip(bookingId: $bookingId) {
          success
          errors { message }
          booking { bookingStatus }
        }
      }
    `;
    runSimMutation("completeTrip", q, { bookingId: workflowState.bookingId });
  };

  const quickActions = [
    "🚖 Book a Ride", "👍 Yes, confirm booking", "🚗 Find Premium Cab"
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full max-w-7xl mx-auto h-[750px] overflow-hidden">
      
      {/* ─── LEFT COLUMN: AI Assistant Chat (7 cols) ─── */}
      <div className="lg:col-span-7 flex flex-col h-full bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden premium-glass-card">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-950/20">
              <Sparkles className="h-5 w-5 text-white animate-pulse" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm sm:text-base leading-tight tracking-tight">DriveMate Conversational Dispatch</h2>
              <p className="text-slate-400 text-xs font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Gemini 2.5 Flash Connected
              </p>
            </div>
          </div>
        </div>

        {/* Timeline Progress */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
          <WorkflowTimeline currentStep={workflowState.currentStep} />
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
              
              {/* Message bubble */}
              <div 
                className={`max-w-[85%] rounded-2xl px-4 py-3.5 shadow-sm text-sm ${
                  msg.role === "user" 
                    ? "bg-slate-900 text-white rounded-tr-sm font-semibold" 
                    : "bg-slate-100 text-slate-800 border border-slate-200/50 rounded-tl-sm"
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>

              {/* Timestamp */}
              <span className="text-[10px] text-slate-400 font-bold mt-1.5 px-1.5 font-mono">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>

              {/* Enriched Data Cards */}
              {msg.enrichedData && (
                <div className="w-full max-w-[85%] mt-4 space-y-4">
                  
                  {msg.enrichedData.fareEstimate && !["CONFIRMED", "COMPLETED", "REVIEWED"].includes(workflowState.currentStep) && (
                    <div className="animate-scale-in">
                      <FareCard 
                        result={msg.enrichedData.fareEstimate} 
                        serviceType={currentEntities.serviceType || "Standard"} 
                        trafficLevel="Normal" 
                      />
                    </div>
                  )}
                  
                  {msg.enrichedData.driverRecommendations && msg.enrichedData.driverRecommendations.length > 0 && !["CONFIRMED", "COMPLETED", "REVIEWED"].includes(workflowState.currentStep) && (
                    <div className="space-y-2 animate-scale-in">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Top Recommended Driver</h4>
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
                    <div className="animate-scale-in w-full">
                      <SentimentCard 
                        analysis={msg.enrichedData.reviewAnalyzed}
                      />
                    </div>
                  )}

                  {msg.enrichedData.recommendations && (
                    <div className="animate-scale-in w-full mt-2">
                      <RecommendationPanel recommendations={msg.enrichedData.recommendations} />
                    </div>
                  )}

                  {workflowState.currentStep === "TRIP_COMPLETED" && msg.role === "bot" && (
                    <div className="mt-4 p-5 bg-white border border-indigo-200 rounded-2xl shadow-xl flex flex-col gap-3 animate-scale-in">
                      <div className="flex items-center gap-2 text-indigo-600 font-black">
                        <Star className="h-5 w-5 fill-indigo-600" />
                        <span>Rate Your Experience</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        Your trip is complete! Please let us know how Bob did. Was the ride comfortable? Did you feel safe?
                      </p>
                      <button 
                        onClick={() => {
                          setInput("The ride was excellent! Bob was on time and very professional.");
                          endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Write a Review
                      </button>
                    </div>
                  )}

                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start">
              <div className="bg-slate-100 border border-slate-200/50 rounded-2xl rounded-tl-sm px-4 py-3.5 shadow-sm flex items-center gap-1.5">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={endOfMessagesRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200/60 overflow-x-auto flex gap-2 no-scrollbar">
          {quickActions.map((action, i) => (
            <button 
              key={i}
              onClick={() => handleSend(action.replace(/^[^\s]+\s/, ''))}
              className="flex-shrink-0 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold px-4 py-2 rounded-full border border-slate-200 shadow-sm transition-all"
            >
              {action}
            </button>
          ))}
        </div>

        {/* Chat Input Field */}
        <div className="p-4 bg-white border-t border-slate-200/80">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
            className="flex gap-2"
          >
            <input 
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="e.g. Book a sedan from Anna Nagar to Airport tomorrow at 9 AM."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all text-sm text-slate-800 placeholder-slate-400 font-medium"
              disabled={isLoading}
            />
            <button 
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-slate-900 text-white rounded-2xl w-12 h-12 flex items-center justify-center hover:bg-slate-800 disabled:opacity-40 transition-all shadow-md shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </form>
        </div>
      </div>

      {/* ─── RIGHT COLUMN: Active Dispatch Map & Driver Simulator (5 cols) ─── */}
      <div className="lg:col-span-5 flex flex-col h-full bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden premium-glass-card">
        {/* Widget Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            onClick={() => setActiveTab("MAP")}
            className={`flex-1 py-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "MAP" 
                ? "bg-white border-b-2 border-slate-950 text-slate-900" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Navigation className="h-4 w-4" />
            Dispatch Map
          </button>
          <button
            onClick={() => setActiveTab("DRIVER")}
            className={`flex-1 py-4 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "DRIVER" 
                ? "bg-white border-b-2 border-slate-950 text-slate-900" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <User className="h-4 w-4" />
            Driver Simulator
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-between">
          
          {/* TAB 1: Dispatch Map */}
          {activeTab === "MAP" && (
            <div className="flex-1 flex flex-col gap-6">
              <div>
                <h3 className="font-heading font-black text-slate-900 text-base">Route Dispatch Preview</h3>
                <p className="text-slate-500 text-xs mt-0.5">Real-time simulator routing preview for your booking.</p>
              </div>

              {/* Map Canvas */}
              <div className="relative w-full flex-1 bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden p-4 min-h-[300px]">
                <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:18px_18px]" />
                
                {currentEntities.pickup && currentEntities.destination ? (
                  <div className="absolute inset-0 flex flex-col justify-between p-4">
                    {/* Simulator Banner */}
                    <div className="self-end bg-slate-900/90 text-white text-[9px] font-mono font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm border border-slate-700/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live GPS Routing Active
                    </div>

                    {/* Route Info Pin Card */}
                    <div className="bg-white/95 border border-slate-200 rounded-xl p-3 shadow-md backdrop-blur-sm space-y-2 mt-auto w-full">
                      <div className="flex items-start gap-2.5">
                        <MapPin className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Pickup Location</p>
                          <p className="text-xs font-bold text-slate-800 truncate">{currentEntities.pickup}</p>
                        </div>
                      </div>
                      <div className="h-4 w-0.5 bg-slate-200 ml-2" />
                      <div className="flex items-start gap-2.5">
                        <Navigation className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Dropoff Location</p>
                          <p className="text-xs font-bold text-slate-800 truncate">{currentEntities.destination}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 gap-2">
                    <Car className="h-8 w-8 text-slate-300 animate-bounce" />
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">No active route</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed max-w-[200px]">
                      Use the AI Assistant on the left to start a booking.
                    </p>
                  </div>
                )}
              </div>

              {/* Status Board */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-bold space-y-2.5 text-slate-700">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-black">Ride Dashboard</p>
                <div className="flex justify-between items-center">
                  <span>Current Step:</span>
                  <span className="bg-slate-900 text-white px-2.5 py-1 rounded text-[10px] uppercase font-black">
                    {workflowState.currentStep}
                  </span>
                </div>
                {workflowState.bookingId && (
                  <div className="flex justify-between items-center border-t border-slate-200/60 pt-2 font-mono text-[10px]">
                    <span>Booking ID:</span>
                    <span className="text-slate-900 font-bold">{workflowState.bookingId.slice(0,10).toUpperCase()}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Driver Simulator */}
          {activeTab === "DRIVER" && (
            <div className="flex-1 flex flex-col gap-6">
              <div>
                <h3 className="font-heading font-black text-slate-900 text-base">Driver Cockpit Simulator</h3>
                <p className="text-slate-500 text-xs mt-0.5">Simulate driver dashboard events to progress booking states.</p>
              </div>

              {simError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-xl flex items-start gap-2 shadow-sm">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{simError}</span>
                </div>
              )}

              {simSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs p-3.5 rounded-xl flex items-start gap-2 shadow-sm">
                  <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{simSuccess}</span>
                </div>
              )}

              {workflowState.bookingId ? (
                <div className="space-y-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Stats Card */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-bold space-y-2">
                      <p className="text-[10px] text-slate-400 uppercase font-black">Pending Dispatch Info</p>
                      <div className="flex justify-between items-center text-slate-800">
                        <span>Ride Status:</span>
                        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] uppercase font-black">
                          {workflowState.currentStep}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-slate-800 font-mono text-[10px]">
                        <span>Booking ID:</span>
                        <span>{workflowState.bookingId.slice(0,12).toUpperCase()}</span>
                      </div>
                    </div>

                    {/* Action controls based on status */}
                    <div className="space-y-3">
                      {workflowState.currentStep === "REQUESTED" && (
                        <button 
                          onClick={handleSimAccept}
                          className="w-full bg-slate-900 hover:bg-slate-850 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] shadow-sm"
                        >
                          <Car className="h-4 w-4" />
                          Accept Ride Request (Bob Driver)
                        </button>
                      )}

                      {workflowState.currentStep === "ACCEPTED" && (
                        <button 
                          onClick={handleSimDriverArriving}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] shadow-sm"
                        >
                          <Navigation className="h-4 w-4" />
                          Mark Bob Driver as ARRIVING at Pickup
                        </button>
                      )}

                      {workflowState.currentStep === "DRIVER_ARRIVING" && (
                        <button 
                          onClick={handleSimArriveAtPickup}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] shadow-sm"
                        >
                          <Navigation className="h-4 w-4" />
                          Mark Bob Driver as ARRIVED at Pickup
                        </button>
                      )}

                      {workflowState.currentStep === "OTP_PENDING" && (
                        <div className="space-y-2.5 bg-slate-50 border border-slate-200 rounded-xl p-4">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Boarding OTP verification</label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              maxLength={6}
                              placeholder="Enter customer OTP"
                              value={driverOtpInput}
                              onChange={e => setDriverOtpInput(e.target.value.replace(/[^0-9]/g, ""))}
                              className="flex-1 bg-white border border-slate-200 rounded-lg py-2.5 px-3 text-xs outline-none focus:border-slate-800 text-center font-bold tracking-[0.2em] font-mono text-slate-800"
                            />
                            <button 
                              onClick={handleSimVerifyOTP}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-lg text-xs transition-all cursor-pointer shadow"
                            >
                              Verify OTP
                            </button>
                          </div>
                          <p className="text-[9px] text-slate-400 font-bold leading-normal mt-1">
                            * Note: The customer received the OTP PIN in the AI Chat. Copy it here to verify boarding.
                          </p>
                        </div>
                      )}

                      {workflowState.currentStep === "OTP_VERIFIED" && (
                        <button 
                          onClick={handleSimStart}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] shadow-md"
                        >
                          <Car className="h-4 w-4" />
                          Start Trip
                        </button>
                      )}

                      {workflowState.currentStep === "TRIP_STARTED" && (
                        <button 
                          onClick={handleSimComplete}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] shadow-md"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Complete Ride & Process Payment
                        </button>
                      )}

                      {workflowState.currentStep === "TRIP_COMPLETED" && (
                        <div className="bg-slate-50 border border-dashed border-slate-350 rounded-xl p-6 text-center text-slate-550 flex flex-col items-center gap-2">
                          <Star className="h-8 w-8 text-amber-500 fill-amber-500" />
                          <p className="font-bold text-xs">Trip Completed!</p>
                          <p className="text-[11px] text-slate-400 max-w-[200px] leading-relaxed mx-auto">
                            Prompt the AI Assistant on the left with feedback to trigger sentiment analysis.
                          </p>
                        </div>
                      )}

                      {workflowState.currentStep === "REVIEWED" && (
                        <div className="bg-slate-50 border border-dashed border-slate-350 rounded-xl p-6 text-center text-slate-550 flex flex-col items-center gap-2">
                          <Sparkles className="h-8 w-8 text-indigo-500" />
                          <p className="font-bold text-xs">Review Analyzed!</p>
                          <p className="text-[11px] text-slate-400 leading-relaxed max-w-[200px] mx-auto">
                            The review has been parsed and sentiment persisted in the database.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 gap-2">
                  <User className="h-8 w-8 text-slate-300 animate-pulse" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">No active driver session</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed max-w-[200px]">
                    Create a booking request from the AI chatbot on the left to simulate a driver.
                  </p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
