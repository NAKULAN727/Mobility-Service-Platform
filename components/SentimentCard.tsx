import React from "react";
import { ReviewAnalysis } from "../types/review";
import KeywordList from "./KeywordList";

interface SentimentCardProps {
  analysis: ReviewAnalysis;
}

export default function SentimentCard({ analysis }: SentimentCardProps) {
  const getSentimentConfig = (sentiment: string) => {
    switch (sentiment) {
      case "Positive":
        return { emoji: "😊", colorClass: "text-green-700", bgClass: "bg-green-50", borderClass: "border-green-200" };
      case "Negative":
        return { emoji: "😞", colorClass: "text-red-700", bgClass: "bg-red-50", borderClass: "border-red-200" };
      case "Neutral":
      default:
        return { emoji: "😐", colorClass: "text-yellow-700", bgClass: "bg-yellow-50", borderClass: "border-yellow-200" };
    }
  };

  const config = getSentimentConfig(analysis.sentiment);
  const confidencePercent = Math.round(analysis.confidence * 100);

  return (
    <div className={`rounded-xl shadow-sm border p-6 transition-all duration-300 ${config.bgClass} ${config.borderClass}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <span className="text-3xl">{config.emoji}</span>
          <h3 className={`text-xl font-bold ${config.colorClass}`}>
            {analysis.sentiment}
          </h3>
        </div>
        <div className="text-right">
          <span className="text-xs text-gray-500 uppercase font-semibold tracking-wider block">Confidence</span>
          <span className={`text-lg font-bold ${config.colorClass}`}>{confidencePercent}%</span>
        </div>
      </div>

      <div className="mb-5 bg-white/60 rounded-lg p-4 text-sm text-gray-800 leading-relaxed italic border border-white/40">
        "{analysis.review}"
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Key Topics</h4>
        <KeywordList keywords={analysis.keywords} />
      </div>

      <div className="pt-4 border-t border-black/10">
        <h4 className="text-sm font-semibold text-gray-700 mb-1">AI Summary</h4>
        <p className="text-gray-800 text-sm">{analysis.summary}</p>
      </div>
    </div>
  );
}
