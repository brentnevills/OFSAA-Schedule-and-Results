import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { ShieldCheck, AlertCircle, X, LogIn } from 'lucide-react';
import ofsaaLogo from '../assets/ofsaa-logo.png';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { loginWithGoogle, loginError, authReady } = useTournament();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    const success = await loginWithGoogle();
    setIsSubmitting(false);

    if (success) {
      onSuccess();
      onClose();
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
            aria-label="Close sign-in dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Google Sign-In Body */}
        <div className="p-6 space-y-4">
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-xs text-slate-600 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-[#0b2341]">
              <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
              <span>Protected with Firebase Google Sign-In</span>
            </div>
            <p className="leading-relaxed">
              Sign in with the authorized championship convenor Google account to update teams, schedules, and live match scores.
            </p>
          </div>

          {loginError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting || !authReady}
            className="w-full py-2.5 px-4 rounded-xl bg-[#0b2341] hover:bg-[#163a66] text-white text-xs font-bold shadow-sm flex items-center justify-center gap-2.5 transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
              />
            </svg>
            <span>{isSubmitting ? 'Signing in with Google...' : 'Sign in with Google'}</span>
            <LogIn className="w-3.5 h-3.5 text-sky-300" />
          </button>

          <div className="pt-1 flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
