"use client";

import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { SentimentStats } from "../types/analytics";

interface SentimentChartProps {
  data: SentimentStats;
}

export default function SentimentChart({ data }: SentimentChartProps) {
  const chartData = [
    { name: 'Positive', value: data.positive, color: '#10b981' }, // Green
    { name: 'Neutral', value: data.neutral, color: '#f59e0b' },  // Yellow
    { name: 'Negative', value: data.negative, color: '#ef4444' }   // Red
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-80 flex flex-col">
      <h3 className="text-lg font-bold text-gray-800 mb-2">Customer Sentiment</h3>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ color: '#1f2937', fontWeight: 600 }}
              formatter={(value: any) => [`${value}%`, 'Reviews']}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
