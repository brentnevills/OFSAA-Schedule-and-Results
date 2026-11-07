import React, { useState } from 'react';
import { PoolId, TeamStanding, Match } from '../types/tournament';
import { useTournament } from '../context/TournamentContext';
import { 
  Trophy, 
  Medal, 
  ChevronRight, 
  AlertCircle, 
  Edit3, 
  CheckCircle2, 
  HelpCircle,
  TrendingUp,
  TableProperties
} from 'lucide-react';

interface PoolStandingsViewProps {
  onOpenScoreModal: (match: Match) => void;
  onOpenTeamModal: (teamId: string) => void;
  onViewTiebreakerRules: () => void;
  searchQuery?: string;
}

export const PoolStandingsView: React.FC<PoolStandingsViewProps> = ({
  onOpenScoreModal,
  onOpenTeamModal,
  onViewTiebreakerRules,
  searchQuery = '',
}) => {
  const { tournament, standingsByPool, matchesMap, isAdmin } = useTournament();
  const [selectedPool, setSelectedPool] = useState<PoolId | 'ALL'>('ALL');
  const [showMatrix, setShowMatrix] = useState<boolean>(true);

  const pools: PoolId[] = ['A', 'B', 'C', 'D'];

  const filterPools = selectedPool === 'ALL' ? pools : [selectedPool];

  return (
    <div className="space-y-8">
      {/* Legend & Format Overview */}
      <div className="bg-slate-800/80 rounded-xl p-4 sm:p-5 border border-slate-700/80 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <TableProperties className="w-5 h-5 text-amber-400" />
              <span>Preliminary Round Pool Standings</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Top 2 teams in each pool advance to Championship Playoffs. 3rd & 4th place advance to Consolation Playoffs.
              Standings & tiebreakers computed automatically per OFSAA Playing Regulations Section 6.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onViewTiebreakerRules}
              className="text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>OFSAA Tiebreaker Statement</span>
            </button>

            <button
              onClick={() => setShowMatrix(!showMatrix)}
              className="text-xs text-slate-300 hover:text-white bg-slate-700/80 px-3 py-1.5 rounded-lg border border-slate-600 transition-colors"
            >
              {showMatrix ? 'Hide Cross-Match Matrices' : 'Show Cross-Match Matrices'}
            </button>
          </div>
        </div>

        {/* Status badges explanation */}
        <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-slate-700/60 text-xs">
          <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">Advancement:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/30"></span>
            <span className="text-slate-200 font-medium">Championship QF (1st & 2nd)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-500/30"></span>
            <span className="text-slate-200 font-medium">Consolation QF (3rd & 4th)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
            <span className="text-slate-400">Eliminated (5th place)</span>
          </div>
        </div>
      </div>

      {/* Pool Filter Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setSelectedPool('ALL')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            selectedPool === 'ALL'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
          }`}
        >
          All Pools (A, B, C, D)
        </button>
        {pools.map((p) => (
          <button
            key={p}
            onClick={() => setSelectedPool(p)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedPool === p
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
            }`}
          >
            Pool {p}
          </button>
        ))}
      </div>

      {/* Pools Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {filterPools.map((poolId) => {
          const standings = standingsByPool[poolId];
          const hasTie = standings.some((s) => s.isTied);
          const poolTeams = standings.map((s) => s.team);

          // Get matches for this pool
          const poolMatches = tournament.matches.filter(
            (m) => m.pool === poolId && m.stage === 'pool'
          );

          // Filter by search query if present
          const visibleStandings = standings.filter((s) => {
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            return (
              s.team.name.toLowerCase().includes(q) ||
              s.team.schoolName.toLowerCase().includes(q) ||
              s.team.association.toLowerCase().includes(q) ||
              s.team.id.toLowerCase().includes(q)
            );
          });

          return (
            <div
              key={poolId}
              className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col justify-between"
            >
              {/* Pool Header */}
              <div className="bg-slate-800/90 px-4 sm:px-6 py-3.5 border-b border-slate-700/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 font-black text-base flex items-center justify-center">
                    {poolId}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Pool {poolId}</h3>
                    <p className="text-[11px] text-slate-400">
                      Seeds:{' '}
                      {poolTeams
                        .map((t) => `#${t.seed}`)
                        .join(', ')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] bg-slate-700/70 text-slate-300 px-2 py-0.5 rounded font-mono">
                    {poolMatches.filter((m) => m.status === 'final').length} / {poolMatches.length} Played
                  </span>
                </div>
              </div>

              {/* Standings Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">Rank</th>
                      <th className="py-2.5 px-3">Team / School</th>
                      <th className="py-2.5 px-2 text-center" title="Matches Played">MP</th>
                      <th className="py-2.5 px-2 text-center" title="Matches Won">MW</th>
                      <th className="py-2.5 px-2 text-center" title="Matches Lost">ML</th>
                      <th className="py-2.5 px-2 text-center" title="Sets Won">SW</th>
                      <th className="py-2.5 px-2 text-center" title="Sets Lost">SL</th>
                      <th className="py-2.5 px-2 text-center font-mono" title="Set Ratio (Sets Won / Sets Lost)">Ratio</th>
                      <th className="py-2.5 px-2 text-center font-mono" title="Points Ratio (Points For / Points Against)">Pt.Rat</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {visibleStandings.map((st) => {
                      const isChampionship = st.advancementStatus === 'championship_qf';
                      const isConsolation = st.advancementStatus === 'consolation_qf';

                      return (
                        <tr
                          key={st.teamId}
                          className={`hover:bg-slate-800/40 transition-colors ${
                            isChampionship
                              ? 'bg-emerald-950/10'
                              : isConsolation
                              ? 'bg-blue-950/10'
                              : ''
                          }`}
                        >
                          {/* Rank */}
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${
                                st.rank === 1
                                  ? 'bg-amber-500 text-slate-950'
                                  : st.rank === 2
                                  ? 'bg-emerald-600 text-white'
                                  : st.rank <= 4
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {st.rank}
                            </span>
                          </td>

                          {/* Team Details */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              {/* Logo / Badge */}
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 border border-slate-700 shadow-sm"
                                style={{
                                  backgroundColor: st.team.accentColor ? `${st.team.accentColor}25` : '#1e293b',
                                  borderColor: st.team.accentColor || '#475569',
                                }}
                              >
                                {st.team.logoUrl?.startsWith('data:') || st.team.logoUrl?.startsWith('http') ? (
                                  <img
                                    src={st.team.logoUrl}
                                    alt={st.team.name}
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                ) : (
                                  <span>{st.team.logoUrl || '🏐'}</span>
                                )}
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-slate-100 truncate text-xs sm:text-sm">
                                    {st.team.schoolName || st.team.name}
                                  </span>
                                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-800 text-amber-400 border border-slate-700">
                                    #{st.team.seed}
                                  </span>
                                  <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                    {st.team.association}
                                  </span>
                                </div>
                                {st.team.teamNickname && (
                                  <p className="text-[11px] text-slate-400 truncate">
                                    {st.team.teamNickname}
                                  </p>
                                )}
                              </div>

                              {isAdmin && (
                                <button
                                  onClick={() => onOpenTeamModal(st.team.id)}
                                  className="text-slate-500 hover:text-amber-400 p-1 rounded transition-colors ml-auto"
                                  title="Edit Team Details"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Records */}
                          <td className="py-3 px-2 text-center font-medium text-slate-300">{st.matchesPlayed}</td>
                          <td className="py-3 px-2 text-center font-bold text-emerald-400">{st.matchesWon}</td>
                          <td className="py-3 px-2 text-center text-slate-400">{st.matchesLost}</td>
                          <td className="py-3 px-2 text-center font-medium text-slate-300">{st.setsWon}</td>
                          <td className="py-3 px-2 text-center text-slate-400">{st.setsLost}</td>
                          <td className="py-3 px-2 text-center font-mono text-slate-200">
                            {st.setRatio >= 90 ? 'MAX' : st.setRatio.toFixed(3)}
                          </td>
                          <td className="py-3 px-2 text-center font-mono text-slate-300">
                            {st.pointRatio >= 90 ? 'MAX' : st.pointRatio.toFixed(3)}
                          </td>

                          {/* Status Badge */}
                          <td className="py-3 px-3 text-right">
                            {isChampionship && (
                              <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-semibold">
                                <Trophy className="w-3 h-3 text-emerald-400" />
                                Champ QF ({st.rank === 1 ? `1${poolId}` : `2${poolId}`})
                              </span>
                            )}
                            {isConsolation && (
                              <span className="inline-flex items-center gap-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded text-[10px] font-semibold">
                                <Medal className="w-3 h-3 text-blue-400" />
                                Consol QF ({st.rank === 3 ? `3${poolId}` : `4${poolId}`})
                              </span>
                            )}
                            {st.advancementStatus === 'eliminated' && (
                              <span className="inline-block bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-[10px] font-medium">
                                Eliminated
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Tiebreaker Explanation Banner if applicable */}
              {hasTie && (
                <div className="bg-amber-950/20 border-t border-amber-500/30 px-4 py-2.5 text-xs text-amber-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-300">OFSAA Tiebreaker Applied: </span>
                    {standings
                      .filter((s) => s.tiebreakerReason)
                      .map((s, idx) => (
                        <span key={s.teamId} className="inline-block mr-2">
                          <strong>{s.team.schoolName || s.team.name}:</strong> {s.tiebreakerReason}
                          {idx < standings.filter((x) => x.tiebreakerReason).length - 1 ? ' • ' : ''}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {/* Cross Match Head-to-Head Matrix */}
              {showMatrix && (
                <div className="bg-slate-950/80 border-t border-slate-800 p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Pool {poolId} Head-to-Head Cross Matrix
                    </span>
                    <span className="text-[10px] text-slate-500">Row vs Column</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-center text-[11px] border-collapse">
                      <thead>
                        <tr>
                          <th className="p-1 text-slate-500 font-normal border border-slate-800 text-left pl-2">
                            Team
                          </th>
                          {poolTeams.map((t) => (
                            <th
                              key={t.id}
                              className="p-1 border border-slate-800 text-slate-300 font-bold bg-slate-900/60"
                              title={t.schoolName || t.name}
                            >
                              {t.poolSlot}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {poolTeams.map((rowTeam) => (
                          <tr key={rowTeam.id}>
                            <td className="p-1 border border-slate-800 text-slate-200 font-semibold text-left pl-2 bg-slate-900/60">
                              <span className="font-bold text-amber-400">{rowTeam.poolSlot}</span>{' '}
                              <span className="text-[10px] text-slate-300 truncate max-w-[120px] inline-block align-bottom">
                                {rowTeam.schoolName || rowTeam.name}
                              </span>
                            </td>

                            {poolTeams.map((colTeam) => {
                              if (rowTeam.id === colTeam.id) {
                                return (
                                  <td
                                    key={colTeam.id}
                                    className="p-1.5 border border-slate-800 bg-slate-800/40 text-slate-600"
                                  >
                                    —
                                  </td>
                                );
                              }

                              const match = poolMatches.find(
                                (m) =>
                                  (m.team1Id === rowTeam.id && m.team2Id === colTeam.id) ||
                                  (m.team1Id === colTeam.id && m.team2Id === rowTeam.id)
                              );

                              if (!match || match.status !== 'final') {
                                return (
                                  <td
                                    key={colTeam.id}
                                    className="p-1.5 border border-slate-800 text-slate-500 text-[10px]"
                                  >
                                    {isAdmin && match ? (
                                      <button
                                        onClick={() => onOpenScoreModal(match)}
                                        className="text-amber-400 hover:underline"
                                      >
                                        Edit
                                      </button>
                                    ) : (
                                      'unplayed'
                                    )}
                                  </td>
                                );
                              }

                              const isRowTeam1 = match.team1Id === rowTeam.id;
                              const rowSetsWon = isRowTeam1 ? match.team1SetsWon : match.team2SetsWon;
                              const colSetsWon = isRowTeam1 ? match.team2SetsWon : match.team1SetsWon;
                              const rowWon = match.winnerId === rowTeam.id;

                              return (
                                <td
                                  key={colTeam.id}
                                  className={`p-1.5 border border-slate-800 font-bold ${
                                    rowWon
                                      ? 'bg-emerald-950/30 text-emerald-400'
                                      : 'bg-rose-950/20 text-rose-400'
                                  }`}
                                >
                                  <button
                                    onClick={() => isAdmin && onOpenScoreModal(match)}
                                    className={`${isAdmin ? 'hover:underline cursor-pointer' : 'cursor-default'}`}
                                    title={`Click to view/edit: ${match.sets.map((s) => `${s.team1Score}-${s.team2Score}`).join(', ')}`}
                                  >
                                    {rowSetsWon}-{colSetsWon}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
