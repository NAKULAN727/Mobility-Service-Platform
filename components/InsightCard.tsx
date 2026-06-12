import React from "react";

interface InsightCardProps {
  insightText: string | null;
  isLoading: boolean;
}

export default function InsightCard({ insightText, isLoading }: InsightCardProps) {
  return (
    <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-xl shadow-md p-6 text-white relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10 blur-2xl pointer-events-none"></div>
      
      <div className="flex items-center gap-3 mb-4 relative z-10">
        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
          <span className="text-xl">✨</span>
        </div>
        <h3 className="text-lg font-bold">AI Executive Summary</h3>
      </div>
      
      <div className="relative z-10 min-h-[80px]">
        {isLoading ? (
          <div className="flex flex-col gap-3 mt-4">
            <div className="h-4 bg-white/20 rounded animate-pulse w-full"></div>
            <div className="h-4 bg-white/20 rounded animate-pulse w-5/6"></div>
            <div className="h-4 bg-white/20 rounded animate-pulse w-4/6"></div>
          </div>
        ) : insightText ? (
          <p className="text-blue-50 leading-relaxed text-sm md:text-base">
            "{insightText}"
          </p>
        ) : (
          <p className="text-blue-200 italic">No insights available at this time.</p>
        )}
      </div>
      
      <div className="mt-6 flex justify-end relative z-10">
        <span className="text-[10px] uppercase tracking-widest font-bold text-blue-200/80 bg-black/10 px-2 py-1 rounded backdrop-blur-sm">
          Powered by Gemini
        </span>
      </div>
    </div>
  );
}
