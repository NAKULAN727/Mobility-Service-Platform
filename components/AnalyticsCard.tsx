import React from "react";

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  icon: string;
  trend?: string;
  trendPositive?: boolean;
}

export default function AnalyticsCard({ title, value, icon, trend, trendPositive }: AnalyticsCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        <span className="text-2xl opacity-80">{icon}</span>
      </div>
      
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-gray-900">{value}</span>
        {trend && (
          <span className={`text-xs font-semibold ${trendPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trendPositive ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>
    </div>
  );
}
