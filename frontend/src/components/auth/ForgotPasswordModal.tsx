import React, { useState } from 'react';
import { api } from '../../services/api';
import { KeyRound, Mail, X, CheckCircle } from 'lucide-react';

interface ForgotPasswordModalProps {
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.forgotPassword(email);
      if (res.success) {
        setMsg(res.message);
        setStep('reset');
      }
    } catch (err: any) {
      setMsg(err.message || 'Failed to request reset.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.resetPassword({ email, resetCode, newPassword });
      if (res.success) {
        setIsSuccess(true);
        setMsg(res.message);
      }
    } catch (err: any) {
      setMsg(err.message || 'Failed to reset password.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto">
            <KeyRound className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-lg">Reset Password</h3>
          <p className="text-xs text-slate-400">Account password recovery for EduFix</p>
        </div>

        {msg && (
          <div className={`p-3 rounded-xl mb-4 text-xs font-bold text-center ${isSuccess ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-blue-950 text-blue-300 border border-blue-800'}`}>
            {msg}
          </div>
        )}

        {isSuccess ? (
          <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-blue-600 font-bold text-xs">
            Return to Login
          </button>
        ) : step === 'email' ? (
          <form onSubmit={handleSendCode} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Your Registered Email</label>
              <input
                type="email"
                required
                placeholder="student@campus.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 text-white"
              />
            </div>
            <button type="submit" className="w-full py-2.5 rounded-xl bg-blue-600 font-extrabold text-xs">
              Send Reset Code
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Reset Code (Demo: 123456)</label>
              <input
                type="text"
                required
                placeholder="123456"
                value={resetCode}
                onChange={e => setResetCode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 text-white font-mono text-center tracking-widest text-sm"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-1">New Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 text-white"
              />
            </div>
            <button type="submit" className="w-full py-2.5 rounded-xl bg-emerald-600 font-extrabold text-xs">
              Reset Password Now
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
