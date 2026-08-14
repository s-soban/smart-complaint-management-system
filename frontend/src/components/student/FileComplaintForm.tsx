import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { Building, Category } from '../../types';
import { PriorityBadge } from '../common/PriorityBadge';
import { Upload, Sparkles, AlertTriangle, CheckCircle, X, Image as ImageIcon, Info } from 'lucide-react';

interface FileComplaintFormProps {
  onSuccess: (complaintId: string) => void;
  onCancel?: () => void;
}

export const FileComplaintForm: React.FC<FileComplaintFormProps> = ({ onSuccess, onCancel }) => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [issueType, setIssueType] = useState('');
  const [buildingId, setBuildingId] = useState<string>('');
  const [floor, setFloor] = useState('Ground Floor');
  const [roomArea, setRoomArea] = useState('');
  const [dateNoticed, setDateNoticed] = useState(new Date().toISOString().substring(0, 10));
  const [contactPhone, setContactPhone] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  // AI Live Insights State
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateMatches, setDuplicateMatches] = useState<any[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [bData, cData] = await Promise.all([api.getBuildings(), api.getCategories()]);
        if (bData.success) setBuildings(bData.buildings);
        if (cData.success) setCategories(cData.categories);
      } catch (err) {
        console.error('Failed to load form options:', err);
      }
    }
    loadData();
  }, []);

  // Prevent browser default drag-and-drop behavior (opening dropped files in a new tab)
  useEffect(() => {
    const preventGlobalDrop = (e: DragEvent) => {
      e.preventDefault();
    };
    window.addEventListener('dragover', preventGlobalDrop);
    window.addEventListener('drop', preventGlobalDrop);
    return () => {
      window.removeEventListener('dragover', preventGlobalDrop);
      window.removeEventListener('drop', preventGlobalDrop);
    };
  }, []);

  // Debounced AI Live Auto-Categorize & Priority Analysis
  useEffect(() => {
    if (description.length < 8) {
      setAiAnalysis(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsAnalyzing(true);
      try {
        const res = await api.aiAnalyzeComplaint({
          title,
          description,
          building_id: buildingId,
          room_area: roomArea
        });

        if (res.success) {
          setAiAnalysis(res);
          // Auto-select predicted category if student hasn't selected manually
          if (!categoryId && res.categoryPrediction?.categoryId) {
            setCategoryId(String(res.categoryPrediction.categoryId));
          }
          if (res.duplicateMatches && res.duplicateMatches.length > 0) {
            setDuplicateMatches(res.duplicateMatches);
          }
        }
      } catch (err) {
        console.error('AI analyze error:', err);
      } finally {
        setIsAnalyzing(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [title, description, buildingId, roomArea]);


const processImageFiles = (fileList: File[]) => {
  const remainingSlots = 5 - images.length;

  if (remainingSlots <= 0) {
    alert('You can upload a maximum of 5 photos.');
    return;
  }

  const filesToProcess = fileList.slice(0, remainingSlots);

  const validFiles: File[] = [];
  const newPreviews: string[] = [];

  for (const file of filesToProcess) {
    // Check image type
    if (!file.type.startsWith('image/')) {
      alert(`${file.name} is not a valid image file.`);
      continue;
    }

    // Check file size
    if (file.size > 10 * 1024 * 1024) {
      alert(`${file.name} exceeds the 10MB limit.`);
      continue;
    }

    validFiles.push(file);
    newPreviews.push(URL.createObjectURL(file));
  }

  setImages(prev => [...prev, ...validFiles]);
  setImagePreviews(prev => [...prev, ...newPreviews]);
};

const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files && e.target.files.length > 0) {
    processImageFiles(Array.from(e.target.files));
  }

  // Allows selecting the same image again
  e.target.value = '';
};

const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
  e.preventDefault();
  e.stopPropagation();
  setIsDragging(true);
};

const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
  e.preventDefault();
  e.stopPropagation();
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'copy';
  }
  setIsDragging(true);
};

const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
  e.preventDefault();
  e.stopPropagation();
  if (e.currentTarget && !e.currentTarget.contains(e.relatedTarget as Node)) {
    setIsDragging(false);
  }
};

const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
  e.preventDefault();
  e.stopPropagation();
  setIsDragging(false);

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
    processImageFiles(droppedFiles);
  }
};

const openFilePicker = () => {
  fileInputRef.current?.click();
};



  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !buildingId || !roomArea.trim()) {
      setErrorMsg('Please fill in all required fields (Title, Description, Building, Room/Area).');
      return;
    }

    // Check if duplicate modal should pop up first before proceeding
    if (duplicateMatches.length > 0 && !showDuplicateModal) {
      setShowDuplicateModal(true);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category_id', categoryId);
      formData.append('issue_type', issueType || 'General Defect');
      formData.append('building_id', buildingId);
      formData.append('floor', floor);
      formData.append('room_area', roomArea);
      formData.append('date_noticed', dateNoticed);
      formData.append('contact_phone', contactPhone);

      for (const img of images) {
        formData.append('images', img);
      }

      const res = await api.createComplaint(formData);
      if (res.success) {
        onSuccess(res.complaintId);
      } else {
        setErrorMsg(res.message || 'Submission failed');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-600" />
            File New Facility Complaint
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Submit infrastructure issues for swift administrative review & maintenance dispatch.
          </p>
        </div>
        {onCancel && (
          <button onClick={onCancel} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold">
          ⚠️ {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Form Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Title */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Complaint Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Ceiling fan vibrating and producing loud squeaking noise"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Location Details */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Campus Building / Complex <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={buildingId}
              onChange={e => setBuildingId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Campus Building --</option>
              {buildings.map(b => (
                <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Room / Specific Area <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Room 204 / 2nd Floor Washroom"
              value={roomArea}
              onChange={e => setRoomArea(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Floor Level
            </label>
            <select
              value={floor}
              onChange={e => setFloor(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-sm"
            >
              <option value="Ground Floor">Ground Floor</option>
              <option value="1st Floor">1st Floor</option>
              <option value="2nd Floor">2nd Floor</option>
              <option value="3rd Floor">3rd Floor</option>
              <option value="4th Floor">4th Floor</option>
              <option value="Basement / Service Level">Basement / Service Level</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Category (AI Auto-Suggests below)
            </label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 font-bold"
            >
              <option value="">-- Select Category --</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Detailed Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder="Describe the defect, exact symptoms, potential causes, or safety hazards..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* AI Intelligence Live Box */}
          {(isAnalyzing || aiAnalysis) && (
            <div className="md:col-span-2 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800/80 dark:to-indigo-950/40 border border-blue-200 dark:border-indigo-800/50 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase text-blue-700 dark:text-blue-300 tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600 animate-spin" />
                  AI Intelligence Assistant Analysis
                </span>
                {isAnalyzing && <span className="text-[11px] text-blue-600 font-medium">Analyzing text...</span>}
              </div>

              {aiAnalysis && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block font-medium">Suggested Category:</span>
                    <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                      {aiAnalysis.categoryPrediction?.categoryName} ({aiAnalysis.categoryPrediction?.confidence}% confidence)
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">{aiAnalysis.categoryPrediction?.reasoning}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block font-medium">Predicted Priority & Urgency:</span>
                    <PriorityBadge
                      priority={aiAnalysis.priorityUrgency?.priority}
                      urgencyScore={aiAnalysis.priorityUrgency?.urgencyScore}
                    />
                    <p className="text-[11px] text-slate-500 mt-0.5">{aiAnalysis.priorityUrgency?.reason}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Date Noticed & Contact */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Date First Noticed
            </label>
            <input
              type="date"
              value={dateNoticed}
              onChange={e => setDateNoticed(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Optional Phone Contact
            </label>
            <input
              type="tel"
              placeholder="e.g. +1 555-0199"
              value={contactPhone}
              onChange={e => setContactPhone(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-sm"
            />
          </div>

            {/* File Upload Section */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Upload Evidence Photos (Multiple supported)
              </label>

              <div
                onClick={openFilePicker}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer select-none ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 ring-4 ring-blue-500/20'
                    : 'border-slate-300 dark:border-slate-700 hover:border-blue-500 bg-slate-50/50 dark:bg-slate-800/30'
                }`}
              >
                <Upload
                  className={`w-9 h-9 mx-auto mb-2 transition-transform duration-200 ${
                    isDragging ? 'text-blue-600 scale-110' : 'text-slate-400'
                  }`}
                />

                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  {isDragging ? (
                    <span className="text-blue-600 font-extrabold text-sm">
                      ✨ Drop your photos here to attach
                    </span>
                  ) : (
                    <>
                      Drag & drop photos here, or{' '}
                      <span className="text-blue-600 dark:text-blue-400 underline font-bold hover:text-blue-700">
                        browse files / open gallery
                      </span>
                    </>
                  )}
                </p>

                <p className="text-[11px] text-slate-400 mt-1">
                  Supports JPG, PNG, WEBP, GIF up to 10MB each • Maximum 5 photos
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,image/heic,image/heif"
                  onChange={handleImageChange}
                  onClick={(e) => e.stopPropagation()}
                  className="hidden"
                  id="file-upload-input"
                />

                {/* Photos Grid inside Upload Box */}
                {imagePreviews.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex flex-wrap justify-center items-center gap-3">
                      {imagePreviews.map((src, i) => (
                        <div
                          key={`${src}-${i}`}
                          className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-white dark:border-slate-700 shadow-md group transition-transform hover:scale-105"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <img
                            src={src}
                            alt={`Evidence photo ${i + 1}`}
                            className="w-full h-full object-cover"
                          />

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(i);
                            }}
                            className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-rose-600 text-white opacity-90 group-hover:opacity-100 hover:bg-rose-700 transition-all shadow-md"
                            title="Remove photo"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>

                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[10px] py-1 font-bold">
                            Photo {i + 1}
                          </div>
                        </div>
                      ))}

                      {images.length < 5 && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            openFilePicker();
                          }}
                          className="w-24 h-24 rounded-xl border-2 border-dashed border-blue-400 dark:border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 flex flex-col items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-100/60 dark:hover:bg-blue-900/40 transition-colors cursor-pointer"
                        >
                          <ImageIcon className="w-6 h-6 mb-1" />
                          <span className="text-[10px] font-bold">+ Add Photo</span>
                        </div>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 font-semibold">
                      {images.length} / 5 photos attached
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-blue-500/25 hover:opacity-95 transition-opacity flex items-center gap-2"
          >
            {isSubmitting ? 'Submitting Complaint...' : 'Submit Complaint'}
            <CheckCircle className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Duplicate Alert Modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-amber-500/30">
            <div className="flex items-center gap-3 text-amber-600 mb-4">
              <AlertTriangle className="w-8 h-8 shrink-0" />
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Possible Duplicate Complaint Found
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  AI detected existing active complaints reported at this location.
                </p>
              </div>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto my-4 pr-1">
              {duplicateMatches.map((dup, i) => (
                <div key={i} className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-900 dark:text-slate-100">
                    <span>{dup.complaintId}: {dup.title}</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 text-[10px] font-black">
                      {dup.similarityScore}% Similar
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 mt-1">{dup.reason}</p>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-500 mb-6">
              You may still proceed to file your complaint if this is a separate issue.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDuplicateModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700"
              >
                Review My Input
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDuplicateModal(false);
                  handleSubmit(new Event('submit') as any);
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 text-white shadow-md"
              >
                Proceed & Submit Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
