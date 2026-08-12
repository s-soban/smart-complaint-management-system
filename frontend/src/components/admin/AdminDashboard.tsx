import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { AnalyticsKPIs } from '../../types';
import { ShieldAlert, CheckCircle2, Clock, Wrench, AlertTriangle, TrendingUp, Building2, BarChart3, ArrowUpRight } from 'lucide-react';

interface AdminDashboardProps {
  onNavigateTab: (tab: string) => void;
  onSelectComplaint: (id: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab, onSelectComplaint }) => {
  const [kpis, setKpis] = useState<AnalyticsKPIs | null>(null);
  const [chartsData, setChartsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const res = await api.getAnalytics();
        if (res.success) {
          setKpis(res.kpis);
          setChartsData(res.charts);
        }
      } catch (err) {
        console.error('Failed to load admin analytics:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  if (isLoading || !kpis) {
    return (
      <div className="py-12 text-center text-slate-400 font-bold text-xs">
        Loading Admin Analytics Engine...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-800">
        <div>
          <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-extrabold uppercase tracking-wider border border-indigo-500/30">
            Administrator Command Center
          </span>
          <h2 className="text-2xl font-black mt-2 tracking-tight">Institutional Operations Analytics</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time campus infrastructure monitoring, resolution performance, and predictive AI insights.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateTab('all-complaints')}
            className="px-4 py-2.5 rounded-xl bg-blue-600 text-white font-extrabold text-xs shadow-md hover:bg-blue-500 transition-colors"
          >
            Manage Complaints
          </button>
          <button
            onClick={() => onNavigateTab('campus-insights')}
            className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-200 font-extrabold text-xs border border-slate-700 hover:bg-slate-700 transition-colors"
          >
            Campus Insights
          </button>
        </div>
      </div>

      {/* Top Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">Total Complaints</span>
            <BarChart3 className="w-4 h-4 text-blue-500" />
          </div>
          <span className="text-3xl font-black text-slate-900 dark:text-white">{kpis.total}</span>
          <span className="block text-[11px] text-blue-600 font-bold mt-1">
            {kpis.newSubmitted} new pending triage
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">Critical Active Hazards</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <span className="text-3xl font-black text-rose-600 dark:text-rose-400">{kpis.criticalActive}</span>
          <span className="block text-[11px] text-rose-500 font-bold mt-1">
            Requires immediate staff dispatch
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">Resolution Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{kpis.resolutionRate}%</span>
          <span className="block text-[11px] text-slate-400 font-medium mt-1">
            {kpis.resolvedTotal} resolved campus issues
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">Overdue (&gt;7 Days)</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-3xl font-black text-amber-600 dark:text-amber-400">{kpis.overdueCount}</span>
          <span className="block text-[11px] text-amber-600 font-bold mt-1">
            Avg resolution: {kpis.avgResolutionHours} hrs
          </span>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Bar Chart */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
              Complaints by Category Breakdown
            </h3>
            <span className="text-xs text-slate-400 font-mono">Volume</span>
          </div>

          <div className="space-y-3">
            {chartsData?.byCategory?.map((item: any) => {
              const maxVal = Math.max(...(chartsData.byCategory.map((c: any) => c.count) || [1]));
              const pct = Math.round((item.count / maxVal) * 100);

              return (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700 dark:text-slate-300">{item.name}</span>
                    <span className="text-slate-900 dark:text-white font-mono">{item.count}</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Building Hotspots Chart */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
              Campus Building Defect Hotspots
            </h3>
            <span className="text-xs text-slate-400 font-mono">Building Load</span>
          </div>

          <div className="space-y-3">
            {chartsData?.byBuilding?.map((item: any) => {
              const maxVal = Math.max(...(chartsData.byBuilding.map((c: any) => c.count) || [1]));
              const pct = Math.round((item.count / maxVal) * 100);

              return (
                <div key={item.building_name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700 dark:text-slate-300">{item.building_name}</span>
                    <div className="flex items-center gap-2">
                      {item.critical_count > 0 && (
                        <span className="text-[10px] font-black text-rose-500 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded">
                          {item.critical_count} Critical
                        </span>
                      )}
                      <span className="text-slate-900 dark:text-white font-mono">{item.count} issues</span>
                    </div>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Staff Workload Table */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
          Maintenance Staff Workload Monitor
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-extrabold uppercase text-[10px]">
                <th className="py-2.5 px-4">Staff Technician</th>
                <th className="py-2.5 px-4">Active Workload</th>
                <th className="py-2.5 px-4">Resolved Repairs</th>
                <th className="py-2.5 px-4">Total Assignments</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
              {chartsData?.staffWorkload?.map((staff: any) => (
                <tr key={staff.staff_name} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    {staff.staff_name}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 font-bold">
                      {staff.active_workload || 0} active
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 font-bold">
                      {staff.resolved_count || 0} completed
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold">
                    {staff.assigned_total || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
