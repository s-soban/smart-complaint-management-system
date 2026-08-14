import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { Complaint, ComplaintImage, StatusHistory, Comment, DuplicateMatch } from '../../types';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { TimelineTracker } from './TimelineTracker';
import { useAuth } from '../../context/AuthContext';
import { X, Calendar, MapPin, User, MessageSquare, Send, CheckCircle2, AlertTriangle, ShieldCheck, Sparkles, Image as ImageIcon, Upload } from 'lucide-react';

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
  const [repairPreviews, setRepairPreviews] = useState<string[]>([]);
  const [isRepairDragging, setIsRepairDragging] = useState(false);
  const repairFileInputRef = useRef<HTMLInputElement>(null);

  // Lightbox State
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null);

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
        setRepairPreviews([]);
        fetchDetails();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const processRepairFiles = (fileList: File[]) => {
    const remainingSlots = 5 - repairFiles.length;
    if (remainingSlots <= 0) {
      alert('You can upload a maximum of 5 completion photos.');
      return;
    }

    const filesToProcess = fileList.slice(0, remainingSlots);
    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const file of filesToProcess) {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not a valid image file.`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} exceeds the 10MB limit.`);
        continue;
      }
      validFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    setRepairFiles(prev => [...prev, ...validFiles]);
    setRepairPreviews(prev => [...prev, ...newPreviews]);
  };

  const handleRepairFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processRepairFiles(Array.from(e.target.files));
    }
    e.target.value = '';
  };

  const removeRepairImage = (index: number) => {
    setRepairFiles(prev => prev.filter((_, i) => i !== index));
    setRepairPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleRepairDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsRepairDragging(true);
  };

  const handleRepairDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
    setIsRepairDragging(true);
  };

  const handleRepairDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget && !e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsRepairDragging(false);
    }
  };

  const handleRepairDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsRepairDragging(false);

    let droppedFiles: File[] = [];
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      droppedFiles = Array.from(e.dataTransfer.files);
    } else if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      for (let i = 0; i < e.dataTransfer.items.length; i++) {
        const item = e.dataTransfer.items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) droppedFiles.push(file);
        }
      }
    }

    if (droppedFiles.length > 0) {
      processRepairFiles(droppedFiles);
    }
  };

  const openRepairFilePicker = () => {
    repairFileInputRef.current?.click();
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
                      <div
                        key={img.id}
                        onClick={() => setActiveLightboxImage(img.image_url)}
                        className="relative h-32 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group cursor-pointer shadow-sm hover:shadow-md transition-all"
                      >
                        <img
                          src={img.image_url}
                          alt="Before repair evidence"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/uploads/complaints/sample-before-1.svg';
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-bold gap-1">
                          <ImageIcon className="w-4 h-4" /> Click to view
                        </div>
                      </div>
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
                      <div
                        key={img.id}
                        onClick={() => setActiveLightboxImage(img.image_url)}
                        className="relative h-32 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group cursor-pointer shadow-sm hover:shadow-md transition-all"
                      >
                        <img
                          src={img.image_url}
                          alt="After repair evidence"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/uploads/repairs/sample-after-1.svg';
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-bold gap-1">
                          <ImageIcon className="w-4 h-4" /> Click to view
                        </div>
                      </div>
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

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Upload After-Repair Completion Photos
                  </label>

                  <div
                    onClick={openRepairFilePicker}
                    onDragEnter={handleRepairDragEnter}
                    onDragOver={handleRepairDragOver}
                    onDragLeave={handleRepairDragLeave}
                    onDrop={handleRepairDrop}
                    className={`relative border-2 border-dashed rounded-2xl p-4 text-center transition-all cursor-pointer select-none ${
                      isRepairDragging
                        ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 ring-4 ring-emerald-500/20'
                        : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500 bg-white/60 dark:bg-slate-800/40'
                    }`}
                  >
                    <Upload
                      className={`w-7 h-7 mx-auto mb-1 transition-transform duration-200 ${
                        isRepairDragging ? 'text-emerald-600 scale-110' : 'text-slate-400'
                      }`}
                    />

                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      {isRepairDragging ? (
                        <span className="text-emerald-600 font-extrabold text-xs">
                          ✨ Drop completion photos here to attach
                        </span>
                      ) : (
                        <>
                          Drag & drop repair photos here, or{' '}
                          <span className="text-emerald-600 dark:text-emerald-400 underline font-bold hover:text-emerald-700">
                            browse files / open gallery
                          </span>
                        </>
                      )}
                    </p>

                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Supports JPG, PNG, WEBP up to 10MB each • Max 5 completion photos
                    </p>

                    <input
                      ref={repairFileInputRef}
                      type="file"
                      multiple
                      accept="image/*,image/heic,image/heif"
                      onChange={handleRepairFileChange}
                      onClick={(e) => e.stopPropagation()}
                      className="hidden"
                      id="repair-file-upload-input"
                    />

                    {repairPreviews.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex flex-wrap justify-center items-center gap-2.5">
                          {repairPreviews.map((src, i) => (
                            <div
                              key={`${src}-${i}`}
                              className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-white dark:border-slate-700 shadow-md group transition-transform hover:scale-105"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <img
                                src={src}
                                alt={`Repair photo ${i + 1}`}
                                className="w-full h-full object-cover"
                              />

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeRepairImage(i);
                                }}
                                className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full bg-rose-600 text-white opacity-90 group-hover:opacity-100 hover:bg-rose-700 transition-all shadow-md"
                                title="Remove photo"
                              >
                                <X className="w-3 h-3" />
                              </button>

                              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[9px] py-0.5 font-bold">
                                Repair {i + 1}
                              </div>
                            </div>
                          ))}

                          {repairFiles.length < 5 && (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                openRepairFilePicker();
                              }}
                              className="w-20 h-20 rounded-xl border-2 border-dashed border-emerald-400 dark:border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 flex flex-col items-center justify-center text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer"
                            >
                              <ImageIcon className="w-5 h-5 mb-0.5" />
                              <span className="text-[9px] font-bold">+ Add Photo</span>
                            </div>
                          )}
                        </div>

                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-semibold">
                          {repairFiles.length} / 5 completion photos attached
                        </p>
                      </div>
                    )}
                  </div>
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
      {/* In-App Lightbox Photo Viewer */}
      {activeLightboxImage && (
        <div
          className="fixed inset-0 z-[60] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setActiveLightboxImage(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-slate-900/90 flex items-center justify-between border-b border-slate-800">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-400" /> Photo Evidence Detail
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={activeLightboxImage}
                  download={`complaint-evidence-${complaintId}.png`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors shadow-md"
                >
                  Download / Original
                </a>
                <button
                  onClick={() => setActiveLightboxImage(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-800 text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 flex flex-col items-center justify-center bg-slate-950/90 min-h-[350px] flex-1">
              <img
                src={activeLightboxImage}
                alt="Full photo evidence"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%230F172A"/><rect x="40" y="40" width="520" height="320" rx="20" fill="%231E293B" stroke="%23334155" stroke-width="3"/><circle cx="300" cy="170" r="50" fill="%233B82F6" opacity="0.2"/><path d="M 280 170 L 320 170 M 300 150 L 300 190" stroke="%233B82F6" stroke-width="6" stroke-linecap="round"/><text x="50%25" y="250" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20" font-weight="bold" fill="%23F8FAFC">Photo Evidence Uploaded</text><text x="50%25" y="290" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="13" fill="%2394A3B8">Smart Complaint Management System</text></svg>`;
                }}
                className="max-w-full max-h-[70vh] object-contain rounded-2xl shadow-2xl border border-slate-800/80 bg-slate-900"
              />
              <p className="text-[11px] text-slate-400 mt-3 font-semibold">
                Photo Evidence for Complaint #{complaintId}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
