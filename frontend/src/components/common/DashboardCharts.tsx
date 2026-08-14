import React, { useState } from 'react';

// Color Palette mapping for status & category donut slices
const STATUS_COLORS: Record<string, { bg: string; fill: string; border: string }> = {
  submitted: { bg: '#3b82f6', fill: 'fill-blue-500', border: 'border-blue-500' },
  under_review: { bg: '#8b5cf6', fill: 'fill-purple-500', border: 'border-purple-500' },
  assigned: { bg: '#f59e0b', fill: 'fill-amber-500', border: 'border-amber-500' },
  in_progress: { bg: '#06b6d4', fill: 'fill-cyan-500', border: 'border-cyan-500' },
  waiting_parts: { bg: '#ec4899', fill: 'fill-pink-500', border: 'border-pink-500' },
  resolved: { bg: '#10b981', fill: 'fill-emerald-500', border: 'border-emerald-500' },
  closed: { bg: '#64748b', fill: 'fill-slate-500', border: 'border-slate-500' },
  rejected: { bg: '#f43f5e', fill: 'fill-rose-500', border: 'border-rose-500' },
};

const PALETTE = [
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899',
  '#06b6d4', '#f43f5e', '#6366f1', '#14b8a6', '#a855f7'
];

interface PieDataItem {
  label: string;
  value: number;
  color?: string;
}

interface StatusDonutChartProps {
  data: PieDataItem[];
  title?: string;
  centerLabel?: string;
  size?: number;
}

/**
 * Interactive SVG Donut / Pie Chart Component
 */
export const StatusDonutChart: React.FC<StatusDonutChartProps> = ({
  data,
  title = "Complaint Status Distribution",
  centerLabel,
  size = 200
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const total = data.reduce((acc, item) => acc + item.value, 0);
  if (total === 0) {
    return (
      <div className="p-6 text-center text-slate-400 font-bold text-xs">
        No status distribution data available.
      </div>
    );
  }

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  let accumulatedAngle = 0;

  return (
    <div className="flex flex-col items-center space-y-4">
      {title && (
        <h4 className="font-extrabold text-slate-900 dark:text-white text-xs tracking-wider uppercase flex items-center gap-1.5 self-start">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span> {title}
        </h4>
      )}

      <div className="relative flex items-center justify-center">
        <svg width={size} height={size} viewBox="0 0 200 200" className="transform -rotate-90">
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="transparent"
            stroke="#1e293b"
            strokeWidth="28"
          />

          {data.map((item, index) => {
            if (item.value === 0) return null;
            const strokeDashoffset = accumulatedAngle;
            const strokeDasharray = `${(item.value / total) * circumference} ${circumference}`;
            accumulatedAngle -= (item.value / total) * circumference;

            const sliceColor = item.color || STATUS_COLORS[item.label.toLowerCase().replace(/ /g, '_')]?.bg || PALETTE[index % PALETTE.length];
            const isHovered = hoveredIndex === index;

            return (
              <circle
                key={item.label}
                cx="100"
                cy="100"
                r={radius}
                fill="transparent"
                stroke={sliceColor}
                strokeWidth={isHovered ? 34 : 28}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-300 cursor-pointer"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            );
          })}
        </svg>

        {/* Donut Center Info */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          {hoveredIndex !== null ? (
            <>
              <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
                {data[hoveredIndex].value}
              </span>
              <span className="text-[10px] font-bold text-slate-400 max-w-[80px] truncate">
                {data[hoveredIndex].label}
              </span>
              <span className="text-[10px] font-extrabold text-blue-400">
                {Math.round((data[hoveredIndex].value / total) * 100)}%
              </span>
            </>
          ) : (
            <>
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {total}
              </span>
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                {centerLabel || "Total"}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Legend Grid */}
      <div className="grid grid-cols-2 gap-2 w-full pt-2">
        {data.map((item, index) => {
          const sliceColor = item.color || STATUS_COLORS[item.label.toLowerCase().replace(/ /g, '_')]?.bg || PALETTE[index % PALETTE.length];
          const pct = Math.round((item.value / total) * 100);

          return (
            <div
              key={item.label}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`p-2 rounded-xl border flex items-center justify-between text-xs transition-all cursor-pointer ${
                hoveredIndex === index
                  ? 'bg-slate-800 border-slate-700 shadow-md scale-105'
                  : 'bg-slate-900/40 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: sliceColor }} />
                <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px] truncate">
                  {item.label}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0 font-mono text-[11px]">
                <span className="font-extrabold text-slate-900 dark:text-white">{item.value}</span>
                <span className="text-[10px] text-slate-400">({pct}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface BarItem {
  label: string;
  value: number;
  subText?: string;
  highlight?: boolean;
}

interface CategoryBarChartProps {
  data: BarItem[];
  title?: string;
  subtitle?: string;
  barColorGradient?: string;
}

/**
 * Animated Gradient Bar Graph Component
 */
export const CategoryBarChart: React.FC<CategoryBarChartProps> = ({
  data,
  title = "Category Distribution Bar Graph",
  subtitle = "Total volume by category",
  barColorGradient = "from-blue-600 via-indigo-600 to-purple-600"
}) => {
  const maxVal = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h4 className="font-extrabold text-slate-900 dark:text-white text-xs tracking-wider uppercase flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span> {title}
          </h4>
          {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>

      <div className="space-y-2.5">
        {data.map((item) => {
          const pct = Math.round((item.value / maxVal) * 100);

          return (
            <div key={item.label} className="space-y-1 group">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-800 dark:text-slate-200 group-hover:text-blue-400 transition-colors">
                  {item.label}
                </span>
                <div className="flex items-center gap-2">
                  {item.subText && (
                    <span className="text-[10px] text-slate-400">{item.subText}</span>
                  )}
                  <span className="font-mono text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                    {item.value}
                  </span>
                </div>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5 border border-slate-200 dark:border-slate-800">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${
                    item.highlight ? 'from-rose-500 to-amber-500' : barColorGradient
                  } transition-all duration-700 ease-out group-hover:brightness-125`}
                  style={{ width: `${Math.max(pct, 4)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
