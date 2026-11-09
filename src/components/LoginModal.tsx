import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { Lock, KeyRound, AlertCircle, X } from 'lucide-react';
import ofsaaLogo from '../assets/ofsaa-logo.png';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { login, loginError } = useTournament();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const success = await login(username.trim(), password.trim());
    setIsSubmitting(false);

    if (success) {
      onSuccess();
      onClose();
    } else {
      setError(loginError || 'Invalid convenor credentials.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden flex flex-col text-slate-800">
        {/* Header */}
        <div className="bg-[#0b2341] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={ofsaaLogo}
              alt="OFSAA Logo"
              className="w-9 h-9 object-contain shrink-0 drop-shadow-sm"
            />
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                Championship Convenor Access
              </h3>
              <p className="text-[11px] text-sky-200">Authorized committee administration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="text-xs font-bold text-white px-4 py-2 rounded-lg bg-[#0b2341] hover:bg-[#163a66] shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <KeyRound className="w-3.5 h-3.5 text-sky-400" />
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
