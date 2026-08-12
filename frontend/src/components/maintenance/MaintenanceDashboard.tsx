import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Complaint } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { Wrench, CheckCircle2, Clock, AlertTriangle, Eye } from 'lucide-react';

interface MaintenanceDashboardProps {
  onSelectComplaint: (id: string) => void;
}

export const MaintenanceDashboard: React.FC<MaintenanceDashboardProps> = ({ onSelectComplaint }) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAssignedWork();
  }, []);

  const fetchAssignedWork = async () => {
    setIsLoading(true);
    try {
      const res = await api.getComplaints();
      if (res.success) {
        setComplaints(res.complaints || []);
      }
    } catch (err) {
      console.error('Failed to load maintenance work orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const activeWork = complaints.filter(c => ['assigned', 'in_progress', 'waiting_parts'].includes(c.status));
  const completedWork = complaints.filter(c => ['resolved', 'closed'].includes(c.status));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl flex items-center justify-between border border-slate-800">
        <div>
          <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-extrabold uppercase tracking-wider border border-amber-500/30">
            Maintenance Technician Workstation
          </span>
          <h2 className="text-xl font-black mt-2 tracking-tight flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-400" /> Assigned Work Orders Queue
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Execute facility repairs, post progress notes, and upload completion evidence photos.
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-500 block mb-1">Active Assigned Orders</span>
          <span className="text-3xl font-black text-amber-600 dark:text-amber-400">{activeWork.length}</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-500 block mb-1">In Progress Repairs</span>
          <span className="text-3xl font-black text-purple-600 dark:text-purple-400">
            {complaints.filter(c => c.status === 'in_progress').length}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-500 block mb-1">Completed Repairs</span>
          <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{completedWork.length}</span>
        </div>
      </div>

      {/* Active Work Orders Table */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
          My Active Work Orders (Sorted by Urgency)
        </h3>

        {isLoading ? (
          <div className="py-12 text-center text-slate-400 font-bold text-xs">
            Loading work orders...
          </div>
        ) : activeWork.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs font-bold border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            🎉 No active work orders pending. All assigned facility repairs are up to date!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-extrabold uppercase text-[10px]">
                  <th className="py-3 px-4">Complaint ID</th>
                  <th className="py-3 px-4">Defect & Title</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Priority & Urgency</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                {activeWork.map(c => (
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
                      <span className="text-[10px] text-slate-400">{c.room_area} ({c.floor})</span>
                    </td>
                    <td className="py-3 px-4">
                      <PriorityBadge priority={c.priority} urgencyScore={c.urgency_score} />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={c.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onSelectComplaint(c.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md"
                      >
                        Update Repair Work →
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
