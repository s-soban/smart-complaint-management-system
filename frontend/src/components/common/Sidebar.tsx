import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  Copy,
  Building2,
  Users,
  FolderKanban,
  BarChart3,
  CheckCircle2,
  Wrench,
  Sparkles,
  ShieldCheck,
  Bell
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { role } = useAuth();

  const studentNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'file-complaint', label: 'File Complaint', icon: PlusCircle, highlight: true },
    { id: 'my-complaints', label: 'My Complaints', icon: FileText },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ];

  const adminNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'all-complaints', label: 'All Complaints', icon: FolderKanban },
    { id: 'duplicates', label: 'Duplicate Detection', icon: Copy },
    { id: 'campus-insights', label: 'Campus Insights', icon: Building2 },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'users', label: 'User Roles', icon: Users },
    { id: 'categories', label: 'Categories & Locations', icon: Wrench }
  ];

  const maintenanceNav = [
    { id: 'dashboard', label: 'Assigned Work Orders', icon: LayoutDashboard },
    { id: 'in-progress', label: 'In Progress Repairs', icon: Wrench },
    { id: 'history', label: 'Repair History', icon: CheckCircle2 }
  ];

  let navItems = studentNav;
  if (role === 'admin') navItems = adminNav;
  if (role === 'maintenance') navItems = maintenanceNav;

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-screen flex flex-col border-r border-slate-800 shrink-0">
      {/* Brand Header */}
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h1 className="font-extrabold text-white text-base leading-tight tracking-tight">
            EduFix Smart
          </h1>
          <p className="text-[11px] text-slate-400 font-medium">Campus Infrastructure</p>
        </div>
      </div>

      {/* Role Banner */}
      <div className="px-4 py-3 mx-4 mt-4 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-blue-400" />
        <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
          {role} Workspace
        </span>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : item.highlight
                  ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-blue-300 hover:bg-blue-600/30 border border-blue-500/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 text-center">
        EduFix AI System v2.6 <br />
        Smart Complaint Platform
      </div>
    </aside>
  );
};
