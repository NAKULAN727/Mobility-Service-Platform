"use client";

import React, { useState } from "react";

interface ReviewFormProps {
  onSubmit: (review: string) => void;
  isLoading: boolean;
}

export default function ReviewForm({ onSubmit, isLoading }: ReviewFormProps) {
  const [review, setReview] = useState("");
  const MAX_CHARS = 500;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (review.trim() && review.length <= MAX_CHARS) {
      onSubmit(review);
    }
  };

  const handleClear = () => {
    setReview("");
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4">Analyze a Review</h2>
      
      <div className="relative mb-4">
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Paste or type a customer review here..."
          className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900 bg-white placeholder-gray-400"
          disabled={isLoading}
        />
        <div className={`absolute bottom-3 right-3 text-xs ${review.length > MAX_CHARS ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
          {review.length}/{MAX_CHARS}
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={handleClear}
          disabled={isLoading || review.length === 0}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          Clear
        </button>
        <button
          type="submit"
          disabled={isLoading || review.trim().length === 0 || review.length > MAX_CHARS}
          className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-solid border-t-transparent rounded-full animate-spin"></div>
              Analyzing...
            </>
          ) : (
            "Analyze Sentiment"
          )}
        </button>
      </div>
    </form>
  );
}
