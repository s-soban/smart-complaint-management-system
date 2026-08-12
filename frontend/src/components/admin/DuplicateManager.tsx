import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Copy, AlertTriangle, CheckCircle, Split, Eye, Sparkles } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

interface DuplicateManagerProps {
  onSelectComplaint: (id: string) => void;
}

export const DuplicateManager: React.FC<DuplicateManagerProps> = ({ onSelectComplaint }) => {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDuplicates();
  }, []);

  const fetchDuplicates = async () => {
    setIsLoading(true);
    try {
      const res = await api.getComplaints();
      if (res.success) {
        // Filter complaints with duplicate matches or flagged as duplicates
        const matched = res.complaints.filter((c: any) => c.is_duplicate_of);
        setComplaints(res.complaints);
      }
    } catch (err) {
      console.error('Failed to load duplicate matches:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-xl flex items-center justify-between">
        <div>
          <span className="px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-extrabold uppercase tracking-wider backdrop-blur-md">
            AI Pattern Intelligence
          </span>
          <h2 className="text-xl font-black mt-2 tracking-tight flex items-center gap-2">
            <Copy className="w-5 h-5" /> Duplicate & Similar Complaint Workstation
          </h2>
          <p className="text-amber-100 text-xs mt-1">
            Detect semantically identical complaints across campus, merge redundant reports, or mark as separate incidents.
          </p>
        </div>
      </div>

      {/* Info Card */}
      <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-extrabold text-sm mb-1">How AI Duplicate Detection Works</h4>
          <p className="leading-relaxed">
            When a new complaint is filed, the system performs a multi-dimensional comparison across NLP description TF-IDF text similarity, category matches, and geographical proximity (Building & Room ID). The administrator maintains complete authority to merge or separate complaints without data loss.
          </p>
        </div>
      </div>

      {/* Directory Table of Merged / Duplicate Complaints */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="font-extrabold text-slate-900 dark:text-white text-sm mb-4">
          Identified Duplicate Pairs & Merged Records
        </h3>

        {isLoading ? (
          <div className="py-12 text-center text-slate-400 font-bold text-xs">
            Scanning for duplicate pairs...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-extrabold uppercase text-[10px]">
                  <th className="py-3 px-4">Complaint ID</th>
                  <th className="py-3 px-4">Title & Symptom</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Duplicate Status</th>
                  <th className="py-3 px-4">Master Reference</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                {complaints.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {c.id}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold block text-slate-900 dark:text-white">{c.title}</span>
                      <span className="text-[10px] text-slate-400">{c.category_name}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold block">{c.building_name}</span>
                      <span className="text-[10px] text-slate-400">{c.room_area}</span>
                    </td>
                    <td className="py-3 px-4">
                      {c.is_duplicate_of ? (
                        <span className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-extrabold text-[10px]">
                          Merged Duplicate
                        </span>
                      ) : (
                        <StatusBadge status={c.status} size="sm" />
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold">
                      {c.is_duplicate_of ? (
                        <button onClick={() => onSelectComplaint(c.is_duplicate_of)} className="text-blue-600 underline">
                          {c.is_duplicate_of}
                        </button>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onSelectComplaint(c.id)}
                        className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[11px]"
                      >
                        Inspect →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
