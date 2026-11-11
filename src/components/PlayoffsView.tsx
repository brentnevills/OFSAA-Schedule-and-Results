import React, { useState } from 'react';
import { Match } from '../types/tournament';
import { useTournament } from '../context/TournamentContext';
import { TeamLogo } from './TeamLogo';
import { Trophy, Medal, Clock, Edit3, Award, MapPin } from 'lucide-react';
import { GymSelector } from './GymSelector';
import { TimeSelector } from './TimeSelector';

interface PlayoffsViewProps {
  onOpenScoreModal: (match: Match) => void;
  onOpenLogin?: () => void;
}

export const PlayoffsView: React.FC<PlayoffsViewProps> = ({ onOpenScoreModal, onOpenLogin }) => {
  const { matchesMap, teamsMap, isAdmin } = useTournament();
  const [activePlayoffTab, setActivePlayoffTab] = useState<'championship' | 'consolation'>('championship');

  // Championship matches
  const hqf1 = matchesMap.get('HQF-1');
  const hqf2 = matchesMap.get('HQF-2');
  const hqf3 = matchesMap.get('HQF-3');
  const hqf4 = matchesMap.get('HQF-4');
  const hsf1 = matchesMap.get('HSF-1');
  const hsf2 = matchesMap.get('HSF-2');
  const gold = matchesMap.get('GOLD');
  const bronze = matchesMap.get('BRONZE');

  // Consolation matches
  const cqf1 = matchesMap.get('CQF-1');
  const cqf2 = matchesMap.get('CQF-2');
  const cqf3 = matchesMap.get('CQF-3');
  const cqf4 = matchesMap.get('CQF-4');
  const csf1 = matchesMap.get('CSF-1');
  const csf2 = matchesMap.get('CSF-2');
  const cfin = matchesMap.get('CFIN');

  const renderTeamCard = (
    teamId: string,
    placeholder: string = 'TBD',
    isWinner: boolean = false,
    setsWon: number = 0
  ) => {
    const team = teamsMap.get(teamId);

    return (
      <div
        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-colors ${
          isWinner
            ? 'bg-sky-50 border-sky-400 text-slate-900 font-extrabold shadow-2xs'
            : 'bg-white border-slate-200 text-slate-700'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {team ? (
            <>
              <TeamLogo team={team} size="sm" />
              <div className="truncate min-w-0 flex-1">
                <span className="font-bold text-slate-900 truncate block text-xs sm:text-sm">
                  {team.schoolName || team.name}
                </span>
                <span className="text-[10px] sm:text-[11px] text-slate-500 font-semibold">
                  {team.poolSlot} • Seed #{team.seed}
                </span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-slate-400 italic">
              <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-bold not-italic text-[#0b2341]">
                TBD
              </span>
              <span className="text-xs font-medium text-slate-500">{placeholder}</span>
            </div>
          )}
        </div>

        <span
          className={`font-mono text-base sm:text-lg min-w-[36px] sm:min-w-[42px] h-9 sm:h-10 px-2 flex items-center justify-center rounded-lg font-black shrink-0 transition-all ${
            isWinner
              ? 'bg-[#0b2341] text-sky-300 shadow-2xs ring-1 ring-sky-400/30'
              : 'bg-slate-100 text-slate-700'
          }`}
        >
          {setsWon}
        </span>
      </div>
    );
  };

  const renderMatchCard = (match?: Match, title?: string) => {
    if (!match) return null;

    const t1Wins = match.team1SetsWon || 0;
    const t2Wins = match.team2SetsWon || 0;
    const isFinal = match.status === 'final';
    const t1Won = isFinal && match.winnerId === match.team1Id;
    const t2Won = isFinal && match.winnerId === match.team2Id;

    return (
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-3.5 sm:p-4 relative hover:border-sky-300 transition-all">
        {/* Match Header */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2.5 border-b border-slate-100 pb-2">
          <div className="flex items-center gap-1.5 font-bold flex-wrap">
            <span className="text-[#0b2341] uppercase tracking-wider font-black">{match.matchNumber || title}</span>
            <span className="text-slate-300">•</span>
            <TimeSelector
              matchId={match.id}
              currentTime={match.time}
              currentDay={match.day}
              currentDayLabel={match.dayLabel}
              onOpenLogin={onOpenLogin}
            />
            <span className="text-slate-300">•</span>
            <GymSelector matchId={match.id} currentCourt={match.court} onOpenLogin={onOpenLogin} />
          </div>

          {isAdmin && (
            <button
              onClick={() => onOpenScoreModal(match)}
              className="text-xs font-bold text-sky-700 hover:text-sky-900 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-200 flex items-center gap-1 transition-colors"
            >
              <Edit3 className="w-3 h-3" />
              <span>Score</span>
            </button>
          )}
        </div>

        {/* Teams */}
        <div className="space-y-2.5">
          {renderTeamCard(match.team1Id, match.team1Placeholder, t1Won, t1Wins)}
          {renderTeamCard(match.team2Id, match.team2Placeholder, t2Won, t2Wins)}
        </div>

        {/* Set breakdown (Phone friendly & larger) */}
        {match.sets && match.sets.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs text-slate-600">
            <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500">Sets:</span>
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs sm:text-sm font-extrabold text-slate-800">
              {match.sets.map((s, idx) => {
                const isT1SetWinner = s.team1Score > s.team2Score;
                return (
                  <span
                    key={idx}
                    className="bg-slate-100/90 border border-slate-200 px-2.5 py-1 rounded-lg shadow-2xs flex items-center gap-1"
                  >
                    <span className="text-[10px] text-slate-400 font-sans font-semibold mr-0.5">S{idx + 1}</span>
                    <span className={isT1SetWinner ? 'text-[#0b2341] font-black' : 'text-slate-600'}>{s.team1Score}</span>
                    <span className="text-slate-300">-</span>
                    <span className={!isT1SetWinner ? 'text-[#0b2341] font-black' : 'text-slate-600'}>{s.team2Score}</span>
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Playoff Bracket Tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-[#0b2341] flex items-center gap-2">
            <Trophy className="w-5 h-5 text-sky-600" />
            <span>Championship & Consolation Brackets</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Playoff matches are best 3 of 5 sets. Seeds 1-2 qualify for Championship; Seeds 3-4 qualify for Consolation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActivePlayoffTab('championship')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
              activePlayoffTab === 'championship'
                ? 'bg-[#0b2341] text-sky-300 shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Championship Bracket</span>
          </button>
          <button
            onClick={() => setActivePlayoffTab('consolation')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
              activePlayoffTab === 'consolation'
                ? 'bg-[#0b2341] text-sky-300 shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Medal className="w-3.5 h-3.5" />
            <span>Consolation Bracket</span>
          </button>
        </div>
      </div>

      {/* Championship Bracket Display */}
      {activePlayoffTab === 'championship' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Round 1: Quarterfinals */}
            <div className="space-y-4">
              <div className="bg-[#0b2341] text-white px-4 py-2.5 rounded-xl border-b-2 border-sky-400">
                <h3 className="text-xs font-black uppercase tracking-wider text-sky-300">
                  Quarterfinals (Best of 5)
                </h3>
                <span className="text-[10px] text-sky-200">Friday • Top 2 Pool Finishers</span>
              </div>
              <div className="space-y-4">
                {renderMatchCard(hqf1, 'Championship QF 1')}
                {renderMatchCard(hqf2, 'Championship QF 2')}
                {renderMatchCard(hqf3, 'Championship QF 3')}
                {renderMatchCard(hqf4, 'Championship QF 4')}
              </div>
            </div>

            {/* Round 2: Semifinals */}
            <div className="space-y-4">
              <div className="bg-[#0b2341] text-white px-4 py-2.5 rounded-xl border-b-2 border-sky-400">
                <h3 className="text-xs font-black uppercase tracking-wider text-sky-300">
                  Semifinals (Best of 5)
                </h3>
                <span className="text-[10px] text-sky-200">Saturday Morning</span>
              </div>
              <div className="space-y-4 pt-4">
                {renderMatchCard(hsf1, 'Championship Semifinal 1')}
                <div className="h-8 hidden lg:block" />
                {renderMatchCard(hsf2, 'Championship Semifinal 2')}
              </div>
            </div>

            {/* Round 3: Medal Matches */}
            <div className="space-y-4">
              <div className="bg-[#0b2341] text-white px-4 py-2.5 rounded-xl border-b-2 border-sky-400">
                <h3 className="text-xs font-black uppercase tracking-wider text-sky-300">
                  Championship Finals
                </h3>
                <span className="text-[10px] text-sky-200">Saturday Afternoon</span>
              </div>
              <div className="space-y-6">
                {/* Gold Match */}
                <div className="border-2 border-amber-300 rounded-2xl p-1 bg-gradient-to-br from-amber-50 to-white shadow-xs">
                  <div className="px-3 py-1 flex items-center justify-between text-xs font-extrabold text-[#0b2341]">
                    <span className="flex items-center gap-1">
                      <Award className="w-4 h-4 text-amber-500" />
                      Gold Medal Match
                    </span>
                    <span className="text-[10px] bg-amber-200 text-amber-950 px-2 py-0.5 rounded font-bold">
                      OFSAA Champions
                    </span>
                  </div>
                  {renderMatchCard(gold, 'Gold Medal Final')}
                </div>

                {/* Bronze Match */}
                <div className="border border-slate-200 rounded-2xl p-1 bg-white shadow-xs">
                  <div className="px-3 py-1 flex items-center justify-between text-xs font-extrabold text-slate-800">
                    <span className="flex items-center gap-1">
                      <Medal className="w-4 h-4 text-slate-400" />
                      Bronze Medal Match
                    </span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">
                      3rd Place
                    </span>
                  </div>
                  {renderMatchCard(bronze, 'Bronze Medal Final')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Consolation Bracket Display */}
      {activePlayoffTab === 'consolation' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Consolation QF */}
            <div className="space-y-4">
              <div className="bg-[#0b2341] text-white px-4 py-2.5 rounded-xl border-b-2 border-sky-400">
                <h3 className="text-xs font-black uppercase tracking-wider text-sky-300">
                  Consolation Quarterfinals
                </h3>
                <span className="text-[10px] text-sky-200">Friday • 3rd & 4th in Pools</span>
              </div>
              <div className="space-y-4">
                {renderMatchCard(cqf1, 'Consolation QF 1')}
                {renderMatchCard(cqf2, 'Consolation QF 2')}
                {renderMatchCard(cqf3, 'Consolation QF 3')}
                {renderMatchCard(cqf4, 'Consolation QF 4')}
              </div>
            </div>

            {/* Consolation SF */}
            <div className="space-y-4">
              <div className="bg-[#0b2341] text-white px-4 py-2.5 rounded-xl border-b-2 border-sky-400">
                <h3 className="text-xs font-black uppercase tracking-wider text-sky-300">
                  Consolation Semifinals
                </h3>
                <span className="text-[10px] text-sky-200">Saturday Morning</span>
              </div>
              <div className="space-y-4 pt-4">
                {renderMatchCard(csf1, 'Consolation Semifinal 1')}
                <div className="h-8 hidden lg:block" />
                {renderMatchCard(csf2, 'Consolation Semifinal 2')}
              </div>
            </div>

            {/* Consolation Final */}
            <div className="space-y-4">
              <div className="bg-[#0b2341] text-white px-4 py-2.5 rounded-xl border-b-2 border-sky-400">
                <h3 className="text-xs font-black uppercase tracking-wider text-sky-300">
                  Consolation Championship
                </h3>
                <span className="text-[10px] text-sky-200">Saturday 1:00 PM</span>
              </div>
              <div className="space-y-6">
                <div className="border border-sky-200 rounded-2xl p-1 bg-gradient-to-br from-sky-50 to-white shadow-xs">
                  <div className="px-3 py-1 flex items-center justify-between text-xs font-extrabold text-[#0b2341]">
                    <span className="flex items-center gap-1">
                      <Award className="w-4 h-4 text-sky-600" />
                      Consolation Final (Plaque)
                    </span>
                  </div>
                  {renderMatchCard(cfin, 'Consolation Final')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
