import React, { useState, useEffect } from 'react';
import { Match, SetScore } from '../types/tournament';
import { useTournament } from '../context/TournamentContext';
import { TeamLogo } from './TeamLogo';
import { X, Check, RotateCcw, AlertTriangle, MapPin } from 'lucide-react';
import { calculateSetsAndPoints } from '../utils/ofsaaTiebreaker';

interface AdminScoreModalProps {
  match: Match | null;
  onClose: () => void;
}

export const AdminScoreModal: React.FC<AdminScoreModalProps> = ({ match, onClose }) => {
  const { updateMatchScore, resetMatchScore, updateMatch, teamsMap, tournament } = useTournament();

  const [sets, setSets] = useState<SetScore[]>([]);
  const [matchNotes, setMatchNotes] = useState<string>('');
  const [court, setCourt] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (match) {
      if (match.sets && match.sets.length > 0) {
        setSets(match.sets.map((s) => ({ ...s })));
      } else {
        // Initialize with default sets
        const initialSets: SetScore[] = [
          { setNumber: 1, team1Score: 0, team2Score: 0 },
          { setNumber: 2, team1Score: 0, team2Score: 0 },
        ];
        if (match.bestOf === 3) {
          // pool play best of 3
          initialSets.push({ setNumber: 3, team1Score: 0, team2Score: 0 });
        } else {
          // best of 5
          initialSets.push(
            { setNumber: 3, team1Score: 0, team2Score: 0 },
            { setNumber: 4, team1Score: 0, team2Score: 0 },
            { setNumber: 5, team1Score: 0, team2Score: 0 }
          );
        }
        setSets(initialSets);
      }
      setMatchNotes(match.notes || '');
      setCourt(match.court || '');
      setValidationError(null);
    }
  }, [match]);

  if (!match) return null;

  const team1 = teamsMap.get(match.team1Id);
  const team2 = teamsMap.get(match.team2Id);

  const t1DisplayName = team1?.schoolName || team1?.name || match.team1Placeholder || `Seed #${match.team1Id}`;
  const t2DisplayName = team2?.schoolName || team2?.name || match.team2Placeholder || `Seed #${match.team2Id}`;

  const handleScoreChange = (index: number, team: 'team1' | 'team2', val: string) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    const updated = [...sets];
    if (team === 'team1') {
      updated[index].team1Score = num;
    } else {
      updated[index].team2Score = num;
    }
    setSets(updated);
  };

  // Preview sets calculation
  const validSets = sets.filter((s) => s.team1Score > 0 || s.team2Score > 0);
  const previewMatch = { ...match, sets: validSets };
  const calc = calculateSetsAndPoints(previewMatch);

  const handleSaveGymOnly = async () => {
    await updateMatch(match.id, {
      court: court.trim() || match.court,
      notes: matchNotes.trim()
    });
    onClose();
  };

  const handleSave = async () => {
    setValidationError(null);

    // If no sets are entered yet, save gym location and notes without error
    if (validSets.length === 0) {
      await handleSaveGymOnly();
      return;
    }

    const setsNeeded = match.bestOf === 3 ? 2 : 3;
    const isCompleted = calc.team1Sets >= setsNeeded || calc.team2Sets >= setsNeeded;

    await updateMatchScore(
      match.id,
      validSets,
      isCompleted ? 'final' : 'in_progress',
      matchNotes,
      court.trim()
    );
    onClose();
  };

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset scores for this match?')) {
      await resetMatchScore(match.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-800">
        {/* Header */}
        <div className="bg-[#0b2341] text-white px-6 py-4 flex items-center justify-between border-b-2 border-sky-400">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-sky-400/20 text-sky-200 border border-sky-400/40 px-2 py-0.5 rounded">
                {match.pool ? `Pool ${match.pool} Match` : match.name || 'Playoff Match'}
              </span>
              <span className="text-xs text-sky-200">
                {match.dayLabel} • {match.time}
              </span>
            </div>
            <h3 className="text-lg font-extrabold text-white mt-1">Match Scorekeeper</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Matchup Summary Card */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-7 items-center text-center">
            {/* Team 1 */}
            <div className="col-span-3 flex items-center gap-2 text-left">
              <TeamLogo team={team1} size="md" />
              <div className="min-w-0">
                <span className="text-[10px] text-[#0b2341] font-bold uppercase block">
                  {match.team1Placeholder || team1?.poolSlot}
                </span>
                <span className="text-xs font-bold text-slate-900 block truncate">
                  {t1DisplayName}
                </span>
                <span className="text-[10px] text-slate-500">
                  {team1?.association || 'TBD'}
                </span>
              </div>
            </div>

            {/* Score Summary */}
            <div className="col-span-1 flex flex-col items-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Sets</span>
              <div className="flex items-center gap-1 font-mono text-xl font-black text-[#0b2341] mt-0.5">
                <span>{calc.team1Sets}</span>
                <span>-</span>
                <span>{calc.team2Sets}</span>
              </div>
            </div>

            {/* Team 2 */}
            <div className="col-span-3 flex items-center justify-end gap-2 text-right">
              <div className="min-w-0">
                <span className="text-[10px] text-[#0b2341] font-bold uppercase block">
                  {match.team2Placeholder || team2?.poolSlot}
                </span>
                <span className="text-xs font-bold text-slate-900 block truncate">
                  {t2DisplayName}
                </span>
                <span className="text-[10px] text-slate-500">
                  {team2?.association || 'TBD'}
                </span>
              </div>
              <TeamLogo team={team2} size="md" />
            </div>
          </div>

          {/* Sets Input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Set Scores (Best of {match.bestOf})
              </h4>
              <span className="text-[11px] text-slate-500">
                Sets 1-2 to 25 • Decider to 15 (win by 2)
              </span>
            </div>

            {sets.map((set, idx) => {
              const setNum = idx + 1;
              const isDecider = match.bestOf === 3 ? setNum === 3 : setNum === 5;

              return (
                <div
                  key={idx}
                  className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-[#0b2341] text-sky-300 flex items-center justify-center text-[10px] font-mono">
                        {setNum}
                      </span>
                      <span>Set {setNum}</span>
                      {isDecider && (
                        <span className="text-[10px] text-sky-700 font-semibold">
                          (Deciding set to 15)
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-3 items-center">
                    {/* Team 1 Score Input */}
                    <div className="col-span-2">
                      <label className="text-[10px] text-slate-500 font-medium truncate block mb-1">
                        {t1DisplayName}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="99"
                        value={set.team1Score || ''}
                        onChange={(e) => handleScoreChange(idx, 'team1', e.target.value)}
                        placeholder="0"
                        className="w-full bg-white border border-slate-300 rounded-lg py-2 px-3 text-center text-lg font-black font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>

                    <div className="col-span-1 text-center font-bold text-slate-400 text-sm">
                      vs
                    </div>

                    {/* Team 2 Score Input */}
                    <div className="col-span-2">
                      <label className="text-[10px] text-slate-500 font-medium truncate block mb-1 text-right">
                        {t2DisplayName}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="99"
                        value={set.team2Score || ''}
                        onChange={(e) => handleScoreChange(idx, 'team2', e.target.value)}
                        placeholder="0"
                        className="w-full bg-white border border-slate-300 rounded-lg py-2 px-3 text-center text-lg font-black font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Editable Venue / Court field with Gym 1-4 quick select */}
          <div>
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-600" />
                <span>Match Location / Gym</span>
              </span>
              <span className="text-[11px] font-normal text-slate-400">Quick-select or type custom</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(tournament.venues && tournament.venues.length > 0 ? tournament.venues : ['Gym 1', 'Gym 2', 'Gym 3', 'Gym 4']).map((v) => (
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

          {/* Notes or Tiebreaker comments */}
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

          {/* Validation Error Message */}
          {validationError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{validationError}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Score</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="text-xs font-bold text-white px-5 py-2 rounded-lg bg-[#0b2341] hover:bg-[#163a66] shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Check className="w-4 h-4 text-sky-400" />
              <span>{validSets.length > 0 ? 'Save & Update Standings' : 'Save Gym & Match Info'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
