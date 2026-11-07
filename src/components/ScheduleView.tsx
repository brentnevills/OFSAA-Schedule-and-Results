import React, { useState, useMemo } from 'react';
import { Match, PoolId } from '../types/tournament';
import { useTournament } from '../context/TournamentContext';
import { Clock, MapPin, Edit3, CheckCircle2, Filter, Calendar, Trophy, Medal } from 'lucide-react';

interface ScheduleViewProps {
  onOpenScoreModal: (match: Match) => void;
  searchQuery?: string;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({ onOpenScoreModal, searchQuery = '' }) => {
  const { tournament, teamsMap, isAdmin } = useTournament();
  const [selectedDay, setSelectedDay] = useState<number | 'ALL'>('ALL');
  const [selectedCourt, setSelectedCourt] = useState<string>('ALL');
  const [selectedStage, setSelectedStage] = useState<string>('ALL');
  const [layoutMode, setLayoutMode] = useState<'cards' | 'grid'>('cards');

  const courts = ['St. Anne', "St. Joe's", 'CCH', 'Assumption'];

  const filteredMatches = useMemo(() => {
    return tournament.matches.filter((m) => {
      if (selectedDay !== 'ALL' && m.day !== selectedDay) return false;
      if (selectedCourt !== 'ALL' && m.court !== selectedCourt) return false;
      if (selectedStage === 'pool' && m.stage !== 'pool') return false;
      if (selectedStage === 'playoffs' && m.stage === 'pool') return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const t1 = teamsMap.get(m.team1Id);
        const t2 = teamsMap.get(m.team2Id);
        const matchText = [
          m.id,
          m.court,
          m.time,
          m.pool,
          m.name,
          m.team1Placeholder,
          m.team2Placeholder,
          t1?.name,
          t1?.schoolName,
          t1?.association,
          t2?.name,
          t2?.schoolName,
          t2?.association,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!matchText.includes(q)) return false;
      }

      return true;
    });
  }, [tournament.matches, selectedDay, selectedCourt, selectedStage, searchQuery, teamsMap]);

  // Group matches by Day and Time for Grid View
  const timeSlotsByDay = useMemo(() => {
    const slots: Record<number, string[]> = {
      1: ['9:00 AM', '10:30 AM', '12:00 PM', '1:30 PM', '3:00 PM', '4:30 PM'],
      2: ['8:30 AM', '10:00 AM', '11:30 AM', '1:00 PM', '4:30 PM', '6:30 PM'],
      3: ['9:00 AM', '11:00 AM', '1:00 PM', '3:00 PM', '5:00 PM'],
    };
    return slots;
  }, []);

  const renderTeamDisplay = (teamId: string, placeholder?: string, isWinner?: boolean) => {
    const team = teamsMap.get(teamId);
    if (!team) {
      return (
        <span className="text-slate-400 italic text-xs">
          {placeholder || 'TBD'}
        </span>
      );
    }

    return (
      <div className="flex items-center gap-1.5 min-w-0">
        <div
          className="w-5 h-5 rounded flex items-center justify-center text-[10px] shrink-0 border border-slate-700"
          style={{
            backgroundColor: team.accentColor ? `${team.accentColor}25` : '#1e293b',
            borderColor: team.accentColor || '#475569',
          }}
        >
          {team.logoUrl?.startsWith('data:') || team.logoUrl?.startsWith('http') ? (
            <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover rounded" />
          ) : (
            <span>{team.logoUrl || '🏐'}</span>
          )}
        </div>
        <span
          className={`truncate text-xs ${
            isWinner ? 'font-black text-amber-300' : 'font-medium text-slate-200'
          }`}
        >
          {team.schoolName || team.name}
        </span>
        <span className="text-[10px] font-mono text-slate-400">({team.poolSlot})</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              <span>Championship Schedule & Live Scoreboard</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Follow official match schedules across 4 venues. Round robin pool play (best 2/3) & playoffs (best 3/5).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLayoutMode('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                layoutMode === 'cards'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              Match Cards
            </button>
            <button
              onClick={() => setLayoutMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                layoutMode === 'grid'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              Paper Matrix View
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mr-2">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          {/* Day Filter */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setSelectedDay('ALL')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                selectedDay === 'ALL' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Days
            </button>
            <button
              onClick={() => setSelectedDay(1)}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                selectedDay === 1 ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Day 1 (Thu)
            </button>
            <button
              onClick={() => setSelectedDay(2)}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                selectedDay === 2 ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Day 2 (Fri)
            </button>
            <button
              onClick={() => setSelectedDay(3)}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                selectedDay === 3 ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Day 3 (Sat)
            </button>
          </div>

          {/* Court Filter */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setSelectedCourt('ALL')}
              className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                selectedCourt === 'ALL' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Courts
            </button>
            {courts.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCourt(c)}
                className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                  selectedCourt === c ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Stage Filter */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800 ml-auto">
            <button
              onClick={() => setSelectedStage('ALL')}
              className={`px-2 py-1 rounded text-xs font-semibold ${
                selectedStage === 'ALL' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Stages
            </button>
            <button
              onClick={() => setSelectedStage('pool')}
              className={`px-2 py-1 rounded text-xs font-semibold ${
                selectedStage === 'pool' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Pool Play
            </button>
            <button
              onClick={() => setSelectedStage('playoffs')}
              className={`px-2 py-1 rounded text-xs font-semibold ${
                selectedStage === 'playoffs' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Playoffs
            </button>
          </div>
        </div>
      </div>

      {/* MATRIX / PAPER SCHEDULE VIEW (Matches image attachment) */}
      {layoutMode === 'grid' && (
        <div className="space-y-8">
          {[1, 2, 3].map((dayNum) => {
            if (selectedDay !== 'ALL' && selectedDay !== dayNum) return null;
            const times = timeSlotsByDay[dayNum] || [];

            return (
              <div key={dayNum} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                <div className="bg-slate-800/90 px-4 py-3 border-b border-slate-700 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>
                      {dayNum === 1
                        ? 'DAY 1 - THURSDAY (Round Robin 2/3 matches)'
                        : dayNum === 2
                        ? 'DAY 2 - FRIDAY (Round Robin & Playoff Quarterfinals)'
                        : 'DAY 3 - SATURDAY (Playoff Semifinals & Championship Finals)'}
                    </span>
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">4 Courts System</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950/80 text-slate-300 border-b border-slate-800 font-bold uppercase text-[11px]">
                        <th className="p-3 w-24 border-r border-slate-800 text-amber-400">Time</th>
                        <th className="p-3 border-r border-slate-800">Court 1: St. Anne</th>
                        <th className="p-3 border-r border-slate-800">Court 2: St. Joe's</th>
                        <th className="p-3 border-r border-slate-800">Court 3: CCH</th>
                        <th className="p-3">Court 4: Assumption</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {times.map((time) => {
                        return (
                          <tr key={time} className="hover:bg-slate-800/30">
                            <td className="p-3 font-mono font-bold text-amber-400 bg-slate-950/40 border-r border-slate-800 whitespace-nowrap">
                              {time}
                            </td>

                            {courts.map((court) => {
                              const match = tournament.matches.find(
                                (m) => m.day === dayNum && m.time === time && m.court === court
                              );

                              if (!match) {
                                return (
                                  <td key={court} className="p-3 border-r border-slate-800 text-slate-600 italic">
                                    —
                                  </td>
                                );
                              }

                              const isFinal = match.status === 'final';
                              const t1 = teamsMap.get(match.team1Id);
                              const t2 = teamsMap.get(match.team2Id);

                              return (
                                <td key={court} className="p-2.5 border-r border-slate-800 align-top">
                                  <div className="bg-slate-800/60 p-2 rounded-lg border border-slate-700/60 hover:border-slate-600 transition-colors">
                                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                                      <span className="font-bold text-amber-400">
                                        {match.pool ? `Pool ${match.pool}` : match.matchNumber || match.name}
                                      </span>
                                      {isFinal && (
                                        <span className="bg-emerald-500/20 text-emerald-400 px-1 py-0.2 rounded font-bold">
                                          FINAL
                                        </span>
                                      )}
                                    </div>

                                    {/* Matchup */}
                                    <div className="font-semibold text-xs space-y-0.5">
                                      <div className="truncate">
                                        {t1 ? t1.schoolName || t1.name : match.team1Placeholder || match.team1Id}
                                      </div>
                                      <div className="text-[10px] text-slate-400 font-normal">vs</div>
                                      <div className="truncate">
                                        {t2 ? t2.schoolName || t2.name : match.team2Placeholder || match.team2Id}
                                      </div>
                                    </div>

                                    {/* Sets Score */}
                                    {isFinal && (
                                      <div className="mt-1 pt-1 border-t border-slate-700 flex items-center justify-between font-mono text-[11px] font-bold text-amber-300">
                                        <span>
                                          Sets: {match.team1SetsWon}-{match.team2SetsWon}
                                        </span>
                                        <span className="text-[9px] text-slate-400">
                                          ({match.sets.map((s) => `${s.team1Score}-${s.team2Score}`).join(', ')})
                                        </span>
                                      </div>
                                    )}

                                    {isAdmin && (
                                      <button
                                        onClick={() => onOpenScoreModal(match)}
                                        className="w-full mt-1.5 py-0.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[10px] font-bold rounded border border-amber-500/30 text-center transition-colors"
                                      >
                                        {isFinal ? 'Edit Score' : 'Score Game'}
                                      </button>
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CARDS VIEW */}
      {layoutMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMatches.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-xl">
              No matches found matching your filters.
            </div>
          ) : (
            filteredMatches.map((match) => {
              const isFinal = match.status === 'final';
              const t1Won = isFinal && match.winnerId === match.team1Id;
              const t2Won = isFinal && match.winnerId === match.team2Id;

              return (
                <div
                  key={match.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-md flex flex-col justify-between hover:border-slate-700 transition-all"
                >
                  {/* Top metadata */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-1.5 font-medium">
                        <span className="text-amber-400 font-bold">
                          {match.pool ? `Pool ${match.pool}` : match.name || match.matchNumber}
                        </span>
                        <span>•</span>
                        <span className="font-mono">{match.time}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-300">
                        <MapPin className="w-3 h-3 text-amber-400" />
                        <span>{match.court}</span>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-500 font-mono mt-1">
                      {match.dayLabel} • Best of {match.bestOf}
                    </div>

                    {/* Team Matchup rows */}
                    <div className="space-y-2 mt-3">
                      <div
                        className={`flex items-center justify-between p-2 rounded-lg border ${
                          t1Won
                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                            : 'bg-slate-800/60 border-slate-700/60'
                        }`}
                      >
                        {renderTeamDisplay(match.team1Id, match.team1Placeholder, t1Won)}
                        <span
                          className={`font-mono text-sm px-2 py-0.5 rounded font-bold ${
                            t1Won ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {match.team1SetsWon ?? 0}
                        </span>
                      </div>

                      <div
                        className={`flex items-center justify-between p-2 rounded-lg border ${
                          t2Won
                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                            : 'bg-slate-800/60 border-slate-700/60'
                        }`}
                      >
                        {renderTeamDisplay(match.team2Id, match.team2Placeholder, t2Won)}
                        <span
                          className={`font-mono text-sm px-2 py-0.5 rounded font-bold ${
                            t2Won ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {match.team2SetsWon ?? 0}
                        </span>
                      </div>
                    </div>

                    {/* Set Breakdown */}
                    {isFinal && match.sets && match.sets.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="text-[10px] uppercase font-bold text-slate-500">Sets:</span>
                        <div className="flex items-center gap-1 font-mono text-slate-300">
                          {match.sets.map((s, idx) => (
                            <span
                              key={idx}
                              className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 font-bold"
                            >
                              {s.team1Score}-{s.team2Score}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Admin Action */}
                  {isAdmin && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">Match ID: {match.id}</span>
                      <button
                        onClick={() => onOpenScoreModal(match)}
                        className="px-2.5 py-1 text-xs font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{isFinal ? 'Edit Score' : 'Score Game'}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
