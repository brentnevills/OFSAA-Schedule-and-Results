import React, { useState, useMemo } from 'react';
import { Match, PoolId } from '../types/tournament';
import { useTournament } from '../context/TournamentContext';
import { TeamLogo } from './TeamLogo';
import { Clock, Edit3, Calendar, CheckCircle2 } from 'lucide-react';

interface ScheduleViewProps {
  onOpenScoreModal: (match: Match) => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({ onOpenScoreModal }) => {
  const { tournament, teamsMap, isAdmin } = useTournament();
  const [selectedDay, setSelectedDay] = useState<number | 'ALL'>('ALL');
  const [selectedStage, setSelectedStage] = useState<'ALL' | 'pool' | 'playoffs'>('ALL');
  const [selectedPool, setSelectedPool] = useState<PoolId | 'ALL'>('ALL');

  const filteredMatches = useMemo(() => {
    return tournament.matches.filter((m) => {
      if (selectedDay !== 'ALL' && m.day !== selectedDay) return false;
      if (selectedStage === 'pool' && m.stage !== 'pool') return false;
      if (selectedStage === 'playoffs' && m.stage === 'pool') return false;
      if (selectedPool !== 'ALL' && m.pool !== selectedPool) return false;

      return true;
    });
  }, [tournament.matches, selectedDay, selectedStage, selectedPool]);

  // Group matches by Day & Time slot for clean readable schedule
  const groupedByTime = useMemo(() => {
    const groups: { [key: string]: Match[] } = {};
    for (const match of filteredMatches) {
      const key = `${match.dayLabel} • ${match.time}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(match);
    }
    return groups;
  }, [filteredMatches]);

  return (
    <div className="space-y-6">
      {/* Schedule Controls & Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-[#0b2341] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-sky-600" />
              <span>Championship Schedule & Scores</span>
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Round robin pool matches (best of 3 sets) & playoff bracket matches (best of 5 sets).
            </p>
          </div>

          <div className="text-xs font-semibold text-slate-500">
            Showing <strong className="text-slate-900 font-bold">{filteredMatches.length}</strong> matches
          </div>
        </div>

        {/* Clean Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          {/* Day Filters */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setSelectedDay('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedDay === 'ALL'
                  ? 'bg-[#0b2341] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Days
            </button>
            <button
              onClick={() => setSelectedDay(1)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedDay === 1
                  ? 'bg-[#0b2341] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Day 1 (Thu)
            </button>
            <button
              onClick={() => setSelectedDay(2)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedDay === 2
                  ? 'bg-[#0b2341] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Day 2 (Fri)
            </button>
            <button
              onClick={() => setSelectedDay(3)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedDay === 3
                  ? 'bg-[#0b2341] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Day 3 (Sat)
            </button>
          </div>

          {/* Stage Filters */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setSelectedStage('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedStage === 'ALL'
                  ? 'bg-[#0b2341] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Stages
            </button>
            <button
              onClick={() => setSelectedStage('pool')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedStage === 'pool'
                  ? 'bg-[#0b2341] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pool Play
            </button>
            <button
              onClick={() => setSelectedStage('playoffs')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedStage === 'playoffs'
                  ? 'bg-[#0b2341] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Playoffs
            </button>
          </div>

          {/* Pool Filters */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setSelectedPool('ALL')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedPool === 'ALL'
                  ? 'bg-[#0b2341] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Pools
            </button>
            {(['A', 'B', 'C', 'D'] as PoolId[]).map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPool(p)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedPool === p
                    ? 'bg-[#0b2341] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Match Listings Grouped by Time */}
      <div className="space-y-6">
        {Object.entries(groupedByTime).map(([timeHeader, matches]) => (
          <div key={timeHeader} className="space-y-3">
            {/* Clean Section Divider */}
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-600" />
              <h3 className="text-sm font-black text-[#0b2341] uppercase tracking-wider">
                {timeHeader}
              </h3>
              <div className="h-px bg-slate-200 flex-1 ml-2" />
            </div>

            {/* Grid of Match Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matches.map((match) => {
                const team1 = teamsMap.get(match.team1Id);
                const team2 = teamsMap.get(match.team2Id);
                const isFinal = match.status === 'final';
                const isT1Winner = match.winnerId && match.winnerId === match.team1Id;
                const isT2Winner = match.winnerId && match.winnerId === match.team2Id;

                const t1Name = team1?.schoolName || team1?.name || match.team1Placeholder || `Seed #${match.team1Id}`;
                const t2Name = team2?.schoolName || team2?.name || match.team2Placeholder || `Seed #${match.team2Id}`;

                return (
                  <div
                    key={match.id}
                    className={`bg-white border rounded-2xl p-4 shadow-xs transition-all ${
                      isFinal ? 'border-slate-300' : 'border-slate-200 hover:border-sky-300'
                    }`}
                  >
                    {/* Card Top: Stage/Pool & Status */}
                    <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[#0b2341] bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-md text-[11px]">
                          {match.pool ? `Pool ${match.pool}` : match.name || match.matchNumber}
                        </span>
                        <span className="text-slate-500 font-semibold text-[11px]">
                          Match #{match.matchNumber || match.id}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isFinal ? (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Final
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            Scheduled
                          </span>
                        )}

                        {isAdmin && (
                          <button
                            onClick={() => onOpenScoreModal(match)}
                            className="text-xs font-bold text-[#0b2341] hover:text-sky-700 bg-slate-100 hover:bg-sky-50 px-2.5 py-1 rounded-md border border-slate-200 flex items-center gap-1 transition-colors"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Score</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Team Matchup */}
                    <div className="py-3 space-y-2.5">
                      {/* Team 1 Row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <TeamLogo team={team1} size="md" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-sm truncate ${
                                  isT1Winner ? 'font-black text-slate-900' : 'font-semibold text-slate-800'
                                }`}
                              >
                                {t1Name}
                              </span>
                              {team1 && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                  #{team1.seed}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 block">
                              {team1?.association || match.team1Placeholder || 'Qualifier'}
                            </span>
                          </div>
                        </div>

                        {/* Team 1 Sets Score */}
                        <div className="text-right pl-3 shrink-0">
                          <span
                            className={`text-lg font-mono font-black ${
                              isT1Winner ? 'text-[#0b2341]' : isFinal ? 'text-slate-400' : 'text-slate-300'
                            }`}
                          >
                            {isFinal ? match.team1SetsWon ?? 0 : '—'}
                          </span>
                        </div>
                      </div>

                      {/* Team 2 Row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <TeamLogo team={team2} size="md" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-sm truncate ${
                                  isT2Winner ? 'font-black text-slate-900' : 'font-semibold text-slate-800'
                                }`}
                              >
                                {t2Name}
                              </span>
                              {team2 && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                  #{team2.seed}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 block">
                              {team2?.association || match.team2Placeholder || 'Qualifier'}
                            </span>
                          </div>
                        </div>

                        {/* Team 2 Sets Score */}
                        <div className="text-right pl-3 shrink-0">
                          <span
                            className={`text-lg font-mono font-black ${
                              isT2Winner ? 'text-[#0b2341]' : isFinal ? 'text-slate-400' : 'text-slate-300'
                            }`}
                          >
                            {isFinal ? match.team2SetsWon ?? 0 : '—'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Set-by-Set Breakdown if Final */}
                    {isFinal && match.sets && match.sets.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-[11px] font-semibold text-slate-500">Sets:</span>
                        <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-slate-700">
                          {match.sets.map((s, idx) => (
                            <span
                              key={idx}
                              className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200"
                            >
                              {s.team1Score}-{s.team2Score}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {filteredMatches.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
            <p className="text-sm font-semibold">No matches match your current filter criteria.</p>
            <button
              onClick={() => {
                setSelectedDay('ALL');
                setSelectedStage('ALL');
                setSelectedPool('ALL');
              }}
              className="mt-3 text-xs font-bold text-sky-700 hover:underline"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
