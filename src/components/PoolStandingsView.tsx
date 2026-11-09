import React, { useState } from 'react';
import { PoolId, Match } from '../types/tournament';
import { useTournament } from '../context/TournamentContext';
import { TeamLogo } from './TeamLogo';
import { 
  Trophy, 
  Medal, 
  AlertCircle, 
  Edit3, 
  TableProperties,
  FileText,
  Calculator,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  ExternalLink
} from 'lucide-react';
import { formatRatio, computePoolTiebreakerReport } from '../utils/ofsaaTiebreaker';

interface PoolStandingsViewProps {
  onOpenScoreModal: (match: Match) => void;
  onOpenTeamModal: (teamId: string) => void;
  onViewTiebreakerRules: () => void;
  onNavigateToMatch?: (match: Match) => void;
}

export const PoolStandingsView: React.FC<PoolStandingsViewProps> = ({
  onOpenScoreModal,
  onOpenTeamModal,
  onViewTiebreakerRules,
  onNavigateToMatch,
}) => {
  const { tournament, standingsByPool, isAdmin } = useTournament();
  const [selectedPool, setSelectedPool] = useState<PoolId | 'ALL'>('ALL');
  const [expandedAuditPool, setExpandedAuditPool] = useState<PoolId | null>(null);

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
            <span className="text-slate-700 font-medium">Consolation QF (3rd &amp; 4th • Clinched)</span>
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

          // Head-to-Head Matrix must strictly stay in 1.2.3.4.5 slot order (e.g. A1, A2, A3, A4, A5), NOT by current standing position
          const matrixTeams = [...standings.map((s) => s.team)].sort((a, b) => {
            const slotNumA = parseInt(a.poolSlot.replace(/\D/g, '') || String(a.seed), 10);
            const slotNumB = parseInt(b.poolSlot.replace(/\D/g, '') || String(b.seed), 10);
            return slotNumA - slotNumB;
          });

          const poolMatches = tournament.matches.filter(
            (m) => m.pool === poolId && m.stage === 'pool'
          );

          const tieReport = hasTie ? computePoolTiebreakerReport(poolId, tournament.teams, tournament.matches) : null;

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
                      Seeds: {matrixTeams.map((t) => `#${t.seed}`).join(', ')}
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
                      {isAdmin && (
                        <>
                          <th className="py-2.5 px-2 text-center font-mono bg-sky-50 text-sky-900 border-l border-sky-200" title="Set Ratio (Convenor Only)">Ratio</th>
                          <th className="py-2.5 px-2 text-center font-mono bg-sky-50 text-sky-900" title="Points Ratio (Convenor Only)">Pt.Rat</th>
                          <th className="py-2.5 px-2 text-center font-mono bg-sky-50 text-sky-900 border-r border-sky-200" title="Point Differential (Convenor Only)">Pt.Diff</th>
                        </>
                      )}
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
                                  {st.isTied && st.tiebreakerReason && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                                      {st.tiebreakerReason}
                                    </span>
                                  )}
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
                          {isAdmin && (
                            <>
                              <td className="py-3 px-2 text-center font-mono text-sky-900 font-bold bg-sky-50/40 border-l border-sky-100">
                                {formatRatio(st.setRatio)}
                              </td>
                              <td className="py-3 px-2 text-center font-mono text-sky-900 font-bold bg-sky-50/40">
                                {formatRatio(st.pointRatio)}
                              </td>
                              <td className="py-3 px-2 text-center font-mono text-xs font-bold bg-sky-50/40 border-r border-sky-100 text-slate-800">
                                {st.pointsFor - st.pointsAgainst > 0 ? `+${st.pointsFor - st.pointsAgainst}` : st.pointsFor - st.pointsAgainst}
                              </td>
                            </>
                          )}

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
                <div className="bg-amber-50 border-t border-amber-200 px-4 py-2.5 text-xs text-amber-900">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <span className="font-extrabold text-amber-950 mr-1.5">Tiebreaker Applied:</span>
                        {standings
                          .filter((s) => s.isTied && s.tiebreakerReason)
                          .map((s, idx, arr) => (
                            <span key={s.teamId} className="inline-block mr-2.5 text-amber-900 font-semibold">
                              <strong className="text-amber-950">{s.team.schoolName || s.team.name}:</strong>{' '}
                              <span className="bg-white/80 px-1.5 py-0.2 rounded border border-amber-300 font-bold text-amber-900">
                                {s.tiebreakerReason}
                              </span>
                              {idx < arr.length - 1 ? ' • ' : ''}
                            </span>
                          ))}
                      </div>
                    </div>

                    {isAdmin && tieReport && (
                      <button
                        onClick={() => setExpandedAuditPool(expandedAuditPool === poolId ? null : poolId)}
                        className="text-[11px] font-bold text-sky-900 bg-sky-100 hover:bg-sky-200 border border-sky-300 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-colors self-start sm:self-auto shrink-0 cursor-pointer"
                        title="Inspect step-by-step ratio math for this pool"
                      >
                        <Calculator className="w-3.5 h-3.5 text-sky-700" />
                        <span>{expandedAuditPool === poolId ? 'Hide Math Breakdown' : 'Convenor Math Audit'}</span>
                        {expandedAuditPool === poolId ? (
                          <ChevronUp className="w-3.5 h-3.5 text-sky-700" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-sky-700" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Convenor Tiebreak Mathematical Audit Table */}
                  {isAdmin && expandedAuditPool === poolId && tieReport && (
                    <div className="mt-3 pt-3 border-t border-amber-200/90 space-y-3">
                      {tieReport.reports.map((grp, gIdx) => (
                        <div key={gIdx} className="bg-white rounded-xl p-3 border border-amber-300/80 shadow-2xs text-slate-800">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                            <span className="font-black text-xs text-[#0b2341]">
                              {grp.ruleCitation}
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                              Deciding Stat: {grp.decidingStatLabel}
                            </span>
                          </div>
                          
                          <p className="text-[11px] text-slate-600 mb-2 font-medium">
                            {grp.explanation}
                          </p>

                          {grp.playoffSetRequired && grp.playoffSetDetails && (
                            <div className="mb-2.5 p-2 bg-amber-50/80 border border-amber-300 rounded-lg text-[11px] text-amber-950 flex items-start gap-1.5 font-semibold">
                              <ShieldAlert className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                              <span>{grp.playoffSetDetails}</span>
                            </div>
                          )}

                          {/* Full Audit Table */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-center text-[10px] border-collapse bg-slate-50/60 rounded-lg overflow-hidden border border-slate-200">
                              <thead className="bg-slate-100 font-bold text-slate-600">
                                <tr>
                                  <th className="p-1.5 text-left pl-2 text-slate-700">Contending Team</th>
                                  <th className="p-1.5 text-center">Assigned Placement</th>
                                  <th className="p-1.5 bg-sky-50 text-sky-900 font-mono" title="Step i: Matches Won-Lost among tied teams only">H2H MW-ML</th>
                                  <th className="p-1.5 bg-sky-50 text-sky-900 font-mono" title="Step ii: Sets Won-Lost among tied teams only">H2H SW-SL (Ratio)</th>
                                  <th className="p-1.5 bg-indigo-50 text-indigo-900 font-mono" title="Step iii: Sets Won-Lost in all pool matches">All Sets (Ratio)</th>
                                  <th className="p-1.5 bg-sky-50 text-sky-900 font-mono" title="Step iv: Points For/Against among tied teams only">H2H PF/PA (Ratio)</th>
                                  <th className="p-1.5 bg-indigo-50 text-indigo-900 font-mono" title="Step v: Points For/Against in all pool matches">All Points (Ratio)</th>
                                  <th className="p-1.5 text-slate-700 font-mono">Pt. Diff</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                {grp.teamAudits.map((aud) => (
                                  <tr key={aud.teamId} className="hover:bg-white transition-colors">
                                    <td className="p-1.5 text-left pl-2 font-bold text-slate-900">
                                      {aud.schoolName} <span className="text-slate-400 font-normal">#{aud.seed}</span>
                                    </td>
                                    <td className="p-1.5">
                                      <span className="bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded border border-amber-300 whitespace-nowrap">
                                        {aud.reason}
                                      </span>
                                    </td>
                                    <td className="p-1.5 font-mono bg-sky-50/40">{aud.h2hMatchesRecord} ({aud.h2hMatchRatioStr})</td>
                                    <td className="p-1.5 font-mono font-bold bg-sky-50/40 text-sky-950">{aud.h2hSetsRecord} ({aud.h2hSetRatioStr})</td>
                                    <td className="p-1.5 font-mono font-bold bg-indigo-50/40 text-indigo-950">{aud.allSetsRecord} ({aud.allSetRatioStr})</td>
                                    <td className="p-1.5 font-mono bg-sky-50/40">{aud.h2hPointsRecord} ({aud.h2hPointRatioStr})</td>
                                    <td className="p-1.5 font-mono bg-indigo-50/40">{aud.allPointsRecord} ({aud.allPointRatioStr})</td>
                                    <td className="p-1.5 font-mono font-bold">{aud.pointDiffStr}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Cross Match Head-to-Head Matrix (Always shown - Phone Friendly) */}
              <div className="bg-slate-50 border-t border-slate-200 p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-[#0b2341]">
                      Pool {poolId} Head-to-Head Results Matrix
                    </span>
                    <span className="text-[10px] text-sky-800 bg-sky-100 border border-sky-300 px-2 py-0.5 rounded-md font-bold sm:hidden">
                      Swipe table ↔
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Click any score to view full game results
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs bg-white">
                  <table className="w-full text-center text-xs border-collapse min-w-[500px]">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="p-2 text-slate-700 font-black border border-slate-200 text-left pl-3 sticky left-0 z-20 bg-slate-100 shadow-xs sm:shadow-none min-w-[130px]">
                          Team
                        </th>
                        {matrixTeams.map((t) => (
                          <th
                            key={t.id}
                            className="p-2 border border-slate-200 text-slate-800 font-black text-xs sm:text-sm min-w-[70px]"
                            title={t.schoolName || t.name}
                          >
                            {t.poolSlot}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {matrixTeams.map((rowTeam) => (
                        <tr key={rowTeam.id}>
                          <td className="p-2 border border-slate-200 text-slate-800 font-semibold text-left pl-3 bg-white sticky left-0 z-10 shadow-xs sm:shadow-none min-w-[130px]">
                            <span className="font-black text-[#0b2341] mr-1">{rowTeam.poolSlot}</span>{' '}
                            <span className="text-[11px] text-slate-700 truncate max-w-[110px] inline-block align-bottom font-bold">
                              {rowTeam.schoolName || rowTeam.name}
                            </span>
                          </td>

                          {matrixTeams.map((colTeam) => {
                            if (rowTeam.id === colTeam.id) {
                              return (
                                <td
                                  key={colTeam.id}
                                  className="p-2 border border-slate-200 bg-slate-100 text-slate-300 font-bold select-none text-base"
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

                            if (!match) {
                              return (
                                <td key={colTeam.id} className="p-2 border border-slate-200 text-slate-300">
                                  —
                                </td>
                              );
                            }

                            if (match.status !== 'final') {
                              return (
                                <td
                                  key={colTeam.id}
                                  className="p-1.5 border border-slate-200 text-slate-500 bg-slate-50/40 hover:bg-sky-50/80 transition-colors"
                                >
                                  <div className="flex flex-col items-center justify-center gap-0.5 min-h-[48px]">
                                    <button
                                      type="button"
                                      onClick={() => onNavigateToMatch?.(match)}
                                      className="w-full h-full py-1.5 px-1 rounded-lg text-xs font-bold text-slate-600 hover:text-sky-800 transition-colors cursor-pointer flex flex-col items-center justify-center hover:bg-white"
                                      title={`Click to view match schedule: ${rowTeam.schoolName || rowTeam.name} vs ${colTeam.schoolName || colTeam.name} (${match.dayLabel || ''} at ${match.time || ''} • ${match.court || ''})`}
                                    >
                                      <span className="leading-tight text-xs font-black">{match.time || 'Scheduled'}</span>
                                      <span className="text-[10px] text-slate-400 font-semibold mt-0.5">info →</span>
                                    </button>
                                    {isAdmin && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onOpenScoreModal(match);
                                        }}
                                        className="text-[10px] font-bold text-sky-700 hover:text-sky-900 hover:underline px-1 py-0.5"
                                        title="Convenor: Enter Match Score"
                                      >
                                        [Score]
                                      </button>
                                    )}
                                  </div>
                                </td>
                              );
                            }

                            const isRowTeam1 = match.team1Id === rowTeam.id;
                            const rowSetsWon = isRowTeam1 ? match.team1SetsWon : match.team2SetsWon;
                            const colSetsWon = isRowTeam1 ? match.team2SetsWon : match.team1SetsWon;
                            const rowWon = match.winnerId === rowTeam.id;
                            const setScoresSummary = (match.sets || [])
                              .map((s) => `${s.team1Score}-${s.team2Score}`)
                              .join(', ');

                            return (
                              <td
                                key={colTeam.id}
                                className={`p-1.5 border border-slate-200 ${
                                  rowWon
                                    ? 'bg-emerald-50/90 hover:bg-emerald-100'
                                    : 'bg-rose-50/90 hover:bg-rose-100'
                                } transition-all`}
                              >
                                <div className="flex flex-col items-center justify-center min-h-[48px]">
                                  <button
                                    type="button"
                                    onClick={() => onNavigateToMatch?.(match)}
                                    className={`w-full py-1.5 px-2 rounded-lg cursor-pointer group flex flex-col items-center justify-center transition-transform hover:scale-[1.04] active:scale-95 shadow-2xs ${
                                      rowWon ? 'text-emerald-900 bg-white/70' : 'text-rose-900 bg-white/70'
                                    }`}
                                    title={`Click to view game results:\n${rowTeam.schoolName || rowTeam.name} vs ${colTeam.schoolName || colTeam.name}\nSets: ${rowSetsWon}-${colSetsWon} (${setScoresSummary})\nVenue: ${match.court || ''} • ${match.dayLabel || ''} ${match.time || ''}`}
                                  >
                                    <span className="font-mono font-black text-sm sm:text-base leading-none">
                                      {rowSetsWon}-{colSetsWon}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-500 group-hover:text-sky-800 leading-tight mt-1 flex items-center gap-0.5">
                                      <span>results</span>
                                      <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                                    </span>
                                  </button>
                                  {isAdmin && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onOpenScoreModal(match);
                                      }}
                                      className="text-[10px] font-bold text-sky-700 hover:text-sky-900 hover:underline px-1 mt-0.5"
                                      title="Convenor: Edit Match Score"
                                    >
                                      [Edit]
                                    </button>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
