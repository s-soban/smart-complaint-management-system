import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Complaint, ComplaintImage, StatusHistory, Comment, DuplicateMatch } from '../../types';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { TimelineTracker } from './TimelineTracker';
import { useAuth } from '../../context/AuthContext';
import { X, Calendar, MapPin, User, MessageSquare, Send, CheckCircle2, AlertTriangle, ShieldCheck, Sparkles, Image as ImageIcon } from 'lucide-react';

interface ComplaintDetailModalProps {
  complaintId: string;
  onClose: () => void;
  onRefresh?: () => void;
}

export const ComplaintDetailModal: React.FC<ComplaintDetailModalProps> = ({ complaintId, onClose, onRefresh }) => {
  const { user, role } = useAuth();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [images, setImages] = useState<ComplaintImage[]>([]);
  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [suggestedFix, setSuggestedFix] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // New Comment State
  const [newComment, setNewComment] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Admin Assignment / Status Override State
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<number | string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [statusComment, setStatusComment] = useState('');
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [repairFiles, setRepairFiles] = useState<File[]>([]);

  useEffect(() => {
    fetchDetails();
    if (role === 'admin') {
      api.getUsers('maintenance').then(res => {
        if (res.success) setStaffList(res.users);
      });
    }
  }, [complaintId]);

  const fetchDetails = async () => {
    setIsLoading(true);
    try {
      const res = await api.getComplaintById(complaintId);
      if (res.success) {
        setComplaint(res.complaint);
        setImages(res.images || []);
        setHistory(res.history || []);
        setComments(res.comments || []);
        setDuplicates(res.duplicates || []);
        setSuggestedFix(res.suggestedFix || '');
        setSelectedStaff(res.complaint.assigned_to || '');
        setSelectedStatus(res.complaint.status);
      }
    } catch (err) {
      console.error('Error fetching complaint details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setIsSubmittingComment(true);
    try {
      const res = await api.addComment(complaintId, newComment, isInternalComment);
      if (res.success) {
        setNewComment('');
        fetchDetails();
      }
    } catch (err) {
      alert('Failed to post remark');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleAssignStaff = async () => {
    if (!selectedStaff) return;
    try {
      const res = await api.assignComplaint(complaintId, Number(selectedStaff));
      if (res.success) {
        fetchDetails();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      alert('Failed to assign staff');
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedStatus) return;
    try {
      const formData = new FormData();
      formData.append('status', selectedStatus);
      formData.append('comment', statusComment);
      formData.append('resolution_summary', resolutionSummary);
      for (const f of repairFiles) {
        formData.append('repair_images', f);
      }

      const res = await api.updateComplaintStatus(complaintId, formData);
      if (res.success) {
        setStatusComment('');
        setResolutionSummary('');
        setRepairFiles([]);
        fetchDetails();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleMergeDuplicate = async (targetId: string, action: 'merge' | 'separate') => {
    try {
      const res = await api.handleDuplicate({
        master_complaint_id: complaintId,
        duplicate_complaint_id: targetId,
        action
      });
      if (res.success) {
        fetchDetails();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      alert('Action failed');
    }
  };

  const beforeImages = images.filter(img => img.image_type === 'before');
  const afterImages = images.filter(img => img.image_type === 'after');

  if (isLoading || !complaint) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Loading Complaint #{complaintId}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 transition-colors overflow-hidden">
        {/* Header Bar */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
                {complaint.id}
              </span>
              <StatusBadge status={complaint.status} size="md" />
              <PriorityBadge priority={complaint.priority} urgencyScore={complaint.urgency_score} />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mt-2">
              {complaint.title}
            </h2>
          </div>

          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Timeline */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-2">Complaint Status Lifecycle</h4>
            <TimelineTracker currentStatus={complaint.status} history={history} />
          </div>

          {/* Details & Location Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-slate-400 font-bold block">LOCATION & SITE</span>
              <div className="flex items-start gap-2 font-semibold text-slate-800 dark:text-slate-200">
                <MapPin className="w-4 h-4 text-blue-500 mt-0.5" />
                <div>
                  <span className="block font-bold">{complaint.building_name} ({complaint.building_code})</span>
                  <span className="text-slate-500">{complaint.room_area} ({complaint.floor})</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-slate-400 font-bold block">SUBMITTED BY</span>
              <div className="flex items-start gap-2 font-semibold text-slate-800 dark:text-slate-200">
                <User className="w-4 h-4 text-indigo-500 mt-0.5" />
                <div>
                  <span className="block font-bold">{complaint.submitter_name}</span>
                  <span className="text-slate-500">{complaint.submitter_dept} ({complaint.submitter_code})</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-slate-400 font-bold block">ASSIGNED MAINTENANCE</span>
              <div className="flex items-start gap-2 font-semibold text-slate-800 dark:text-slate-200">
                <ShieldCheck className="w-4 h-4 text-emerald-500 mt-0.5" />
                <div>
                  <span className="block font-bold">{complaint.assignee_name || 'Unassigned'}</span>
                  {complaint.assignee_email && <span className="text-slate-500">{complaint.assignee_email}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Description & Priority Reason */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
            <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">Issue Description</h4>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm whitespace-pre-line">
              {complaint.description}
            </p>
            {complaint.priority_reason && (
              <p className="text-[11px] text-slate-400 italic pt-2 border-t border-slate-200 dark:border-slate-700">
                AI Priority Reason: {complaint.priority_reason}
              </p>
            )}
          </div>

          {/* Resolved Resolution Summary */}
          {complaint.resolution_summary && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1">
              <h4 className="font-extrabold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Resolution Completed
              </h4>
              <p className="text-emerald-700 dark:text-emerald-200">{complaint.resolution_summary}</p>
              {complaint.resolved_at && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block pt-1">
                  Resolved on: {new Date(complaint.resolved_at).toLocaleString()}
                </span>
              )}
            </div>
          )}

          {/* Photos Comparison (Before / After) */}
          <div>
            <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm mb-3 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-blue-500" /> Photo Evidence (Before vs After Repair)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Before Images */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-rose-600 dark:text-rose-400 block mb-2 text-xs">
                  📸 BEFORE REPAIR (Student Uploaded)
                </span>
                {beforeImages.length === 0 ? (
                  <p className="text-slate-400 italic text-xs">No before photos attached.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {beforeImages.map(img => (
                      <a key={img.id} href={img.image_url} target="_blank" rel="noreferrer">
                        <img
                          src={img.image_url}
                          alt="Before repair"
                          className="w-full h-32 object-cover rounded-xl border border-slate-200 dark:border-slate-700 hover:opacity-90"
                        />
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* After Images */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-emerald-600 dark:text-emerald-400 block mb-2 text-xs">
                  ✨ AFTER REPAIR (Maintenance Completed)
                </span>
                {afterImages.length === 0 ? (
                  <p className="text-slate-400 italic text-xs">No completion photos uploaded yet.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {afterImages.map(img => (
                      <a key={img.id} href={img.image_url} target="_blank" rel="noreferrer">
                        <img
                          src={img.image_url}
                          alt="After repair"
                          className="w-full h-32 object-cover rounded-xl border border-slate-200 dark:border-slate-700 hover:opacity-90"
                        />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Admin Management Actions Panel */}
          {role === 'admin' && (
            <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 space-y-4">
              <h4 className="font-extrabold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Administrative Workstation Controls
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Staff Assignment */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Assign Maintenance Staff
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={selectedStaff}
                      onChange={e => setSelectedStaff(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                    >
                      <option value="">-- Unassigned --</option>
                      {staffList.map(s => (
                        <option key={s.id} value={s.id}>{s.full_name} ({s.department})</option>
                      ))}
                    </select>
                    <button
                      onClick={handleAssignStaff}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs"
                    >
                      Assign
                    </button>
                  </div>
                </div>

                {/* Status Update */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Update Status
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={selectedStatus}
                      onChange={e => setSelectedStatus(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                    >
                      <option value="submitted">Submitted</option>
                      <option value="under_review">Under Review</option>
                      <option value="assigned">Assigned</option>
                      <option value="in_progress">In Progress</option>
                      <option value="waiting_parts">Waiting Parts</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <button
                      onClick={handleStatusUpdate}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs"
                    >
                      Update
                    </button>
                  </div>
                </div>
              </div>

              {/* Duplicates Classifier Panel if matches found */}
              {duplicates.length > 0 && (
                <div className="pt-3 border-t border-indigo-200 dark:border-indigo-800">
                  <span className="font-extrabold text-amber-700 dark:text-amber-300 block mb-2">
                    ⚠️ AI Duplicate Match Workspace ({duplicates.length} match)
                  </span>
                  <div className="space-y-2">
                    {duplicates.map(d => (
                      <div key={d.id} className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white">
                            Match: {d.target_title || d.target_complaint_id} ({d.similarity_score}% similarity)
                          </span>
                          <span className="block text-[10px] text-slate-400">
                            Location: {d.target_building} - {d.target_room} | Status: {d.status}
                          </span>
                        </div>
                        {d.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleMergeDuplicate(d.target_complaint_id, 'merge')}
                              className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-bold text-[10px]"
                            >
                              Merge
                            </button>
                            <button
                              onClick={() => handleMergeDuplicate(d.target_complaint_id, 'separate')}
                              className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[10px]"
                            >
                              Mark Separate
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Maintenance Workstation Controls */}
          {role === 'maintenance' && (
            <div className="p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 space-y-4">
              <h4 className="font-extrabold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                🛠️ Maintenance Repair Workstation
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Set Work Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={e => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                  >
                    <option value="in_progress">In Progress</option>
                    <option value="waiting_parts">Waiting for Parts</option>
                    <option value="resolved">Resolved & Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Upload After-Repair Photo
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={e => setRepairFiles(Array.from(e.target.files || []))}
                    className="w-full text-xs text-slate-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Resolution / Repair Log Summary
                  </label>
                  <textarea
                    rows={2}
                    placeholder={suggestedFix || 'Describe technical repair action taken...'}
                    value={resolutionSummary}
                    onChange={e => setResolutionSummary(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                  {suggestedFix && (
                    <button
                      type="button"
                      onClick={() => setResolutionSummary(suggestedFix)}
                      className="text-[10px] text-blue-600 font-bold mt-1"
                    >
                      ✨ Use AI Suggested Resolution: "{suggestedFix}"
                    </button>
                  )}
                </div>
              </div>

              <button
                onClick={handleStatusUpdate}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md"
              >
                Submit Repair Update
              </button>
            </div>
          )}

          {/* Activity Comments & Remarks */}
          <div>
            <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-500" /> Activity Remarks & Discussion
            </h4>

            <div className="space-y-3 mb-4 max-h-48 overflow-y-auto pr-1">
              {comments.length === 0 ? (
                <p className="text-slate-400 italic text-xs">No remarks posted yet.</p>
              ) : (
                comments.map(c => (
                  <div key={c.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 dark:text-slate-100">
                        {c.user_name} ({c.user_role.toUpperCase()})
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(c.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300">{c.comment_text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                placeholder="Write a comment or remark..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                className="flex-1 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-900 dark:text-slate-100"
              />
              {role !== 'student' && (
                <label className="flex items-center gap-1 text-[10px] text-slate-500 font-bold px-2">
                  <input
                    type="checkbox"
                    checked={isInternalComment}
                    onChange={e => setIsInternalComment(e.target.checked)}
                  />
                  Internal
                </label>
              )}
              <button
                type="submit"
                disabled={isSubmittingComment}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Post
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
