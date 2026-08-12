import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Complaint } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { PlusCircle, Clock, CheckCircle2, AlertCircle, XCircle, FileText, Search } from 'lucide-react';

interface StudentDashboardProps {
  onFileNewComplaint: () => void;
  onSelectComplaint: (id: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onFileNewComplaint, onSelectComplaint }) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStudentComplaints();
  }, [filterStatus]);

  const fetchStudentComplaints = async () => {
    setIsLoading(true);
    try {
      const res = await api.getComplaints(filterStatus ? { status: filterStatus } : {});
      if (res.success) {
        setComplaints(res.complaints || []);
      }
    } catch (err) {
      console.error('Failed to load student complaints:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Metrics
  const total = complaints.length;
  const pending = complaints.filter(c => ['submitted', 'under_review', 'assigned', 'waiting_parts'].includes(c.status)).length;
  const inProgress = complaints.filter(c => c.status === 'in_progress').length;
  const resolved = complaints.filter(c => ['resolved', 'closed'].includes(c.status)).length;
  const rejected = complaints.filter(c => c.status === 'rejected').length;

  const filteredComplaints = complaints.filter(c => {
    if (!searchQuery) return true;
    const term = searchQuery.toLowerCase();
    return (
      c.id.toLowerCase().includes(term) ||
      c.title.toLowerCase().includes(term) ||
      (c.building_name || '').toLowerCase().includes(term) ||
      c.room_area.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-xl shadow-blue-600/15 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-md">
            Student Portal
          </span>
          <h2 className="text-2xl font-black mt-2 tracking-tight">Campus Facility Support Dashboard</h2>
          <p className="text-blue-100 text-xs mt-1 max-w-xl">
            Report facility defects, track resolution progress in real time, and view complete repair logs.
          </p>
        </div>

        <button
          onClick={onFileNewComplaint}
          className="px-6 py-3 rounded-2xl bg-white text-blue-700 font-extrabold text-xs shadow-lg hover:bg-blue-50 transition-colors flex items-center gap-2 shrink-0 self-start md:self-auto"
        >
          <PlusCircle className="w-5 h-5" /> File New Complaint
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">Total Submitted</span>
            <FileText className="w-4 h-4 text-blue-500" />
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-white">{total}</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{pending}</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">In Progress</span>
            <AlertCircle className="w-4 h-4 text-purple-500" />
          </div>
          <span className="text-2xl font-black text-purple-600 dark:text-purple-400">{inProgress}</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{resolved}</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">Rejected</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{rejected}</span>
        </div>
      </div>

      {/* Complaints Table Section */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
            My Submitted Complaints
          </h3>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Filter by title, ID or room..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              <option value="">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Table View */}
        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-xs font-bold">
            Loading complaints...
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <FileText className="w-10 h-10 mx-auto text-slate-400 mb-2" />
            <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">No complaints found</p>
            <p className="text-xs text-slate-400 mt-1">Submit a new complaint to start tracking infrastructure fixes.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-extrabold uppercase text-[10px]">
                  <th className="py-3 px-4">Complaint ID</th>
                  <th className="py-3 px-4">Category & Title</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Priority & Urgency</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Submitted Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                {filteredComplaints.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => onSelectComplaint(c.id)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {c.id}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-extrabold text-slate-900 dark:text-white block">
                        {c.title}
                      </span>
                      <span className="text-[10px] text-slate-400">{c.category_name}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold block">{c.building_name}</span>
                      <span className="text-[10px] text-slate-400">{c.room_area}</span>
                    </td>
                    <td className="py-3 px-4">
                      <PriorityBadge priority={c.priority} urgencyScore={c.urgency_score} />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={c.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button className="px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-[11px] hover:bg-blue-100">
                        View Details →
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
