import React, { useState, useEffect } from 'react';
import { Match, SetScore } from '../types/tournament';
import { useTournament, extractSaveErrorMessage } from '../context/TournamentContext';
import { TeamLogo } from './TeamLogo';
import {
  X,
  Check,
  RotateCcw,
  AlertTriangle,
  MapPin,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
} from 'lucide-react';
import { calculateSetsAndPoints } from '../utils/ofsaaTiebreaker';

interface AdminScoreModalProps {
  match: Match | null;
  onClose: () => void;
  onSaved?: (message: string) => void;
}

export const AdminScoreModal: React.FC<AdminScoreModalProps> = ({
  match,
  onClose,
  onSaved,
}) => {
  const { resetMatchScore, updateMatch, teamsMap, tournament } = useTournament();

  const [sets, setSets] = useState<SetScore[]>([]);
  const [matchNotes, setMatchNotes] = useState<string>('');
  const [court, setCourt] = useState<string>('');
  const [matchDay, setMatchDay] = useState<1 | 2 | 3>(1);
  const [matchDayLabel, setMatchDayLabel] = useState<string>('Day 1 - Thursday');
  const [matchTime, setMatchTime] = useState<string>('9:00 AM');
  const [showDetails, setShowDetails] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (match) {
      const totalPossibleSets = match.bestOf === 3 ? 3 : 5;
      const existing = (match.sets || []).map((s) => ({ ...s }));
      const fullSets: SetScore[] = [];
      for (let i = 1; i <= totalPossibleSets; i++) {
        const found = existing.find((s) => s.setNumber === i) || existing[i - 1];
        fullSets.push(
          found
            ? { setNumber: i, team1Score: found.team1Score || 0, team2Score: found.team2Score || 0 }
            : { setNumber: i, team1Score: 0, team2Score: 0 }
        );
      }
      setSets(fullSets);
      setMatchNotes(match.notes || '');
      setCourt(match.court || '');
      setMatchDay((match.day || 1) as 1 | 2 | 3);
      setMatchDayLabel(match.dayLabel || 'Day 1 - Thursday');
      setMatchTime(match.time || '9:00 AM');
      setShowDetails(false);
      setConfirmReset(false);
      setValidationError(null);
      setIsSaving(false);
    }
  }, [match?.id]);

  if (!match) return null;

  const team1 = teamsMap.get(match.team1Id);
  const team2 = teamsMap.get(match.team2Id);

  const t1DisplayName =
    team1?.schoolName || team1?.name || match.team1Placeholder || `Seed #${match.team1Id}`;
  const t2DisplayName =
    team2?.schoolName || team2?.name || match.team2Placeholder || `Seed #${match.team2Id}`;

  const setScoreValue = (index: number, team: 'team1' | 'team2', num: number) => {
    const clamped = Math.max(0, Math.min(99, num));
    setSets((prev) =>
      prev.map((s, idx) =>
        idx === index
          ? team === 'team1'
            ? { ...s, team1Score: clamped }
            : { ...s, team2Score: clamped }
          : s
      )
    );
  };

  const handleScoreInput = (index: number, team: 'team1' | 'team2', raw: string) => {
    const digitsOnly = raw.replace(/[^0-9]/g, '');
    const num = digitsOnly === '' ? 0 : parseInt(digitsOnly, 10);
    setScoreValue(index, team, num);
  };

  const adjustScore = (index: number, team: 'team1' | 'team2', delta: number) => {
    const current =
      team === 'team1' ? sets[index]?.team1Score || 0 : sets[index]?.team2Score || 0;
    setScoreValue(index, team, current + delta);
  };

  // Preview sets calculation
  const validSets = sets.filter((s) => s.team1Score > 0 || s.team2Score > 0);
  const previewMatch = { ...match, sets: validSets };
  const calc = calculateSetsAndPoints(previewMatch);
  const setsNeeded = match.bestOf === 3 ? 2 : 3;
  const isCompleted = calc.team1Sets >= setsNeeded || calc.team2Sets >= setsNeeded;

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSaving) return;

    const tiedSet = validSets.find((s) => s.team1Score === s.team2Score);
    if (tiedSet) {
      setValidationError(
        `Set ${tiedSet.setNumber} is tied (${tiedSet.team1Score}-${tiedSet.team2Score}). Enter a winning score or clear the set.`
      );
      return;
    }

    setValidationError(null);
    setIsSaving(true);

    const matchUpdates: Partial<Match> = {
      court: court.trim() || match.court,
      notes: matchNotes.trim(),
      day: matchDay,
      dayLabel: matchDayLabel.trim(),
      time: matchTime.trim(),
    };

    if (validSets.length > 0) {
      matchUpdates.sets = validSets;
      matchUpdates.status = isCompleted ? 'final' : 'in_progress';
      matchUpdates.team1SetsWon = calc.team1Sets;
      matchUpdates.team2SetsWon = calc.team2Sets;
      matchUpdates.winnerId = calc.winnerId;
      matchUpdates.loserId = calc.loserId;
    } else {
      matchUpdates.sets = [];
      matchUpdates.status = 'scheduled';
      matchUpdates.team1SetsWon = 0;
      matchUpdates.team2SetsWon = 0;
      matchUpdates.winnerId = undefined;
      matchUpdates.loserId = undefined;
    }

    try {
      await updateMatch(match.id, matchUpdates);
      const summary =
        validSets.length > 0
          ? `Saved score: ${t1DisplayName} vs ${t2DisplayName} (${calc.team1Sets}-${calc.team2Sets}${isCompleted ? ' Final' : ' In Progress'}).`
          : `Updated match info for ${t1DisplayName} vs ${t2DisplayName}.`;
      onSaved?.(summary);
      onClose();
    } catch (err) {
      setValidationError(`Failed to save match: ${extractSaveErrorMessage(err)}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (isSaving) return;
    setValidationError(null);
    setIsSaving(true);
    try {
      await resetMatchScore(match.id);
      onSaved?.(`Cleared score for ${t1DisplayName} vs ${t2DisplayName}.`);
      onClose();
    } catch (err) {
      setValidationError(`Failed to reset match: ${extractSaveErrorMessage(err)}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <form
        onSubmit={handleSave}
        className="bg-white border border-slate-200 rounded-t-2xl sm:rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[94vh] text-slate-800"
      >
        {/* Sticky Header */}
        <div className="bg-[#0b2341] text-white px-4 sm:px-6 py-3.5 flex items-center justify-between border-b-2 border-sky-400 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-sky-400/20 text-sky-200 border border-sky-400/40 px-2 py-0.5 rounded">
                {match.pool ? `Pool ${match.pool}` : match.name || 'Playoff'}
              </span>
              <span className="text-[11px] text-sky-200 truncate">
                {court || match.court || 'Gym 1'} • {matchTime}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-white mt-0.5">
              Match Scorekeeper
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors shrink-0"
            aria-label="Close scorekeeper"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Matchup Summary Card */}
          <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200 grid grid-cols-7 items-center text-center gap-1">
            {/* Team 1 */}
            <div className="col-span-3 flex items-center gap-2 text-left min-w-0">
              <TeamLogo team={team1} size="sm" className="shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-[#0b2341] font-bold uppercase block">
                  {match.team1Placeholder || team1?.poolSlot}
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 block truncate">
                  {t1DisplayName}
                </span>
              </div>
            </div>

            {/* Sets Tally */}
            <div className="col-span-1 flex flex-col items-center">
              <span
                className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                  isCompleted
                    ? 'bg-emerald-100 text-emerald-800'
                    : validSets.length > 0
                    ? 'bg-amber-100 text-amber-800'
                    : 'text-slate-500'
                }`}
              >
                {isCompleted ? 'Final' : validSets.length > 0 ? 'Live' : 'Sets'}
              </span>
              <div className="flex items-center gap-1 font-mono text-2xl sm:text-3xl font-black text-[#0b2341] mt-0.5">
                <span>{calc.team1Sets}</span>
                <span className="text-slate-400 font-normal">-</span>
                <span>{calc.team2Sets}</span>
              </div>
            </div>

            {/* Team 2 */}
            <div className="col-span-3 flex items-center justify-end gap-2 text-right min-w-0">
              <div className="min-w-0">
                <span className="text-[10px] text-[#0b2341] font-bold uppercase block">
                  {match.team2Placeholder || team2?.poolSlot}
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 block truncate">
                  {t2DisplayName}
                </span>
              </div>
              <TeamLogo team={team2} size="sm" className="shrink-0" />
            </div>
          </div>

          {/* Sets Input */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Set Scores (Best of {match.bestOf})
              </h4>
              <span className="text-[11px] text-slate-500">
                Tap quick <strong className="text-[#0b2341]">25</strong> or type scores
              </span>
            </div>

            {sets.map((set, idx) => {
              const setNum = idx + 1;
              const isDecider = match.bestOf === 3 ? setNum === 3 : setNum === 5;
              const targetPoints = isDecider ? 15 : 25;
              const hasAnyScore = set.team1Score > 0 || set.team2Score > 0;
              const isTied = hasAnyScore && set.team1Score === set.team2Score;
              const setWinnerName =
                hasAnyScore && !isTied
                  ? set.team1Score > set.team2Score
                    ? t1DisplayName
                    : t2DisplayName
                  : null;
              // Gray out trailing sets if match is already decided AND that set is still 0-0
              const isOptionalUnused = isCompleted && !hasAnyScore;

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border space-y-2.5 transition-colors ${
                    isOptionalUnused
                      ? 'bg-slate-50/50 border-slate-200/70 opacity-75'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-[#0b2341] text-sky-300 flex items-center justify-center text-[10px] font-mono">
                        {setNum}
                      </span>
                      <span>Set {setNum}</span>
                      {isDecider && (
                        <span className="text-[10px] text-sky-700 font-semibold">
                          (to 15)
                        </span>
                      )}
                    </span>

                    {isTied ? (
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                        Tied — win by 2
                      </span>
                    ) : setWinnerName ? (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded truncate max-w-[170px]">
                        {setWinnerName} ({set.team1Score}-{set.team2Score})
                      </span>
                    ) : isOptionalUnused ? (
                      <span className="text-[10px] font-medium text-slate-400">
                        Not needed (decided)
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Optional if unplayed</span>
                    )}
                  </div>

                  <div className="grid grid-cols-11 gap-1.5 sm:gap-2 items-end">
                    {/* Team 1 Score Box + Touch Controls */}
                    <div className="col-span-5 space-y-1.5">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] text-slate-600 font-semibold truncate">
                          {t1DisplayName}
                        </span>
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setScoreValue(idx, 'team1', targetPoints)}
                          className="text-[10px] font-black px-1.5 py-0.5 rounded bg-sky-100 hover:bg-sky-200 text-[#0b2341] border border-sky-300 shrink-0 transition-colors"
                          title={`Quick set ${targetPoints}`}
                        >
                          {targetPoints}
                        </button>
                      </div>

                      <div className="flex items-stretch gap-1">
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => adjustScore(idx, 'team1', -1)}
                          className="w-9 h-12 sm:w-8 sm:h-11 rounded-lg bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-600 shrink-0 touch-manipulation"
                          aria-label={`Decrease Set ${setNum} score for ${t1DisplayName}`}
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={set.team1Score === 0 ? '' : String(set.team1Score)}
                          onChange={(e) => handleScoreInput(idx, 'team1', e.target.value)}
                          onFocus={(e) => e.currentTarget.select()}
                          placeholder="0"
                          aria-label={`Set ${setNum} score for ${t1DisplayName}`}
                          className="w-full min-w-0 h-12 sm:h-11 bg-white border border-slate-300 rounded-lg text-center text-xl font-black font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => adjustScore(idx, 'team1', 1)}
                          className="w-9 h-12 sm:w-8 sm:h-11 rounded-lg bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-700 shrink-0 touch-manipulation"
                          aria-label={`Increase Set ${setNum} score for ${t1DisplayName}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="col-span-1 text-center font-bold text-slate-400 text-xs pb-3.5">
                      -
                    </div>

                    {/* Team 2 Score Box + Touch Controls */}
                    <div className="col-span-5 space-y-1.5">
                      <div className="flex items-center justify-between gap-1">
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setScoreValue(idx, 'team2', targetPoints)}
                          className="text-[10px] font-black px-1.5 py-0.5 rounded bg-sky-100 hover:bg-sky-200 text-[#0b2341] border border-sky-300 shrink-0 transition-colors"
                          title={`Quick set ${targetPoints}`}
                        >
                          {targetPoints}
                        </button>
                        <span className="text-[10px] text-slate-600 font-semibold truncate text-right">
                          {t2DisplayName}
                        </span>
                      </div>

                      <div className="flex items-stretch gap-1">
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => adjustScore(idx, 'team2', -1)}
                          className="w-9 h-12 sm:w-8 sm:h-11 rounded-lg bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-600 shrink-0 touch-manipulation"
                          aria-label={`Decrease Set ${setNum} score for ${t2DisplayName}`}
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={set.team2Score === 0 ? '' : String(set.team2Score)}
                          onChange={(e) => handleScoreInput(idx, 'team2', e.target.value)}
                          onFocus={(e) => e.currentTarget.select()}
                          placeholder="0"
                          aria-label={`Set ${setNum} score for ${t2DisplayName}`}
                          className="w-full min-w-0 h-12 sm:h-11 bg-white border border-slate-300 rounded-lg text-center text-xl font-black font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => adjustScore(idx, 'team2', 1)}
                          className="w-9 h-12 sm:w-8 sm:h-11 rounded-lg bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-700 shrink-0 touch-manipulation"
                          aria-label={`Increase Set ${setNum} score for ${t2DisplayName}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Collapsible Match Day, Time, Gym & Notes */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/70">
            <button
              type="button"
              onClick={() => setShowDetails((v) => !v)}
              className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-bold text-[#0b2341] hover:bg-slate-100/80 transition-colors"
            >
              <span className="flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span className="truncate">
                  Schedule, Gym &amp; Notes ({court || 'Gym 1'} • {matchTime})
                </span>
              </span>
              <span className="flex items-center gap-1 text-[11px] text-sky-700 shrink-0 ml-2">
                <span>{showDetails ? 'Hide' : 'Edit'}</span>
                {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </span>
            </button>

            {showDetails && (
              <div className="p-3.5 pt-2 border-t border-slate-200 bg-white space-y-3.5">
                {/* Match Date & Time */}
                <div className="bg-sky-50/70 border border-sky-200 p-3 rounded-xl space-y-2.5">
                  <span className="text-[11px] font-black text-[#0b2341] uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-sky-600" />
                    <span>Match Day &amp; Start Time</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                        Championship Day
                      </label>
                      <select
                        value={matchDay}
                        onChange={(e) => {
                          const dayNum = Number(e.target.value) as 1 | 2 | 3;
                          setMatchDay(dayNum);
                          setMatchDayLabel(
                            dayNum === 1
                              ? 'Day 1 - Thursday'
                              : dayNum === 2
                              ? 'Day 2 - Friday'
                              : 'Day 3 - Saturday'
                          );
                        }}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      >
                        <option value={1}>Day 1 - Thursday (Round Robin)</option>
                        <option value={2}>Day 2 - Friday (RR &amp; QFs)</option>
                        <option value={3}>Day 3 - Saturday (Semis &amp; Medals)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1 mb-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>Start Time</span>
                      </label>
                      <input
                        type="text"
                        list="match-time-presets"
                        value={matchTime}
                        onChange={(e) => setMatchTime(e.target.value)}
                        placeholder="e.g. 9:00 AM"
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                      <datalist id="match-time-presets">
                        {[
                          '9:00 AM',
                          '10:30 AM',
                          '12:00 PM',
                          '1:30 PM',
                          '3:00 PM',
                          '4:30 PM',
                          '6:00 PM',
                          '7:30 PM',
                        ].map((t) => (
                          <option key={t} value={t} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                </div>

                {/* Gym Quick Select */}
                <div>
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between mb-1.5">
                    <span>Match Location / Gym</span>
                    <span className="text-[11px] font-normal text-slate-400">
                      Tap or type custom
                    </span>
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {(tournament.venues && tournament.venues.length > 0
                      ? tournament.venues
                      : ['Gym 1', 'Gym 2', 'Gym 3', 'Gym 4']
                    ).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setCourt(v)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          court === v
                            ? 'bg-[#0b2341] text-sky-300 ring-2 ring-sky-400/50 shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={court}
                    onChange={(e) => setCourt(e.target.value)}
                    placeholder="e.g. Gym 1, Gym 2, Gym 3, Gym 4"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Convenor Match Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={matchNotes}
                    onChange={(e) => setMatchNotes(e.target.value)}
                    placeholder="e.g. Official protest resolved; 2nd set timeout"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Validation / Save Error Message */}
          {validationError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{validationError}</span>
            </div>
          )}
        </div>

        {/* Sticky Modal Footer */}
        <div className="bg-slate-50 px-4 sm:px-6 py-3.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          {confirmReset ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleReset}
                disabled={isSaving}
                className="text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Clearing...' : 'Confirm Clear'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                disabled={isSaving}
                className="text-xs font-semibold text-slate-600 px-2 py-2 rounded-lg hover:bg-slate-200"
              >
                Keep
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              disabled={isSaving}
              className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-3 py-2 rounded-lg border border-rose-200 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Score</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3.5 py-2.5 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="text-xs font-bold text-white px-4 sm:px-5 py-2.5 rounded-lg bg-[#0b2341] hover:bg-[#163a66] shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4 text-sky-400" />
              <span>
                {isSaving
                  ? 'Saving...'
                  : validSets.length > 0
                  ? 'Save Score & Standings'
                  : 'Save Match Info'}
              </span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
