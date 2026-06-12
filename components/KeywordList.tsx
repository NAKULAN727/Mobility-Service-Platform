import React from "react";

interface KeywordListProps {
  keywords: string[];
}

export default function KeywordList({ keywords }: KeywordListProps) {
  if (!keywords || keywords.length === 0) {
    return <span className="text-sm text-gray-400 italic">No keywords extracted</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {keywords.map((keyword, index) => (
        <span 
          key={index} 
          className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full border border-gray-200"
        >
          {keyword.toLowerCase()}
        </span>
      ))}
    </div>
  );
}
