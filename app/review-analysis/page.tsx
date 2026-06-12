"use client";

import React, { useState } from "react";
import ReviewForm from "../../components/ReviewForm";
import SentimentCard from "../../components/SentimentCard";
import { analyzeReview } from "../../lib/sentimentAnalyzer";
import { ReviewAnalysis } from "../../types/review";

export default function ReviewAnalysisPage() {
  const [analyzedReviews, setAnalyzedReviews] = useState<ReviewAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (reviewText: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await analyzeReview(reviewText);
      setAnalyzedReviews(prev => [result, ...prev]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Unable to analyze review at the moment. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-4">
            Review Sentiment Analysis
          </h1>
          <p className="text-gray-600 max-w-xl mx-auto">
            Powered by AI, this tool instantly analyzes customer feedback to determine sentiment, extract keywords, and generate actionable summaries.
          </p>
        </div>

        <div className="mb-8">
          <ReviewForm onSubmit={handleAnalyze} isLoading={isLoading} />
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 mb-8 animate-fade-in">
            <p className="font-medium">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {analyzedReviews.length > 0 && (
            <h2 className="text-xl font-bold text-gray-800 mb-4">Analysis History</h2>
          )}
          
          {analyzedReviews.map((analysis, index) => (
            <div key={index} className="animate-fade-in-up">
              <SentimentCard analysis={analysis} />
            </div>
          ))}

          {analyzedReviews.length === 0 && !isLoading && !error && (
            <div className="text-center p-12 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
              Submit a review above to see the AI analysis.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
