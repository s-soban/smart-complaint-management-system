import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ProblemSite, RepairedSite, AIInsight } from '../../types';
import { Building2, AlertTriangle, CheckCircle2, Sparkles, MapPin, Wrench, ShieldAlert, Image as ImageIcon } from 'lucide-react';
import { PriorityBadge } from '../common/PriorityBadge';

export const CampusInsightsView: React.FC = () => {
  const [problemSites, setProblemSites] = useState<ProblemSite[]>([]);
  const [repairedSites, setRepairedSites] = useState<RepairedSite[]>([]);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'problems' | 'repaired' | 'ai'>('problems');

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.getCampusInsights();
        if (res.success) {
          setProblemSites(res.problemSites || []);
          setRepairedSites(res.repairedSites || []);
          setAiInsights(res.aiInsights || []);
        }
      } catch (err) {
        console.error('Failed to load campus insights:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="py-12 text-center text-slate-400 font-bold text-xs">
        Loading Campus Insights & Problem Site Mapping...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800">
        <div>
          <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-extrabold uppercase tracking-wider border border-blue-500/30">
            Institutional Facilities Intelligence
          </span>
          <h2 className="text-2xl font-black mt-2 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-400" /> Campus Insights & Infrastructure Analytics
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Geographical site mapping, recurring defect cluster alerts, and verified repair records.
          </p>
        </div>

        {/* View Selector Tabs */}
        <div className="flex bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700">
          <button
            onClick={() => setActiveTab('problems')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'problems'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🚨 Problem Sites ({problemSites.length})
          </button>
          <button
            onClick={() => setActiveTab('repaired')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'repaired'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ✨ Repaired Sites ({repairedSites.length})
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'ai'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            💡 AI Recommendations ({aiInsights.length})
          </button>
        </div>
      </div>

      {/* 1. Problem Sites View */}
      {activeTab === 'problems' && (
        <div className="space-y-4">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
            Active Problem Sites (Locations with Recurring or Unresolved Complaints)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {problemSites.map((site, i) => (
              <div
                key={i}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-950 shadow-sm space-y-3 relative overflow-hidden group hover:border-rose-400 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-400">
                    {site.building_code}
                  </span>
                  <PriorityBadge priority={site.highest_priority} showScore={false} />
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                    {site.building_name}
                  </h4>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 block">
                    📍 {site.room_area}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Unresolved:</span>
                    <span className="font-extrabold text-rose-600 dark:text-rose-400 text-sm">
                      {site.unresolved_count} issues
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Primary Defect:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {site.primary_category}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 pt-1">
                  Last reported: {new Date(site.last_reported).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Repaired Sites View */}
      {activeTab === 'repaired' && (
        <div className="space-y-4">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
            Verified Repaired Sites & Before/After Media Archive
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {repairedSites.map((site) => (
              <div
                key={site.complaint_id}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg">
                    {site.complaint_id}
                  </span>
                  <span className="text-xs text-slate-400 font-bold">
                    Resolved: {site.resolved_at ? new Date(site.resolved_at).toLocaleDateString() : 'Recently'}
                  </span>
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                    {site.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    📍 {site.building_name} - {site.room_area} ({site.category_name})
                  </p>
                </div>

                {/* Resolution summary */}
                <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-xs">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-0.5">
                    Repair Log ({site.resolved_by_staff || 'Maintenance Team'}):
                  </span>
                  <p className="text-emerald-700 dark:text-emerald-200">{site.resolution_summary}</p>
                </div>

                {/* Before / After Images */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <span className="text-[10px] font-extrabold text-rose-500 uppercase block mb-1">
                      Before Repair
                    </span>
                    <img
                      src={site.before_image || '/uploads/complaints/sample-before-1.svg'}
                      alt="Before repair"
                      className="w-full h-28 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-emerald-500 uppercase block mb-1">
                      After Repair
                    </span>
                    <img
                      src={site.after_image || '/uploads/repairs/sample-after-1.svg'}
                      alt="After repair"
                      className="w-full h-28 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. AI Institutional Recommendations */}
      {activeTab === 'ai' && (
        <div className="space-y-4">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
            AI Automated Institutional Recommendations & Defect Pattern Alerts
          </h3>

          <div className="space-y-4">
            {aiInsights.map((insight, i) => (
              <div
                key={i}
                className={`p-6 rounded-3xl border shadow-sm space-y-3 ${
                  insight.type === 'alert'
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                    : insight.type === 'warning'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                    : 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> Suggested Insight ({insight.location})
                  </span>
                </div>

                <h4 className="font-extrabold text-base">{insight.title}</h4>
                <p className="text-xs leading-relaxed opacity-90">{insight.description}</p>

                <div className="pt-2 border-t border-current/15 text-xs font-bold">
                  <span>💡 Recommended Action: </span>
                  <span className="underline">{insight.recommendedAction}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
