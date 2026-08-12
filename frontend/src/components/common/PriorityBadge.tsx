import React from 'react';
import { Priority } from '../../types';

interface PriorityBadgeProps {
  priority: Priority;
  urgencyScore?: number;
  showScore?: boolean;
}

const prioStyles: Record<Priority, { label: string; bg: string; text: string; ring: string }> = {
  critical: { label: 'CRITICAL', bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400', text: 'text-rose-600', ring: 'ring-rose-500/30' },
  high: { label: 'HIGH', bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', text: 'text-amber-600', ring: 'ring-amber-500/30' },
  medium: { label: 'MEDIUM', bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', text: 'text-blue-600', ring: 'ring-blue-500/30' },
  low: { label: 'LOW', bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', text: 'text-emerald-600', ring: 'ring-emerald-500/30' }
};

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, urgencyScore, showScore = true }) => {
  const style = prioStyles[priority] || prioStyles.medium;

  return (
    <div className="inline-flex items-center gap-2">
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-black uppercase tracking-wide ring-1 ${style.bg} ${style.ring}`}>
        {priority === 'critical' && <span className="mr-1">🚨</span>}
        {style.label}
      </span>
      {showScore && urgencyScore !== undefined && (
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400" title="Urgency Score (0-100)">
          (Urgency: <span className="font-bold text-slate-700 dark:text-slate-200">{urgencyScore}/100</span>)
        </span>
      )}
    </div>
  );
};
