import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';
import { Sparkles, LogIn, Lock, Mail, GraduationCap, Wrench, ShieldCheck } from 'lucide-react';

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onOpenForgotPassword: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister, onOpenForgotPassword }) => {
  const { login, isLoading } = useAuth();
  const [selectedRole, setSelectedRole] = useState<Role>('student');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await login(identifier, password);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Check credentials.');
    }
  };

  const roles = [
    {
      id: 'student' as Role,
      label: 'Student',
      icon: GraduationCap,
      accent: 'blue',
      activeClass: 'bg-blue-600/20 border-blue-500/80 text-blue-300 ring-2 ring-blue-500/30',
      inactiveClass: 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200',
    },
    {
      id: 'maintenance' as Role,
      label: 'Maintenance',
      icon: Wrench,
      accent: 'amber',
      activeClass: 'bg-amber-600/20 border-amber-500/80 text-amber-300 ring-2 ring-amber-500/30',
      inactiveClass: 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200',
    },
    {
      id: 'admin' as Role,
      label: 'Administrator',
      icon: ShieldCheck,
      accent: 'indigo',
      activeClass: 'bg-indigo-600/20 border-indigo-500/80 text-indigo-300 ring-2 ring-indigo-500/30',
      inactiveClass: 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200',
    },
  ];

  const getRoleDetails = (role: Role) => {
    switch (role) {
      case 'student':
        return {
          portalName: 'Student Access Portal',
          label: 'Student Email or Student ID',
          placeholder: 'Enter Student Email or ID',
        };
      case 'maintenance':
        return {
          portalName: 'Maintenance Staff Portal',
          label: 'Staff Email or Employee ID',
          placeholder: 'Enter Staff Email or Employee ID',
        };
      case 'admin':
        return {
          portalName: 'Administrator Portal',
          label: 'Admin Email or Employee ID',
          placeholder: 'Enter Admin Email or Employee ID',
        };
    }
  };

  const currentRole = getRoleDetails(selectedRole);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />

      <div className="max-w-md w-full relative z-10 bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl space-y-6">
        {/* Logo Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white mx-auto shadow-xl shadow-blue-500/25">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">EduFix AI Platform</h1>
          <p className="text-xs text-slate-400">Smart Complaint & Infrastructure Management System</p>
        </div>

        {/* Role Classification Selector Tabs */}
        <div className="space-y-2">
          <span className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider block text-center">
            Select Portal Persona
          </span>

          <div className="grid grid-cols-3 gap-2">
            {roles.map(r => {
              const Icon = r.icon;
              const isSelected = selectedRole === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRole(r.id)}
                  className={`p-2.5 rounded-2xl border transition-all duration-200 flex flex-col items-center gap-1.5 text-center ${
                    isSelected ? r.activeClass : r.inactiveClass
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-bold">{r.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Role Indicator Banner */}
        <div className="px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
          <span className="text-xs font-semibold text-slate-300">
            Logging in to <span className="font-extrabold text-blue-400">{currentRole.portalName}</span>
          </span>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-bold text-center">
            {errorMsg}
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">{currentRole.label}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                placeholder={currentRole.placeholder}
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-white text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-300">Password</label>
              <button
                type="button"
                onClick={onOpenForgotPassword}
                className="text-[11px] text-blue-400 font-semibold hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-white text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-xs shadow-lg shadow-blue-600/30 hover:opacity-95 transition-opacity flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" /> Log In to {roles.find(r => r.id === selectedRole)?.label}
          </button>
        </form>

        {/* Register Redirect */}
        <div className="text-center text-xs text-slate-400">
          Don't have a student account yet?{' '}
          <button onClick={onSwitchToRegister} className="text-blue-400 font-bold hover:underline">
            Register here
          </button>
        </div>
      </div>
    </div>
  );
};

