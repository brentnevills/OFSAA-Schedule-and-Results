import React, { useState, useEffect } from 'react';
import { Match, SetScore } from '../types/tournament';
import { useTournament } from '../context/TournamentContext';
import { X, Check, RotateCcw, AlertTriangle, Trophy } from 'lucide-react';
import { calculateSetsAndPoints } from '../utils/ofsaaTiebreaker';

interface AdminScoreModalProps {
  match: Match | null;
  onClose: () => void;
}

export const AdminScoreModal: React.FC<AdminScoreModalProps> = ({ match, onClose }) => {
  const { updateMatchScore, resetMatchScore, teamsMap } = useTournament();

  const [sets, setSets] = useState<SetScore[]>([]);
  const [matchNotes, setMatchNotes] = useState<string>('');
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
      setValidationError(null);
    }
  }, [match]);

  if (!match) return null;

  const team1 = teamsMap.get(match.team1Id);
  const team2 = teamsMap.get(match.team2Id);

  const t1DisplayName = team1?.schoolName || match.team1Placeholder || match.team1Id;
  const t2DisplayName = team2?.schoolName || match.team2Placeholder || match.team2Id;

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

  const handlePreset = (index: number, score1: number, score2: number) => {
    const updated = [...sets];
    updated[index].team1Score = score1;
    updated[index].team2Score = score2;
    setSets(updated);
  };

  // Preview sets calculation
  // Filter out sets with 0-0 unless entered
  const validSets = sets.filter((s) => s.team1Score > 0 || s.team2Score > 0);
  const previewMatch = { ...match, sets: validSets };
  const calc = calculateSetsAndPoints(previewMatch);

  const handleSave = async () => {
    setValidationError(null);

    if (validSets.length === 0) {
      setValidationError('Please enter scores for at least one completed set.');
      return;
    }

    const setsNeeded = match.bestOf === 3 ? 2 : 3;
    const isCompleted = calc.team1Sets >= setsNeeded || calc.team2Sets >= setsNeeded;

    await updateMatchScore(
      match.id,
      validSets,
      isCompleted ? 'final' : 'in_progress',
      matchNotes
    );
    onClose();
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset scores for this match?')) {
      await resetMatchScore(match.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-800/90 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded">
                {match.pool ? `Pool ${match.pool} Match` : match.name || 'Playoff Match'}
              </span>
              <span className="text-xs text-slate-400">
                {match.court} • {match.time}
              </span>
            </div>
            <h3 className="text-lg font-black text-white mt-1">Match Scorekeeper</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Matchup Summary Card */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 grid grid-cols-7 items-center text-center">
            {/* Team 1 */}
            <div className="col-span-3 text-left">
              <span className="text-[10px] text-amber-400 font-bold uppercase block">
                {match.team1Placeholder || team1?.poolSlot}
              </span>
              <span className="text-sm font-bold text-white block truncate">
                {t1DisplayName}
              </span>
              <span className="text-xs text-slate-400">
                {team1?.association || 'TBD'}
              </span>
            </div>

            {/* Score Summary */}
            <div className="col-span-1 flex flex-col items-center">
              <span className="text-xs font-semibold text-slate-500 uppercase">Sets</span>
              <div className="flex items-center gap-1 font-mono text-xl font-black text-amber-400 mt-0.5">
                <span>{calc.team1Sets}</span>
                <span>-</span>
                <span>{calc.team2Sets}</span>
              </div>
            </div>

            {/* Team 2 */}
            <div className="col-span-3 text-right">
              <span className="text-[10px] text-amber-400 font-bold uppercase block">
                {match.team2Placeholder || team2?.poolSlot}
              </span>
              <span className="text-sm font-bold text-white block truncate">
                {t2DisplayName}
              </span>
              <span className="text-xs text-slate-400">
                {team2?.association || 'TBD'}
              </span>
            </div>
          </div>

          {/* Sets Input */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Set Scores (Best of {match.bestOf})
              </h4>
              <span className="text-[11px] text-slate-400">
                Sets 1-2 to 25 pts • Set 3 to 15 pts (win by 2)
              </span>
            </div>

            {sets.map((set, idx) => {
              const setNum = idx + 1;
              const isDecider = match.bestOf === 3 ? setNum === 3 : setNum === 5;

              return (
                <div
                  key={idx}
                  className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/70 space-y-2.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-slate-700 text-amber-400 flex items-center justify-center text-[11px] font-mono">
                        {setNum}
                      </span>
                      <span>Set {setNum}</span>
                      {isDecider && (
                        <span className="text-[10px] text-amber-400 font-normal">
                          (Deciding set to 15)
                        </span>
                      )}
                    </span>

                    {/* Presets */}
                    <div className="flex items-center gap-1 text-[11px]">
                      <span className="text-slate-500 mr-1">Presets:</span>
                      <button
                        type="button"
                        onClick={() => handlePreset(idx, isDecider ? 15 : 25, isDecider ? 12 : 21)}
                        className="px-1.5 py-0.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded font-mono"
                      >
                        {isDecider ? '15-12' : '25-21'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePreset(idx, isDecider ? 13 : 22, isDecider ? 15 : 25)}
                        className="px-1.5 py-0.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded font-mono"
                      >
                        {isDecider ? '13-15' : '22-25'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-3 items-center">
                    {/* Team 1 Score Input */}
                    <div className="col-span-2">
                      <label className="text-[10px] text-slate-400 truncate block mb-1">
                        {t1DisplayName}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="99"
                        value={set.team1Score || ''}
                        onChange={(e) => handleScoreChange(idx, 'team1', e.target.value)}
                        placeholder="0"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-center text-lg font-bold font-mono text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div className="col-span-1 text-center font-bold text-slate-500 text-lg">
                      vs
                    </div>

                    {/* Team 2 Score Input */}
                    <div className="col-span-2">
                      <label className="text-[10px] text-slate-400 truncate block mb-1 text-right">
                        {t2DisplayName}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="99"
                        value={set.team2Score || ''}
                        onChange={(e) => handleScoreChange(idx, 'team2', e.target.value)}
                        placeholder="0"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-center text-lg font-bold font-mono text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Notes or Tiebreaker comments */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Convenor Match Notes / Disciplinary / Protests (Optional)
            </label>
            <input
              type="text"
              value={matchNotes}
              onChange={(e) => setMatchNotes(e.target.value)}
              placeholder="e.g. Official warning given; Rowan's law protocol adhered"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Validation Error Message */}
          {validationError && (
            <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-800/90 px-6 py-4 border-t border-slate-700 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/30 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Score</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-300 hover:text-white px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="text-xs font-bold text-slate-950 px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Save & Update Standings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
