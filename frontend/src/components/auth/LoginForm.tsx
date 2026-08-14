import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';
import { Sparkles, LogIn, Lock, Mail, GraduationCap, Wrench, ShieldCheck, KeyRound } from 'lucide-react';

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onOpenForgotPassword: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister, onOpenForgotPassword }) => {
  const { login, isLoading } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleFillRole = (role: Role) => {
    setErrorMsg('');
    if (role === 'student') {
      setIdentifier('soban1');
      setPassword('soban@01011985');
    } else if (role === 'maintenance') {
      setIdentifier('soban2');
      setPassword('soban@01011985');
    } else if (role === 'admin') {
      setIdentifier('soban3');
      setPassword('soban@01011985');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await login(identifier, password);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Check credentials.');
    }
  };

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

        {/* Role Persona Classification & Credentials Card */}
        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2.5">
          <span className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider block text-center flex items-center justify-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-blue-400" /> Select Role Persona to Fill Credentials:
          </span>

          <div className="space-y-2 text-[11px]">
            {/* Student Role Button */}
            <button
              type="button"
              onClick={() => handleFillRole('student')}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-blue-950/40 border border-blue-800/40 text-blue-300 hover:bg-blue-900/60 transition-all text-left group"
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-900/60 text-blue-400">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-extrabold block text-blue-200">👨‍🎓 Student Role</span>
                  <span className="text-[10px] text-blue-400/80 font-mono">ID: soban1 | Pass: soban@01011985</span>
                </div>
              </div>
              <span className="font-mono text-[10px] bg-blue-600 text-white px-2.5 py-1 rounded-lg font-black group-hover:scale-105 transition-transform shadow">
                Fill Student →
              </span>
            </button>

            {/* Maintenance Role Button */}
            <button
              type="button"
              onClick={() => handleFillRole('maintenance')}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/40 text-amber-300 hover:bg-amber-900/60 transition-all text-left group"
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-900/60 text-amber-400">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-extrabold block text-amber-200">🛠️ Maintenance Staff</span>
                  <span className="text-[10px] text-amber-400/80 font-mono">ID: soban2 | Pass: soban@01011985</span>
                </div>
              </div>
              <span className="font-mono text-[10px] bg-amber-600 text-white px-2.5 py-1 rounded-lg font-black group-hover:scale-105 transition-transform shadow">
                Fill Staff →
              </span>
            </button>

            {/* Admin Role Button */}
            <button
              type="button"
              onClick={() => handleFillRole('admin')}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-indigo-300 hover:bg-indigo-900/60 transition-all text-left group"
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-900/60 text-indigo-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-extrabold block text-indigo-200">👨‍💼 Admin Role</span>
                  <span className="text-[10px] text-indigo-400/80 font-mono">ID: soban3 | Pass: soban@01011985</span>
                </div>
              </div>
              <span className="font-mono text-[10px] bg-indigo-600 text-white px-2.5 py-1 rounded-lg font-black group-hover:scale-105 transition-transform shadow">
                Fill Admin →
              </span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-bold text-center">
            {errorMsg}
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Email or Student/Employee ID</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                placeholder="e.g. soban1 (Student), soban2 (Staff), soban3 (Admin)"
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
            <LogIn className="w-4 h-4" /> Log In
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
