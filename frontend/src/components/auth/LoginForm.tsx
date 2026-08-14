import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, LogIn, Lock, Mail } from 'lucide-react';

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onOpenForgotPassword: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister, onOpenForgotPassword }) => {
  const { login, isLoading } = useAuth();
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
                placeholder="e.g. soban1, soban2, soban3"
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
