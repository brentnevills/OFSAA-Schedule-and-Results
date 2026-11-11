import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { Clock, Check, Edit2, Calendar, X } from 'lucide-react';

interface TimeSelectorProps {
  matchId: string;
  currentTime?: string;
  currentDay?: number;
  currentDayLabel?: string;
  onOpenLogin?: () => void;
  className?: string;
  compact?: boolean;
}

export const TIME_PRESETS = [
  '8:30 AM',
  '9:00 AM',
  '10:00 AM',
  '10:30 AM',
  '11:30 AM',
  '12:00 PM',
  '1:00 PM',
  '1:30 PM',
  '3:00 PM',
  '4:30 PM',
  '6:00 PM',
  '7:30 PM',
];

export const TimeSelector: React.FC<TimeSelectorProps> = ({
  matchId,
  currentTime = '9:00 AM',
  currentDay = 1,
  currentDayLabel = 'Day 1 - Thursday',
  onOpenLogin,
  className = '',
  compact = false,
}) => {
  const { updateMatch, isAdmin } = useTournament();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(currentDay);
  const [selectedDayLabel, setSelectedDayLabel] = useState<string>(currentDayLabel);
  const [customTime, setCustomTime] = useState<string>('');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSelectTime = async (timeToSet: string, dayToSet?: number, dayLabelToSet?: string) => {
    const trimmedTime = timeToSet.trim();
    if (!trimmedTime) return;

    const dayNum = (dayToSet !== undefined ? dayToSet : selectedDay) as 1 | 2 | 3;
    const label =
      dayLabelToSet !== undefined
        ? dayLabelToSet
        : dayNum === 1
        ? 'Day 1 - Thursday'
        : dayNum === 2
        ? 'Day 2 - Friday'
        : 'Day 3 - Saturday';

    await updateMatch(matchId, {
      time: trimmedTime,
      day: dayNum,
      dayLabel: label,
    });

    setIsOpen(false);
    setIsCustomMode(false);
    setCustomTime('');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleDayChange = (dayNum: number) => {
    setSelectedDay(dayNum);
    setSelectedDayLabel(
      dayNum === 1
        ? 'Day 1 - Thursday'
        : dayNum === 2
        ? 'Day 2 - Friday'
        : 'Day 3 - Saturday'
    );
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customTime.trim()) {
      handleSelectTime(customTime.trim());
    }
  };

  if (!isAdmin) {
    return (
      <span
        onClick={onOpenLogin}
        title={onOpenLogin ? 'Convenors can log in to edit game start time' : undefined}
        className={`font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md text-[11px] flex items-center gap-1 ${
          onOpenLogin ? 'cursor-pointer hover:bg-slate-200 transition-colors' : ''
        } ${className}`}
      >
        <Clock className="w-3 h-3 text-sky-600 shrink-0" />
        <span className="truncate">{currentTime || '9:00 AM'}</span>
      </span>
    );
  }

  return (
    <div className={`relative inline-block text-left ${className}`} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => {
          setSelectedDay(currentDay);
          setSelectedDayLabel(currentDayLabel);
          setIsOpen(!isOpen);
        }}
        className={`font-bold text-[#0b2341] bg-slate-100 hover:bg-sky-50 border border-slate-300 hover:border-sky-400 px-2 py-0.5 rounded-md text-[11px] flex items-center gap-1 transition-all shadow-2xs group ${
          isOpen ? 'ring-2 ring-sky-400 bg-sky-50' : ''
        }`}
        title="Click to edit match time and day"
      >
        <Clock className="w-3 h-3 text-sky-600 shrink-0" />
        <span className="truncate max-w-[110px]">{currentTime || '9:00 AM'}</span>
        {savedSuccess ? (
          <Check className="w-2.5 h-2.5 text-emerald-600 shrink-0 ml-0.5" />
        ) : (
          <Edit2 className="w-2.5 h-2.5 text-slate-400 group-hover:text-sky-700 shrink-0 ml-0.5 opacity-70 group-hover:opacity-100" />
        )}
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 z-40 bg-white border border-slate-200 rounded-xl shadow-xl p-3 w-64 text-xs text-slate-800 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <span className="font-extrabold text-[11px] text-[#0b2341] uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-sky-600" />
              <span>Match Time & Day</span>
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded hover:bg-slate-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Championship Day Selector */}
          <div className="mb-2.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Championship Day
            </label>
            <div className="grid grid-cols-3 gap-1">
              {[
                { day: 1, label: 'Thu (D1)' },
                { day: 2, label: 'Fri (D2)' },
                { day: 3, label: 'Sat (D3)' },
              ].map(({ day, label }) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDayChange(day)}
                  className={`py-1 text-[11px] font-extrabold rounded-md border text-center transition-all ${
                    selectedDay === day
                      ? 'bg-[#0b2341] text-sky-300 border-[#0b2341]'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {!isCustomMode ? (
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 font-semibold block">
                Quick Select Time:
              </span>
              <div className="grid grid-cols-3 gap-1 max-h-40 overflow-y-auto pr-0.5">
                {TIME_PRESETS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleSelectTime(t)}
                    className={`py-1 px-1.5 rounded text-[11px] font-mono font-bold border transition-colors ${
                      currentTime === t
                        ? 'bg-sky-50 text-sky-800 border-sky-300 font-black'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomMode(true);
                    setCustomTime(currentTime || '');
                  }}
                  className="w-full text-center py-1 text-xs text-sky-700 font-bold hover:underline"
                >
                  + Enter custom time...
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCustomSubmit} className="space-y-2">
              <label className="text-[10px] text-slate-500 font-semibold block">
                Enter Custom Time:
              </label>
              <input
                type="text"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                placeholder="e.g. 10:15 AM, 2:45 PM"
                autoFocus
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
              <div className="flex items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCustomMode(false)}
                  className="flex-1 py-1 px-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={!customTime.trim()}
                  className="flex-1 py-1 px-2 bg-[#0b2341] hover:bg-[#163a66] disabled:opacity-40 text-white text-xs font-bold rounded-lg shadow-2xs"
                >
                  Save Time
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
