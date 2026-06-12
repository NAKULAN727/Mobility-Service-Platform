import React from "react";
import { SmartRecommendation } from "../types/analytics";

interface RecommendationPanelProps {
  recommendations: SmartRecommendation[];
}

export default function RecommendationPanel({ recommendations }: RecommendationPanelProps) {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xl">🎯</span>
        <h3 className="text-lg font-bold text-gray-800">Smart Suggestions</h3>
      </div>
      
      <div className="flex flex-col gap-4 flex-1">
        {recommendations.map((rec, idx) => (
          <div 
            key={idx} 
            className={`p-4 rounded-xl border flex flex-col gap-3 ${
              rec.type === 'habit' 
                ? 'bg-purple-50 border-purple-100' 
                : 'bg-green-50 border-green-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="bg-white p-1.5 rounded-md shadow-sm text-sm">
                {rec.type === 'habit' ? '🔁' : '🎁'}
              </span>
              <h4 className={`font-bold text-sm ${rec.type === 'habit' ? 'text-purple-800' : 'text-green-800'}`}>
                {rec.title}
              </h4>
            </div>
            
            <p className="text-gray-600 text-sm leading-relaxed">
              {rec.description}
            </p>
            
            <button className={`mt-2 py-2 px-4 rounded-lg text-sm font-bold text-white transition-colors shadow-sm w-full sm:w-auto self-start ${
              rec.type === 'habit' 
                ? 'bg-purple-600 hover:bg-purple-700' 
                : 'bg-green-600 hover:bg-green-700'
            }`}>
              {rec.actionText}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
