import React from 'react';
import { Status, StatusHistory } from '../../types';

interface TimelineTrackerProps {
  currentStatus: Status;
  history?: StatusHistory[];
}

const STAGES: Array<{ id: Status; label: string; description: string }> = [
  { id: 'submitted', label: 'Submitted', description: 'Logged by user' },
  { id: 'under_review', label: 'Under Review', description: 'Admin triage' },
  { id: 'assigned', label: 'Assigned', description: 'Staff dispatched' },
  { id: 'in_progress', label: 'In Progress', description: 'Repair active' },
  { id: 'resolved', label: 'Resolved', description: 'Fix completed' },
  { id: 'closed', label: 'Closed', description: 'Verified & archived' }
];

export const TimelineTracker: React.FC<TimelineTrackerProps> = ({ currentStatus, history = [] }) => {
  if (currentStatus === 'rejected') {
    return (
      <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300">
        <div className="flex items-center gap-2 font-bold text-sm">
          <span>❌ Complaint Rejected</span>
        </div>
        <p className="text-xs mt-1">This complaint was rejected or deemed invalid by campus administration.</p>
      </div>
    );
  }

  const getStageIndex = (s: Status) => {
    if (s === 'waiting_parts') return 3; // Treat waiting parts near in_progress
    return STAGES.findIndex(stage => stage.id === s);
  };

  const currentIndex = getStageIndex(currentStatus);

  return (
    <div className="w-full py-4">
      <div className="relative flex items-center justify-between">
        {/* Connector Line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 dark:bg-slate-700 -z-0" />
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 transition-all duration-500 -z-0"
          style={{ width: `${Math.max(0, Math.min(100, (currentIndex / (STAGES.length - 1)) * 100))}%` }}
        />

        {STAGES.map((stage, idx) => {
          const isPassed = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const histMatch = history.find(h => h.to_status === stage.id);

          return (
            <div key={stage.id} className="relative z-10 flex flex-col items-center group">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-md ${
                  isPassed
                    ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                    : isCurrent
                    ? 'bg-blue-600 text-white ring-4 ring-blue-500/30 scale-110 shadow-blue-500/30'
                    : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-300 dark:border-slate-700'
                }`}
              >
                {isPassed ? '✓' : idx + 1}
              </div>
              <div className="mt-2 text-center">
                <span className={`block text-xs font-bold ${isCurrent ? 'text-blue-600 dark:text-blue-400' : isPassed ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}`}>
                  {stage.label}
                </span>
                {histMatch && (
                  <span className="block text-[10px] text-slate-400 font-medium">
                    {new Date(histMatch.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
