import React from "react";
import { WorkflowStep } from "../lib/workflowManager";

interface WorkflowTimelineProps {
  currentStep: WorkflowStep;
}

const steps = [
  { key: "PARSED", label: "Parsed" },
  { key: "ESTIMATED", label: "Fare Estimated" },
  { key: "MATCHED", label: "Driver Matched" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "COMPLETED", label: "Ride Completed" },
  { key: "REVIEWED", label: "Review Analyzed" }
];

export default function WorkflowTimeline({ currentStep }: WorkflowTimelineProps) {
  const allKeys = ["INIT", ...steps.map(s => s.key)];
  const currentIndex = allKeys.indexOf(currentStep);

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 w-full overflow-x-auto">
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">AI Workflow Status</h3>
      <div className="flex items-center min-w-[600px]">
        {steps.map((step, idx) => {
          const stepIndex = allKeys.indexOf(step.key);
          const isCompleted = currentIndex >= stepIndex;
          const isCurrent = currentIndex === stepIndex;

          return (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center relative w-24">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold z-10 transition-colors ${
                  isCompleted ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-400 border border-gray-200'
                } ${isCurrent ? 'ring-4 ring-blue-100' : ''}`}>
                  {isCompleted ? "✓" : idx + 1}
                </div>
                <p className={`text-[10px] text-center mt-2 font-medium ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                  {step.label}
                </p>
              </div>
              {idx < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-2 rounded transition-colors ${
                  currentIndex > stepIndex ? 'bg-blue-600' : 'bg-gray-100'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
