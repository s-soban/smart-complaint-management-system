export type Role = 'student' | 'admin' | 'maintenance';

export type Priority = 'critical' | 'high' | 'medium' | 'low';

export type Status = 
  | 'submitted' 
  | 'under_review' 
  | 'assigned' 
  | 'in_progress' 
  | 'waiting_parts' 
  | 'resolved' 
  | 'closed' 
  | 'rejected';

export interface User {
  id: number;
  full_name: string;
  user_id_code: string;
  email: string;
  phone?: string;
  department?: string;
  year_class?: string;
  role: Role;
  created_at?: string;
}

export interface Building {
  id: number;
  name: string;
  code: string;
  description?: string;
  total_floors: number;
  latitude?: number;
  longitude?: number;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  icon: string;
  default_priority: Priority;
}

export interface ComplaintImage {
  id: number;
  complaint_id: string;
  image_url: string;
  image_type: 'before' | 'after';
  uploaded_by: number;
  uploader_name?: string;
  created_at: string;
}

export interface StatusHistory {
  id: number;
  complaint_id: string;
  from_status?: Status;
  to_status: Status;
  changed_by: number;
  changed_by_name: string;
  changed_by_role: Role;
  comment?: string;
  created_at: string;
}

export interface Comment {
  id: number;
  complaint_id: string;
  user_id: number;
  user_name: string;
  user_role: Role;
  comment_text: string;
  is_internal: number;
  created_at: string;
}

export interface DuplicateMatch {
  id: number;
  source_complaint_id: string;
  target_complaint_id: string;
  target_title?: string;
  target_status?: Status;
  target_building?: string;
  target_room?: string;
  target_upvote_count?: number;
  similarity_score: number;
  status: 'pending' | 'merged' | 'separated' | 'ignored';
  created_at: string;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category_id: number;
  category_name?: string;
  category_icon?: string;
  issue_type?: string;
  building_id: number;
  building_name?: string;
  building_code?: string;
  floor?: string;
  room_area: string;
  date_noticed?: string;
  contact_phone?: string;
  priority: Priority;
  urgency_score: number;
  priority_reason?: string;
  status: Status;
  submitted_by: number;
  submitter_name?: string;
  submitter_email?: string;
  submitter_phone?: string;
  submitter_code?: string;
  submitter_dept?: string;
  assigned_to?: number;
  assignee_name?: string;
  assignee_email?: string;
  assignee_phone?: string;
  is_duplicate_of?: string;
  upvote_count?: number;
  resolution_summary?: string;
  resolved_at?: string;
  closed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'critical' | 'success';
  is_read: number;
  link?: string;
  created_at: string;
}

export interface ProblemSite {
  building_id: number;
  building_name: string;
  building_code: string;
  room_area: string;
  total_complaints: number;
  unresolved_count: number;
  critical_count: number;
  last_reported: string;
  primary_category: string;
  highest_priority: Priority;
}

export interface RepairedSite {
  complaint_id: string;
  title: string;
  description: string;
  resolution_summary?: string;
  resolved_at: string;
  room_area: string;
  building_name: string;
  category_name: string;
  resolved_by_staff?: string;
  before_image?: string;
  after_image?: string;
}

export interface AIInsight {
  type: 'warning' | 'alert' | 'info';
  title: string;
  description: string;
  location: string;
  recommendedAction: string;
}

export interface AnalyticsKPIs {
  total: number;
  newSubmitted: number;
  pendingTotal: number;
  inProgress: number;
  criticalActive: number;
  resolvedTotal: number;
  overdueCount: number;
  resolutionRate: number;
  avgResolutionHours: number;
}
