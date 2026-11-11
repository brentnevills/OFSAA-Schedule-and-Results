import React, { useState, useMemo, useEffect } from 'react';
import { Match, PoolId } from '../types/tournament';
import { useTournament } from '../context/TournamentContext';
import { TeamLogo } from './TeamLogo';
import { Clock, Edit3, Calendar, CheckCircle2, MapPin, ShieldCheck, ArrowLeft } from 'lucide-react';
import { GymSelector } from './GymSelector';
import { TimeSelector } from './TimeSelector';

interface ScheduleViewProps {
  onOpenScoreModal: (match: Match) => void;
  onOpenLogin?: () => void;
  highlightedMatchId?: string | null;
  onClearHighlight?: () => void;
  returnToStandingsPool?: PoolId | null;
  onReturnToStandings?: () => void;
}

/**
 * Parses time strings like "9:00 AM", "1:30 PM", "12:00 PM" into total minutes from midnight
 * for accurate chronological sorting of schedule cards and time headers.
 */
export const parseTimeToMinutes = (timeStr?: string): number => {
  if (!timeStr) return 9999;
  const cleaned = timeStr.trim().toUpperCase();
  const match = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return 9999;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3] ? match[3].toUpperCase() : null;

  if (period === 'PM' && hours < 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  } else if (!period) {
    // If no AM/PM provided and hours between 1 and 7, assume PM for typical school championship hours
    if (hours >= 1 && hours <= 7) {
      hours += 12;
    }
  }

  return hours * 60 + minutes;
};

export const ScheduleView: React.FC<ScheduleViewProps> = ({ 
  onOpenScoreModal, 
  onOpenLogin,
  highlightedMatchId,
  onClearHighlight,
  returnToStandingsPool,
  onReturnToStandings
}) => {
  const { tournament, teamsMap, isAdmin } = useTournament();
  const [selectedDay, setSelectedDay] = useState<number | 'ALL'>('ALL');
  const [selectedStage, setSelectedStage] = useState<'ALL' | 'pool' | 'playoffs'>('ALL');
  const [selectedPool, setSelectedPool] = useState<PoolId | 'ALL'>('ALL');
  const [selectedCourt, setSelectedCourt] = useState<string>('ALL');

  // Dynamically compile all active venues/gyms (from tournament venues + any custom assigned courts)
  const allAvailableCourts = useMemo(() => {
    const defaultVenues = tournament.venues && tournament.venues.length > 0
      ? tournament.venues
      : ['Gym 1', 'Gym 2', 'Gym 3', 'Gym 4'];
    const set = new Set<string>(defaultVenues);
    for (const m of tournament.matches) {
      if (m.court && m.court.trim()) {
        set.add(m.court.trim());
      }
    }
    return Array.from(set);
  }, [tournament.venues, tournament.matches]);

  // When navigating from the standings matrix, ensure the target match is visible and smoothly scroll to it
  useEffect(() => {
    if (!highlightedMatchId) return;

    const targetMatch = tournament.matches.find((m) => m.id === highlightedMatchId);
    if (!targetMatch) return;

    // Reset filters that would hide this match
    if (selectedDay !== 'ALL' && selectedDay !== targetMatch.day) {
      setSelectedDay('ALL');
    }
    if (selectedStage !== 'ALL' && selectedStage !== targetMatch.stage) {
      setSelectedStage('ALL');
    }
    if (selectedPool !== 'ALL' && targetMatch.pool && selectedPool !== targetMatch.pool) {
      setSelectedPool('ALL');
    }
    if (selectedCourt !== 'ALL' && targetMatch.court && selectedCourt !== targetMatch.court) {
      setSelectedCourt('ALL');
    }

    const timer = setTimeout(() => {
      const el = document.getElementById(`match-${highlightedMatchId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [highlightedMatchId, tournament.matches]);

  const filteredMatches = useMemo(() => {
    return tournament.matches.filter((m) => {
      if (selectedDay !== 'ALL' && m.day !== selectedDay) return false;
      if (selectedStage === 'pool' && m.stage !== 'pool') return false;
      if (selectedStage === 'playoffs' && m.stage === 'pool') return false;
      if (selectedPool !== 'ALL' && m.pool !== selectedPool) return false;
      if (selectedCourt !== 'ALL' && m.court !== selectedCourt) return false;

      return true;
    });
  }, [tournament.matches, selectedDay, selectedStage, selectedPool, selectedCourt]);

  // Sort matches chronologically: Day -> Time in minutes -> Match number
  const sortedMatches = useMemo(() => {
    return [...filteredMatches].sort((a, b) => {
      // 1. Day
      const dayDiff = (a.day || 1) - (b.day || 1);
      if (dayDiff !== 0) return dayDiff;

      // 2. Time in minutes from midnight
      const timeA = parseTimeToMinutes(a.time);
      const timeB = parseTimeToMinutes(b.time);
      if (timeA !== timeB) return timeA - timeB;

      // 3. Match Number
      const numA = typeof a.matchNumber === 'number' ? a.matchNumber : parseInt(String(a.matchNumber || a.id).replace(/\D/g, ''), 10) || 0;
      const numB = typeof b.matchNumber === 'number' ? b.matchNumber : parseInt(String(b.matchNumber || b.id).replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });
  }, [filteredMatches]);

  // Group matches by Day & Time slot for clean readable schedule in strict chronological order
  const groupedByTime = useMemo(() => {
    const groups: { [key: string]: Match[] } = {};
    for (const match of sortedMatches) {
      const key = `${match.dayLabel} • ${match.time}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(match);
    }
    return groups;
  }, [sortedMatches]);

  return (
    <div className="space-y-6">
      {/* Schedule Controls & Filters - Phone Optimized */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-black text-[#0b2341] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-sky-600" />
              <span>Championship Schedule & Scores</span>
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Preliminary pool play (best of 3 sets) & playoffs (best of 5 sets).
            </p>
          </div>

          <div className="text-xs font-semibold text-slate-500 self-start sm:self-auto">
            Showing <strong className="text-slate-900 font-bold">{filteredMatches.length}</strong> matches
          </div>
        </div>

        {isAdmin && (
          <div className="bg-sky-50 border border-sky-200 rounded-xl px-3.5 py-2 text-xs text-sky-900 flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
              <span><strong>Convenor Control:</strong> You can edit gym assignments independently for any game by clicking its gym badge, or click Score to manage sets.</span>
            </span>
          </div>
        )}

        {/* Clean Filter Pills with smooth horizontal swipe on phones */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto no-scrollbar pb-0.5">
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

          {/* Location / Gym Filters */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setSelectedCourt('ALL')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedCourt === 'ALL'
                  ? 'bg-[#0b2341] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Gyms
            </button>
            {allAvailableCourts.map((gym) => (
              <button
                key={gym}
                onClick={() => setSelectedCourt(gym)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedCourt === gym
                    ? 'bg-[#0b2341] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {gym}
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
                const isHighlighted = highlightedMatchId === match.id;

                const t1Name = team1?.schoolName || team1?.name || match.team1Placeholder || `Seed #${match.team1Id}`;
                const t2Name = team2?.schoolName || team2?.name || match.team2Placeholder || `Seed #${match.team2Id}`;

                return (
                  <div
                    key={match.id}
                    id={`match-${match.id}`}
                    className={`bg-white border rounded-2xl p-4 shadow-xs transition-all duration-300 ${
                      isHighlighted
                        ? 'ring-4 ring-sky-500 shadow-xl bg-sky-50/40 border-sky-400 scale-[1.01]'
                        : isFinal
                        ? 'border-slate-300'
                        : 'border-slate-200 hover:border-sky-300'
                    }`}
                  >
                    {/* Highlight Banner if navigated to from standings matrix */}
                    {isHighlighted && (
                      <div className="bg-[#0b2341] text-white px-3.5 py-2 rounded-xl flex items-center justify-between text-xs font-bold mb-3 shadow-sm border border-sky-400">
                        <span className="flex items-center gap-1.5 text-sky-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>
                            {isFinal ? 'Game Results' : 'Game Schedule'}:{' '}
                            <strong className="text-white">
                              {match.pool ? `Pool ${match.pool}` : match.name || ''} Match #{match.matchNumber || match.id}
                            </strong>
                          </span>
                        </span>
                        <div className="flex items-center gap-2">
                          {onReturnToStandings && (
                            <button
                              type="button"
                              onClick={onReturnToStandings}
                              className="bg-sky-500 hover:bg-sky-400 text-[#0b2341] px-2.5 py-1 rounded-md text-[11px] font-black transition-colors shadow-2xs flex items-center gap-1"
                            >
                              <ArrowLeft className="w-3 h-3" />
                              <span>Back to Matrix</span>
                            </button>
                          )}
                          {onClearHighlight && (
                            <button
                              type="button"
                              onClick={onClearHighlight}
                              className="text-white/60 hover:text-white text-xs px-1 hover:bg-white/10 rounded transition-colors"
                              title="Dismiss highlight"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Card Top: Stage/Pool, Time, Gym & Status */}
                    <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100 flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <span className="font-extrabold text-[#0b2341] bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-md text-[11px]">
                          {match.pool ? `Pool ${match.pool}` : match.name || match.matchNumber}
                        </span>
                        <TimeSelector
                          matchId={match.id}
                          currentTime={match.time}
                          currentDay={match.day}
                          currentDayLabel={match.dayLabel}
                          onOpenLogin={onOpenLogin}
                        />
                        <GymSelector
                          matchId={match.id}
                          currentCourt={match.court}
                          onOpenLogin={onOpenLogin}
                        />
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

                    {/* Team Matchup with Large Bold Scores */}
                    <div className="py-3 space-y-3">
                      {/* Team 1 Row */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <TeamLogo team={team1} size="md" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`text-sm sm:text-base truncate leading-snug ${
                                  isT1Winner ? 'font-black text-slate-900' : 'font-semibold text-slate-800'
                                }`}
                              >
                                {t1Name}
                              </span>
                              {team1 && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                                  #{team1.seed}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] sm:text-[11px] text-slate-500 block truncate">
                              {team1?.association || match.team1Placeholder || 'Qualifier'}
                            </span>
                          </div>
                        </div>

                        {/* Team 1 Large Sets Score Badge */}
                        <div className="text-right pl-2 shrink-0">
                          <span
                            className={`min-w-[42px] h-10 sm:min-w-[48px] sm:h-12 px-2.5 flex items-center justify-center font-mono font-black text-2xl sm:text-3xl rounded-xl transition-all ${
                              isT1Winner
                                ? 'bg-[#0b2341] text-sky-300 shadow-sm ring-1 ring-sky-400/40'
                                : isFinal
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-slate-50 text-slate-300 border border-dashed border-slate-200 text-xl'
                            }`}
                          >
                            {isFinal ? match.team1SetsWon ?? 0 : '—'}
                          </span>
                        </div>
                      </div>

                      {/* Team 2 Row */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <TeamLogo team={team2} size="md" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`text-sm sm:text-base truncate leading-snug ${
                                  isT2Winner ? 'font-black text-slate-900' : 'font-semibold text-slate-800'
                                }`}
                              >
                                {t2Name}
                              </span>
                              {team2 && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                                  #{team2.seed}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] sm:text-[11px] text-slate-500 block truncate">
                              {team2?.association || match.team2Placeholder || 'Qualifier'}
                            </span>
                          </div>
                        </div>

                        {/* Team 2 Large Sets Score Badge */}
                        <div className="text-right pl-2 shrink-0">
                          <span
                            className={`min-w-[42px] h-10 sm:min-w-[48px] sm:h-12 px-2.5 flex items-center justify-center font-mono font-black text-2xl sm:text-3xl rounded-xl transition-all ${
                              isT2Winner
                                ? 'bg-[#0b2341] text-sky-300 shadow-sm ring-1 ring-sky-400/40'
                                : isFinal
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-slate-50 text-slate-300 border border-dashed border-slate-200 text-xl'
                            }`}
                          >
                            {isFinal ? match.team2SetsWon ?? 0 : '—'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Set-by-Set Breakdown if Final (Large, bold, phone-friendly) */}
                    {isFinal && match.sets && match.sets.length > 0 && (
                      <div className="pt-2.5 mt-1 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <span>Set Scores:</span>
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          {match.sets.map((s, idx) => {
                            const isT1SetWinner = s.team1Score > s.team2Score;
                            return (
                              <div
                                key={idx}
                                className="bg-slate-100/90 border border-slate-200/90 rounded-lg px-2.5 py-1 sm:py-1.5 flex items-center gap-1 text-xs sm:text-sm font-mono font-extrabold text-slate-800 shadow-2xs"
                              >
                                <span className="text-[10px] text-slate-400 font-sans font-semibold mr-0.5">
                                  S{idx + 1}
                                </span>
                                <span className={isT1SetWinner ? 'text-[#0b2341] font-black' : 'text-slate-600'}>
                                  {s.team1Score}
                                </span>
                                <span className="text-slate-300">-</span>
                                <span className={!isT1SetWinner ? 'text-[#0b2341] font-black' : 'text-slate-600'}>
                                  {s.team2Score}
                                </span>
                              </div>
                            );
                          })}
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
