import React, { useState } from 'react';
import { PoolId, Match } from '../types/tournament';
import { useTournament } from '../context/TournamentContext';
import { TeamLogo } from './TeamLogo';
import { 
  Trophy, 
  Medal, 
  AlertCircle, 
  Edit3, 
  HelpCircle,
  TableProperties,
  FileText
} from 'lucide-react';

interface PoolStandingsViewProps {
  onOpenScoreModal: (match: Match) => void;
  onOpenTeamModal: (teamId: string) => void;
  onViewTiebreakerRules: () => void;
}

export const PoolStandingsView: React.FC<PoolStandingsViewProps> = ({
  onOpenScoreModal,
  onOpenTeamModal,
  onViewTiebreakerRules,
}) => {
  const { tournament, standingsByPool, isAdmin } = useTournament();
  const [selectedPool, setSelectedPool] = useState<PoolId | 'ALL'>('ALL');
  const [showMatrix, setShowMatrix] = useState<boolean>(true);

  const pools: PoolId[] = ['A', 'B', 'C', 'D'];
  const filterPools = selectedPool === 'ALL' ? pools : [selectedPool];

  return (
    <div className="space-y-6">
      {/* Legend & Format Overview */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-[#0b2341] flex items-center gap-2">
              <TableProperties className="w-5 h-5 text-sky-600" />
              <span>Preliminary Round Pool Standings</span>
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">
              Top 2 teams in each pool advance to the Championship Quarterfinals. 3rd and 4th place advance to Consolation Quarterfinals. 5th place teams are eliminated. Standings and tiebreakers adhere to OFSAA Section 6 Playing Regulations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onViewTiebreakerRules}
              className="text-xs font-bold text-[#0b2341] hover:text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-sky-600" />
              <span>Official Regulations</span>
            </button>

            <button
              onClick={() => setShowMatrix(!showMatrix)}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
            >
              {showMatrix ? 'Hide Head-to-Head Matrix' : 'Show Head-to-Head Matrix'}
            </button>
          </div>
        </div>

        {/* Status badges explanation */}
        <div className="flex flex-wrap items-center gap-4 mt-4 pt-3.5 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Advancement:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-700 font-medium">Championship QF (Top 2 • Clinched)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
            <span className="text-slate-700 font-medium">Consolation QF (3rd & 4th • Clinched)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
            <span className="text-slate-500 font-medium">In Contention</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
            <span className="text-slate-500">Eliminated (5th)</span>
          </div>
        </div>

        {/* Coach Rights & Error Notice */}
        <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-amber-900 bg-amber-50/80 -mx-5 -mb-5 px-5 py-3 rounded-b-2xl flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="leading-snug">
            <strong>Official Notice:</strong> Standings, mathematical ratios, and advancement statuses are displayed for convenor and spectator reference. Inadvertent display or input errors may occur. Per OFSAA regulations, all coaches retain the right to review calculations and contest a tiebreak with the Championship Convenor prior to any tiebreaker set or playoff match.
          </div>
        </div>
      </div>

      {/* Pool Filter Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedPool('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
            selectedPool === 'ALL'
              ? 'bg-[#0b2341] text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          All Pools (A, B, C, D)
        </button>
        {pools.map((p) => (
          <button
            key={p}
            onClick={() => setSelectedPool(p)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
              selectedPool === p
                ? 'bg-[#0b2341] text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Pool {p}
          </button>
        ))}
      </div>

      {/* Pools Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filterPools.map((poolId) => {
          const standings = standingsByPool[poolId];
          const hasTie = standings.some((s) => s.isTied);
          const poolTeams = standings.map((s) => s.team);

          const poolMatches = tournament.matches.filter(
            (m) => m.pool === poolId && m.stage === 'pool'
          );

          return (
            <div
              key={poolId}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between"
            >
              {/* Pool Header */}
              <div className="bg-[#0b2341] text-white px-5 py-3.5 flex items-center justify-between border-b-2 border-sky-400">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-400/20 border border-sky-400/40 text-sky-200 font-black text-base flex items-center justify-center">
                    {poolId}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">Pool {poolId}</h3>
                    <p className="text-[11px] text-sky-200/80">
                      Seeds: {poolTeams.map((t) => `#${t.seed}`).join(', ')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] bg-white/10 text-sky-100 px-2.5 py-0.5 rounded font-mono font-semibold">
                    {poolMatches.filter((m) => m.status === 'final').length} / {poolMatches.length} Matches Final
                  </span>
                </div>
              </div>

              {/* Standings Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">Rank</th>
                      <th className="py-2.5 px-3">Team / School</th>
                      <th className="py-2.5 px-2 text-center" title="Matches Played">MP</th>
                      <th className="py-2.5 px-2 text-center" title="Matches Won">MW</th>
                      <th className="py-2.5 px-2 text-center" title="Matches Lost">ML</th>
                      <th className="py-2.5 px-2 text-center" title="Sets Won">SW</th>
                      <th className="py-2.5 px-2 text-center" title="Sets Lost">SL</th>
                      <th className="py-2.5 px-2 text-center font-mono" title="Set Ratio">Ratio</th>
                      <th className="py-2.5 px-2 text-center font-mono" title="Points Ratio">Pt.Rat</th>
                      <th className="py-2.5 px-3 text-right">Advancement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {standings.map((st) => {
                      const isChampionship = st.advancementStatus === 'championship_qf';
                      const isConsolation = st.advancementStatus === 'consolation_qf';

                      return (
                        <tr
                          key={st.teamId}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isChampionship
                              ? 'bg-emerald-50/40'
                              : isConsolation
                              ? 'bg-sky-50/40'
                              : ''
                          }`}
                        >
                          {/* Rank */}
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-extrabold text-xs ${
                                st.rank === 1
                                  ? 'bg-[#0b2341] text-sky-300'
                                  : st.rank === 2
                                  ? 'bg-emerald-600 text-white'
                                  : st.rank <= 4
                                  ? 'bg-sky-600 text-white'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {st.rank}
                            </span>
                          </td>

                          {/* Team Details */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <TeamLogo team={st.team} size="md" />

                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-slate-900 truncate text-xs sm:text-sm">
                                    {st.team.schoolName || st.team.name}
                                  </span>
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-[#0b2341] border border-slate-200">
                                    #{st.team.seed}
                                  </span>
                                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                    {st.team.association}
                                  </span>
                                </div>
                                {st.team.teamNickname && (
                                  <p className="text-[11px] text-slate-500 truncate">
                                    {st.team.teamNickname}
                                  </p>
                                )}
                              </div>

                              {isAdmin && (
                                <button
                                  onClick={() => onOpenTeamModal(st.team.id)}
                                  className="text-slate-400 hover:text-sky-700 p-1 rounded transition-colors ml-auto"
                                  title="Edit Team Details & Logo"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Records */}
                          <td className="py-3 px-2 text-center font-semibold text-slate-700">{st.matchesPlayed}</td>
                          <td className="py-3 px-2 text-center font-extrabold text-emerald-700">{st.matchesWon}</td>
                          <td className="py-3 px-2 text-center text-slate-500">{st.matchesLost}</td>
                          <td className="py-3 px-2 text-center font-semibold text-slate-700">{st.setsWon}</td>
                          <td className="py-3 px-2 text-center text-slate-500">{st.setsLost}</td>
                          <td className="py-3 px-2 text-center font-mono text-slate-800 font-medium">
                            {st.setRatio >= 90 ? 'MAX' : st.setRatio.toFixed(3)}
                          </td>
                          <td className="py-3 px-2 text-center font-mono text-slate-600">
                            {st.pointRatio >= 90 ? 'MAX' : st.pointRatio.toFixed(3)}
                          </td>

                          {/* Status Badge */}
                          <td className="py-3 px-3 text-right">
                            {isChampionship && (
                              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold">
                                <Trophy className="w-3 h-3 text-emerald-600" />
                                Champ QF {st.clinchedRank ? `(${st.clinchedRank}${poolId} Clinched)` : '(Clinched)'}
                              </span>
                            )}
                            {isConsolation && (
                              <span className="inline-flex items-center gap-1 bg-sky-100 text-sky-900 border border-sky-300 px-2 py-0.5 rounded text-[10px] font-bold">
                                <Medal className="w-3 h-3 text-sky-600" />
                                Consol QF {st.clinchedRank ? `(${st.clinchedRank}${poolId} Clinched)` : '(Clinched)'}
                              </span>
                            )}
                            {st.advancementStatus === 'eliminated' && (
                              <span className="inline-block bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded text-[10px] font-bold">
                                Eliminated
                              </span>
                            )}
                            {st.advancementStatus === 'pending' && (
                              <span className="inline-block bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-medium">
                                In Contention
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
                <div className="bg-amber-50 border-t border-amber-200 px-4 py-2.5 text-xs text-amber-900 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-950">OFSAA Tiebreaker Applied: </span>
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
                <div className="bg-slate-50 border-t border-slate-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Pool {poolId} Head-to-Head Cross Matrix
                    </span>
                    <span className="text-[10px] text-slate-400">Row vs Column Sets</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-center text-[11px] border-collapse bg-white rounded-lg overflow-hidden border border-slate-200">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="p-1.5 text-slate-600 font-bold border border-slate-200 text-left pl-2.5">
                            Team
                          </th>
                          {poolTeams.map((t) => (
                            <th
                              key={t.id}
                              className="p-1.5 border border-slate-200 text-slate-700 font-extrabold"
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
                            <td className="p-1.5 border border-slate-200 text-slate-800 font-semibold text-left pl-2.5 bg-slate-50/50">
                              <span className="font-extrabold text-[#0b2341]">{rowTeam.poolSlot}</span>{' '}
                              <span className="text-[10px] text-slate-600 truncate max-w-[120px] inline-block align-bottom">
                                {rowTeam.schoolName || rowTeam.name}
                              </span>
                            </td>

                            {poolTeams.map((colTeam) => {
                              if (rowTeam.id === colTeam.id) {
                                return (
                                  <td
                                    key={colTeam.id}
                                    className="p-1.5 border border-slate-200 bg-slate-100 text-slate-400 font-bold"
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
                                    className="p-1.5 border border-slate-200 text-slate-400 text-[10px]"
                                  >
                                    {isAdmin && match ? (
                                      <button
                                        onClick={() => onOpenScoreModal(match)}
                                        className="text-sky-700 font-bold hover:underline"
                                      >
                                        Enter
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
                                  className={`p-1.5 border border-slate-200 font-extrabold ${
                                    rowWon
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : 'bg-rose-50 text-rose-700'
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
