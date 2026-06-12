"use client";

import React, { useEffect, useState } from "react";
import { AnalyticsData, SmartRecommendation } from "../../types/analytics";
import { fetchAnalyticsData } from "../../lib/analyticsEngine";
import { generateBusinessInsights } from "../../lib/geminiInsights";
import { generateRecommendations } from "../../lib/recommendationEngine";

import AnalyticsCard from "../../components/AnalyticsCard";
import BookingChart from "../../components/BookingChart";
import SentimentChart from "../../components/SentimentChart";
import DriverPerformanceCard from "../../components/DriverPerformanceCard";
import InsightCard from "../../components/InsightCard";
import RecommendationPanel from "../../components/RecommendationPanel";

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [insights, setInsights] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<SmartRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        // Load raw mock data
        const analyticsData = await fetchAnalyticsData();
        setData(analyticsData);
        setLoading(false);

        // Load Recommendations
        const recs = await generateRecommendations();
        setRecommendations(recs);

        // Load Gemini Insights
        const generatedInsights = await generateBusinessInsights(analyticsData);
        setInsights(generatedInsights);
        setInsightsLoading(false);
      } catch (err) {
        console.error("Dashboard failed to load:", err);
        setLoading(false);
        setInsightsLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Loading AI Analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Intelligence Hub</h1>
            <p className="text-gray-500 mt-1">AI-powered analytics and smart recommendations</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-500 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
              Last updated: Just now
            </span>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors text-sm">
              Export Report
            </button>
          </div>
        </div>

        {/* Gemini Executive Summary */}
        <div className="w-full">
          <InsightCard insightText={insights} isLoading={insightsLoading} />
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnalyticsCard 
            title="Total Bookings" 
            value={data.overall.totalBookings.toLocaleString()} 
            icon="📱" 
            trend="12%" trendPositive={true} 
          />
          <AnalyticsCard 
            title="Total Revenue" 
            value={`₹${(data.overall.totalRevenue / 1000).toFixed(1)}k`} 
            icon="💰" 
            trend="8.5%" trendPositive={true} 
          />
          <AnalyticsCard 
            title="Active Drivers" 
            value={data.overall.activeDrivers} 
            icon="🚗" 
            trend="3" trendPositive={false} 
          />
          <AnalyticsCard 
            title="Avg Rating" 
            value={data.overall.avgRating} 
            icon="⭐" 
          />
        </div>

        {/* Main Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <BookingChart data={data.trends} />
          </div>
          <div className="lg:col-span-1">
            <SentimentChart data={data.sentiment} />
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Popular & Peak Panel */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex-1">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Peak Hours</h3>
              <ul className="space-y-3">
                {data.peakHours.map((peak, idx) => (
                  <li key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <span className="font-semibold text-gray-700">{peak.period}</span>
                    <span className="text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded text-sm">{peak.timeRange}</span>
                  </li>
                ))}
              </ul>

              <h3 className="text-lg font-bold text-gray-800 mt-6 mb-4">Top Destinations</h3>
              <ul className="space-y-3">
                {data.popularDestinations.slice(0,3).map((dest, idx) => (
                  <li key={idx} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 font-bold w-4">{idx + 1}.</span>
                      <span className="font-medium text-gray-700">{dest.name}</span>
                    </div>
                    <span className="text-gray-500 font-semibold">{dest.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Driver Leaderboard */}
          <div className="lg:col-span-1 h-[400px]">
            <DriverPerformanceCard drivers={data.drivers} />
          </div>

          {/* Recommendations */}
          <div className="lg:col-span-1 h-[400px]">
            <RecommendationPanel recommendations={recommendations} />
          </div>

        </div>

      </div>
    </div>
  );
}
