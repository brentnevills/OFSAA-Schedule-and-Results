import React, { useState } from 'react';
import { Match, Team } from '../types/tournament';
import { useTournament } from '../context/TournamentContext';
import { Trophy, Medal, Sparkles, Clock, MapPin, Edit3, Award } from 'lucide-react';

interface PlayoffsViewProps {
  onOpenScoreModal: (match: Match) => void;
}

export const PlayoffsView: React.FC<PlayoffsViewProps> = ({ onOpenScoreModal }) => {
  const { tournament, matchesMap, teamsMap, isAdmin } = useTournament();
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
        className={`flex items-center justify-between p-2.5 rounded-lg border text-xs transition-colors ${
          isWinner
            ? 'bg-amber-500/15 border-amber-500/40 text-amber-200 font-bold'
            : 'bg-slate-800/80 border-slate-700/80 text-slate-300'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {team ? (
            <>
              <div
                className="w-6 h-6 rounded flex items-center justify-center text-xs shrink-0 border border-slate-600"
                style={{
                  backgroundColor: team.accentColor ? `${team.accentColor}33` : '#1e293b',
                  borderColor: team.accentColor || '#475569',
                }}
              >
                {team.logoUrl?.startsWith('data:') || team.logoUrl?.startsWith('http') ? (
                  <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover rounded" />
                ) : (
                  <span>{team.logoUrl || '🏐'}</span>
                )}
              </div>
              <div className="truncate">
                <span className="font-semibold text-white truncate block">
                  {team.schoolName || team.name}
                </span>
                <span className="text-[10px] text-slate-400">
                  {team.poolSlot} • Seed #{team.seed}
                </span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-400 italic">
              <span className="w-5 h-5 rounded bg-slate-700/50 flex items-center justify-center text-[10px] font-mono not-italic text-amber-400">
                ?
              </span>
              <span>{placeholder}</span>
            </div>
          )}
        </div>

        <span
          className={`font-mono text-sm px-2 py-0.5 rounded font-bold ${
            isWinner ? 'bg-amber-500 text-slate-950' : 'bg-slate-700/80 text-slate-300'
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
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg p-3 relative group hover:border-slate-700 transition-all">
        {/* Match Header */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2 border-b border-slate-800 pb-1.5">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="text-amber-400 font-bold">{match.matchNumber || title}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              {match.time}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-amber-500" />
            <span className="text-slate-300 font-medium">{match.court}</span>
          </div>
        </div>

        {/* Teams */}
        <div className="space-y-1.5">
          {renderTeamCard(match.team1Id, match.team1Placeholder, t1Won, t1Wins)}
          {renderTeamCard(match.team2Id, match.team2Placeholder, t2Won, t2Wins)}
        </div>

        {/* Set breakdown */}
        {match.sets && match.sets.length > 0 && (
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
            <span>Sets:</span>
            <div className="flex items-center gap-1 font-mono text-slate-300">
              {match.sets.map((s, idx) => (
                <span key={idx} className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                  {s.team1Score}-{s.team2Score}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        {isAdmin && (
          <div className="mt-2.5 pt-2 border-t border-slate-800 flex justify-end">
            <button
              onClick={() => onOpenScoreModal(match)}
              className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded border border-amber-500/30 flex items-center gap-1 transition-colors"
            >
              <Edit3 className="w-3 h-3" />
              <span>{isFinal ? 'Edit Score' : 'Enter Score'}</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                OFSAA Elimination Stage
              </span>
              <span className="text-xs text-slate-400">Best 3 of 5 Sets</span>
            </div>
            <h2 className="text-xl font-black text-white mt-1">Championship & Consolation Brackets</h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Automatic seeding based on preliminary round pool rankings. Top 2 from each pool compete for the OFSAA Gold,
              Silver, and Bronze medallions. 3rd and 4th place compete for the Consolation Plaque.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActivePlayoffTab('championship')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activePlayoffTab === 'championship'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-900" />
              <span>Championship (1-8)</span>
            </button>
            <button
              onClick={() => setActivePlayoffTab('consolation')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activePlayoffTab === 'consolation'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Medal className="w-4 h-4 text-blue-200" />
              <span>Consolation (9-16)</span>
            </button>
          </div>
        </div>
      </div>

      {/* CHAMPIONSHIP BRACKET */}
      {activePlayoffTab === 'championship' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>Championship Playoff Tree</span>
            </h3>
            <span className="text-xs text-slate-400">Day 2 (QF) & Day 3 (SF, Bronze, Gold)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Round 1: Quarterfinals */}
            <div className="space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 text-center py-1 bg-slate-900/60 rounded border border-slate-800">
                Quarterfinals (Day 2 - 6:30 PM)
              </div>
              {renderMatchCard(hqf1, 'G5: 1A vs 2B')}
              {renderMatchCard(hqf2, 'G6: 1D vs 2C')}
              {renderMatchCard(hqf3, 'G7: 1C vs 2D')}
              {renderMatchCard(hqf4, 'G8: 1B vs 2A')}
            </div>

            {/* Round 2: Semifinals */}
            <div className="space-y-6">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 text-center py-1 bg-slate-900/60 rounded border border-slate-800">
                Semifinals (Day 3 - 11:00 AM)
              </div>
              <div className="my-auto space-y-12">
                {renderMatchCard(hsf1, 'Semi 1 (Win G5 vs Win G6)')}
                {renderMatchCard(hsf2, 'Semi 2 (Win G7 vs Win G8)')}
              </div>
            </div>

            {/* Round 3: Championship Gold & Bronze */}
            <div className="space-y-6">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400 text-center py-1 bg-amber-500/10 rounded border border-amber-500/30">
                Championship Finals (Day 3)
              </div>

              {/* Gold Medal Match */}
              <div className="bg-gradient-to-b from-amber-500/10 via-slate-900 to-slate-900 border-2 border-amber-500/40 rounded-xl p-1 shadow-2xl">
                <div className="bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider py-1 px-3 text-center rounded-t-lg flex items-center justify-center gap-1.5">
                  <Trophy className="w-4 h-4" />
                  <span>Gold Medal Championship Match (5:00 PM)</span>
                </div>
                <div className="p-2">
                  {renderMatchCard(gold, 'Championship Final')}
                </div>
                {gold?.status === 'final' && gold.winnerId && (
                  <div className="m-2 p-3 bg-amber-500/20 border border-amber-500/40 rounded-lg text-center">
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest block">
                      OFSAA Provincial Champion
                    </span>
                    <span className="text-lg font-black text-white mt-1 block">
                      {teamsMap.get(gold.winnerId)?.schoolName} {teamsMap.get(gold.winnerId)?.teamNickname}
                    </span>
                    <span className="text-xs text-amber-300 font-semibold mt-0.5 block">
                      Awarded OFSAA Championship Banner & Gold Medallions
                    </span>
                  </div>
                )}
              </div>

              {/* Bronze Medal Match */}
              <div className="border border-slate-700/80 rounded-xl p-1 bg-slate-900 shadow-md">
                <div className="bg-slate-800 text-amber-300 font-bold text-xs uppercase tracking-wider py-1 px-3 text-center rounded-t-lg flex items-center justify-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Bronze Medal Match (3:00 PM)</span>
                </div>
                <div className="p-2">
                  {renderMatchCard(bronze, 'Bronze Match')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONSOLATION BRACKET */}
      {activePlayoffTab === 'consolation' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Medal className="w-5 h-5 text-blue-400" />
              <span>Consolation Playoff Tree</span>
            </h3>
            <span className="text-xs text-slate-400">Day 2 (QF) & Day 3 (SF, Consolation Final)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Round 1: Quarterfinals */}
            <div className="space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 text-center py-1 bg-slate-900/60 rounded border border-slate-800">
                Consolation QF (Day 2 - 4:30 PM)
              </div>
              {renderMatchCard(cqf1, 'G1: 3A vs 4B')}
              {renderMatchCard(cqf2, 'G2: 3D vs 4C')}
              {renderMatchCard(cqf3, 'G3: 3C vs 4D')}
              {renderMatchCard(cqf4, 'G4: 3B vs 4A')}
            </div>

            {/* Round 2: Semifinals */}
            <div className="space-y-6">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 text-center py-1 bg-slate-900/60 rounded border border-slate-800">
                Consolation Semifinals (Day 3 - 9:00 AM)
              </div>
              <div className="my-auto space-y-12">
                {renderMatchCard(csf1, 'CSF 1 (Win G1 vs Win G2)')}
                {renderMatchCard(csf2, 'CSF 2 (Win G3 vs Win G4)')}
              </div>
            </div>

            {/* Round 3: Consolation Final */}
            <div className="space-y-6">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-400 text-center py-1 bg-blue-500/10 rounded border border-blue-500/30">
                Consolation Final (Day 3 - 1:00 PM)
              </div>

              <div className="bg-gradient-to-b from-blue-950/30 via-slate-900 to-slate-900 border-2 border-blue-500/40 rounded-xl p-1 shadow-2xl">
                <div className="bg-blue-600 text-white font-black text-xs uppercase tracking-wider py-1 px-3 text-center rounded-t-lg flex items-center justify-center gap-1.5">
                  <Medal className="w-4 h-4" />
                  <span>Consolation Final (Plaque Match)</span>
                </div>
                <div className="p-2">
                  {renderMatchCard(cfin, 'Consolation Championship')}
                </div>
                {cfin?.status === 'final' && cfin.winnerId && (
                  <div className="m-2 p-3 bg-blue-500/20 border border-blue-500/40 rounded-lg text-center">
                    <span className="text-[11px] font-bold text-blue-400 uppercase tracking-widest block">
                      Consolation Champion
                    </span>
                    <span className="text-lg font-black text-white mt-1 block">
                      {teamsMap.get(cfin.winnerId)?.schoolName} {teamsMap.get(cfin.winnerId)?.teamNickname}
                    </span>
                    <span className="text-xs text-blue-300 font-semibold mt-0.5 block">
                      Awarded OFSAA Consolation Plaque
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
