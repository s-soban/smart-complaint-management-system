import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Complaint, Building, Category, User } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { Search, Filter, ArrowUpDown, UserPlus, Eye, AlertTriangle } from 'lucide-react';

interface AllComplaintsTableProps {
  onSelectComplaint: (id: string) => void;
}

export const AllComplaintsTable: React.FC<AllComplaintsTableProps> = ({ onSelectComplaint }) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [staffMembers, setStaffMembers] = useState<User[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [buildingId, setBuildingId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [sort, setSort] = useState('newest');

  const [isLoading, setIsLoading] = useState(true);

  // Assign Modal state
  const [assignTargetId, setAssignTargetId] = useState<string | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');

  useEffect(() => {
    loadFilterOptions();
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [status, priority, buildingId, categoryId, assignedTo, sort]);

  const loadFilterOptions = async () => {
    try {
      const [bRes, cRes, uRes] = await Promise.all([
        api.getBuildings(),
        api.getCategories(),
        api.getUsers('maintenance')
      ]);
      if (bRes.success) setBuildings(bRes.buildings);
      if (cRes.success) setCategories(cRes.categories);
      if (uRes.success) setStaffMembers(uRes.users);
    } catch (err) {
      console.error('Failed to load filter options:', err);
    }
  };

  const fetchComplaints = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = { sort };
      if (status) params.status = status;
      if (priority) params.priority = priority;
      if (buildingId) params.building_id = buildingId;
      if (categoryId) params.category_id = categoryId;
      if (assignedTo) params.assigned_to = assignedTo;
      if (search) params.search = search;

      const res = await api.getComplaints(params);
      if (res.success) {
        setComplaints(res.complaints || []);
      }
    } catch (err) {
      console.error('Failed to load complaints:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchComplaints();
  };

  const executeAssignment = async () => {
    if (!assignTargetId || !selectedStaffId) return;
    try {
      const res = await api.assignComplaint(assignTargetId, Number(selectedStaffId));
      if (res.success) {
        setAssignTargetId(null);
        fetchComplaints();
      }
    } catch (err) {
      alert('Failed to assign staff member');
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-600" /> Advanced Complaint Directory
          </h3>
          <span className="text-xs font-mono font-bold text-slate-500">
            {complaints.length} complaints matched
          </span>
        </div>

        {/* Filter Controls Grid */}
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {/* Search */}
          <div className="sm:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search ID, title, student, room..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>

          {/* Status */}
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
          >
            <option value="">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="waiting_parts">Waiting Parts</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Priority */}
          <select
            value={priority}
            onChange={e => setPriority(e.target.value)}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
          >
            <option value="">All Priorities</option>
            <option value="critical">🚨 Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Building */}
          <select
            value={buildingId}
            onChange={e => setBuildingId(e.target.value)}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
          >
            <option value="">All Buildings</option>
            {buildings.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="priority_desc">Highest Urgency Score</option>
            <option value="pending_longest">Pending Longest</option>
          </select>
        </form>
      </div>

      {/* Main Table */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center text-slate-400 font-bold text-xs">
            Filtering complaint database...
          </div>
        ) : complaints.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs font-bold">
            No complaints match the selected filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-extrabold uppercase text-[10px]">
                  <th className="py-3 px-4">Complaint ID</th>
                  <th className="py-3 px-4">Title & Category</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Student Submitter</th>
                  <th className="py-3 px-4">Priority & Urgency</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned Staff</th>
                  <th className="py-3 px-4 text-center">Upvotes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                {complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td
                      onClick={() => onSelectComplaint(c.id)}
                      className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400 cursor-pointer hover:underline"
                    >
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
                      <span className="font-bold block">{c.submitter_name}</span>
                      <span className="text-[10px] text-slate-400">{c.submitter_dept}</span>
                    </td>
                    <td className="py-3 px-4">
                      <PriorityBadge priority={c.priority} urgencyScore={c.urgency_score} />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={c.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 font-bold">
                      {c.assignee_name ? (
                        <span className="text-slate-900 dark:text-slate-200">{c.assignee_name}</span>
                      ) : (
                        <span className="text-amber-500 text-[11px] italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-extrabold px-2 py-0.5 rounded-full text-[11px] border border-blue-200 dark:border-blue-800">
                        👍 {c.upvote_count || 1}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={async () => {
                          try {
                            const res = await api.supportComplaint(c.id);
                            if (res.success) fetchComplaints();
                          } catch (e: any) {
                            alert(e.message || 'Error supporting complaint');
                          }
                        }}
                        className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[10px] shadow-sm"
                        title="Upvote complaint"
                      >
                        👍 Upvote
                      </button>
                      <button
                        onClick={() => {
                          setAssignTargetId(c.id);
                          setSelectedStaffId(c.assigned_to ? String(c.assigned_to) : '');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-[11px] hover:bg-indigo-100"
                        title="Assign Maintenance Staff"
                      >
                        <UserPlus className="w-3.5 h-3.5 inline mr-1" /> Assign
                      </button>
                      <button
                        onClick={() => onSelectComplaint(c.id)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[11px]"
                      >
                        <Eye className="w-3.5 h-3.5 inline mr-1" /> Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Assign Modal */}
      {assignTargetId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base mb-2">
              Assign Maintenance Staff to #{assignTargetId}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Select a qualified technician to take ownership of this work order.
            </p>

            <select
              value={selectedStaffId}
              onChange={e => setSelectedStaffId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 mb-6"
            >
              <option value="">-- Choose Maintenance Specialist --</option>
              {staffMembers.map(s => (
                <option key={s.id} value={s.id}>
                  {s.full_name} ({s.department})
                </option>
              ))}
            </select>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setAssignTargetId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={executeAssignment}
                disabled={!selectedStaffId}
                className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md hover:bg-indigo-500 disabled:opacity-50"
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
