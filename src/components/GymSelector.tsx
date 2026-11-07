import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { MapPin, Check, Edit2, Plus, X } from 'lucide-react';

interface GymSelectorProps {
  matchId: string;
  currentCourt?: string;
  onOpenLogin?: () => void;
  className?: string;
  compact?: boolean;
}

export const GymSelector: React.FC<GymSelectorProps> = ({
  matchId,
  currentCourt = 'Gym 1',
  onOpenLogin,
  className = '',
  compact = false,
}) => {
  const { tournament, updateMatchCourt, isAdmin } = useTournament();
  const [isOpen, setIsOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const venues = tournament.venues && tournament.venues.length > 0
    ? tournament.venues
    : ['Gym 1', 'Gym 2', 'Gym 3', 'Gym 4'];

  const handleSelectGym = async (gym: string) => {
    const trimmed = gym.trim();
    if (!trimmed) return;
    await updateMatchCourt(matchId, trimmed);
    setIsOpen(false);
    setIsCustomMode(false);
    setCustomInput('');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInput.trim()) {
      handleSelectGym(customInput.trim());
    }
  };

  if (!isAdmin) {
    return (
      <span
        onClick={onOpenLogin}
        title={onOpenLogin ? "Convenors can click to log in and change gym assignment" : undefined}
        className={`font-bold text-[#0b2341] bg-sky-100/80 border border-sky-300 px-2 py-0.5 rounded-md text-[11px] flex items-center gap-1 ${
          onOpenLogin ? 'cursor-pointer hover:bg-sky-200/90 transition-colors' : ''
        } ${className}`}
      >
        <MapPin className="w-3 h-3 text-sky-600 shrink-0" />
        <span className="truncate">{currentCourt || 'Gym 1'}</span>
      </span>
    );
  }

  return (
    <div className={`relative inline-block text-left ${className}`} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`font-bold text-[#0b2341] bg-sky-100/90 hover:bg-sky-200 border border-sky-300 hover:border-sky-400 px-2 py-0.5 rounded-md text-[11px] flex items-center gap-1 transition-all shadow-2xs group ${
          isOpen ? 'ring-2 ring-sky-400' : ''
        }`}
        title="Click to edit gym independently for this game"
      >
        <MapPin className="w-3 h-3 text-sky-600 shrink-0" />
        <span className="truncate max-w-[120px]">{currentCourt || 'Gym 1'}</span>
        {savedSuccess ? (
          <Check className="w-2.5 h-2.5 text-emerald-600 shrink-0 ml-0.5" />
        ) : (
          <Edit2 className="w-2.5 h-2.5 text-slate-400 group-hover:text-slate-600 shrink-0 ml-0.5 opacity-70 group-hover:opacity-100" />
        )}
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 z-40 bg-white border border-slate-200 rounded-xl shadow-xl p-2.5 w-56 text-xs text-slate-800 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100">
            <span className="font-extrabold text-[11px] text-[#0b2341] uppercase tracking-wider flex items-center gap-1">
              <MapPin className="w-3 h-3 text-sky-600" />
              Assign Gym / Court
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {!isCustomMode ? (
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-semibold block px-1">
                Quick Select Tournament Gyms:
              </span>
              <div className="grid grid-cols-2 gap-1">
                {venues.map((v) => {
                  const isSelected = currentCourt === v;
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => handleSelectGym(v)}
                      className={`px-2 py-1 rounded-lg text-left text-xs font-bold transition-all truncate flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#0b2341] text-sky-300 shadow-2xs'
                          : 'bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-[#0b2341] border border-slate-200'
                      }`}
                    >
                      <span className="truncate">{v}</span>
                      {isSelected && <Check className="w-3 h-3 text-sky-300 shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-1.5 mt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCustomMode(true)}
                  className="w-full px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3 text-sky-600" />
                  <span>Type Custom Gym Name...</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCustomSubmit} className="space-y-2">
              <span className="text-[10px] text-slate-500 font-semibold block">
                Enter Custom Gym / Location:
              </span>
              <input
                type="text"
                autoFocus
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="e.g. Auxiliary Gym 2, Court B"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <div className="flex items-center gap-1.5 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setIsCustomMode(false)}
                  className="px-2 py-1 text-[11px] font-semibold text-slate-500 hover:text-slate-700"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-[#0b2341] hover:bg-[#163a66] text-white text-[11px] font-bold rounded-lg shadow-2xs"
                >
                  Save Gym
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
