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
  const [generatedPin, setGeneratedPin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.forgotPassword(email);
      if (res.success) {
        setMsg(res.message);
        if (res.pin) setGeneratedPin(res.pin);
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
              <label className="block text-slate-300 font-bold mb-1">Your Registered Gmail / Email</label>
              <input
                type="email"
                required
                placeholder="student1@campus.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button type="submit" className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-extrabold text-xs shadow-lg shadow-blue-500/25 transition-all">
              Send 6-Digit PIN to Gmail
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
            {generatedPin && (
              <div className="p-3.5 rounded-2xl bg-blue-950/80 border border-blue-700/80 text-blue-200 text-xs space-y-1 shadow-lg">
                <div className="flex items-center justify-between font-extrabold text-blue-300">
                  <span className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-blue-400" /> Verification PIN Sent</span>
                  <span className="font-mono text-sm font-black text-amber-300 bg-amber-950/90 px-2 py-0.5 rounded border border-amber-500/50 shadow">
                    {generatedPin}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Enter the 6-digit PIN code displayed above or check your Gmail inbox ({email}).
                </p>
              </div>
            )}

            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Enter 6-Digit PIN
              </label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="e.g. 482910"
                value={resetCode}
                onChange={e => setResetCode(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white font-mono text-center tracking-widest text-base font-black focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-1">New Password</label>
              <input
                type="password"
                required
                placeholder="Enter new password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button type="submit" className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-extrabold text-xs shadow-lg shadow-emerald-500/25 transition-all">
              Verify PIN & Reset Password
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
