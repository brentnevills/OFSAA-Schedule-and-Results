import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { PoolId } from '../types/tournament';
import { Scale, CheckCircle2, AlertCircle, HelpCircle, ArrowRight, ShieldCheck, FileText } from 'lucide-react';

export const TiebreakerRulesView: React.FC = () => {
  const { standingsByPool } = useTournament();
  const [selectedPool, setSelectedPool] = useState<PoolId>('A');

  const poolStandings = standingsByPool[selectedPool];
  const tiedTeams = poolStandings.filter((s) => s.isTied);

  return (
    <div className="space-y-8">
      {/* Official OFSAA Statement Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-xl p-6 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-500 text-slate-950 font-black text-[10px] uppercase px-2 py-0.5 rounded tracking-wider">
                Official OFSAA Statement
              </span>
              <span className="text-xs text-slate-400">Section 6 • Rules and Officials</span>
            </div>
            <h2 className="text-xl font-black text-white mt-1">
              OFSAA Playing Regulations: Tiebreaking Rules
            </h2>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              The rules of Volleyball Canada (VC), as of September 1st of the current school year, govern play at the
              OFSAA Championship with the following tie-breaking exceptions applied automatically by this tournament
              software.
            </p>
          </div>
        </div>
      </div>

      {/* Official Rule 6 Clauses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Clause A: Two-way Tie */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-amber-400 font-bold text-xs uppercase tracking-wider">
                Regulation 6.a
              </span>
              <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                2 Teams Tied
              </span>
            </div>
            <h3 className="text-base font-bold text-white mb-2">Head-to-Head Result</h3>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800 font-sans">
              "If two (2) teams are tied at the end of the pool play, the team winning the match between the two tied
              teams shall receive the higher ranking."
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Direct head-to-head winner receives higher seed</span>
          </div>
        </div>

        {/* Clause B: Three-way Tie for 1st or 3rd */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-amber-400 font-bold text-xs uppercase tracking-wider">
                Regulation 6.b
              </span>
              <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                3 Teams Tied (1st or 3rd)
              </span>
            </div>
            <h3 className="text-base font-bold text-white mb-2">Sequential Ratio Criteria + 15-pt Set</h3>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800">
              "If three (3) teams are tied for 1st place or 3rd place at the end of the preliminary round, the criteria
              (in sequence) determine the highest ranked team, and the remaining two (2) teams play a set to 15 (2-point
              margin of victory) to complete final pool rankings."
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-amber-300 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Highest team ranked; other 2 play 15pt set</span>
          </div>
        </div>

        {/* Clause C: Three-way Tie for 2nd */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-amber-400 font-bold text-xs uppercase tracking-wider">
                Regulation 6.c
              </span>
              <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                3 Teams Tied (2nd Place)
              </span>
            </div>
            <h3 className="text-base font-bold text-white mb-2">Lowest Ranked Identification</h3>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800">
              "If three (3) teams are tied for 2nd place at the end of pool play, the criteria shall be applied in
              sequence to determine the lowest ranked team, and the remaining two (2) teams will play a set to 15
              (2-point margin of victory) to complete final pool rankings."
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-amber-300 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Lowest team identified; top 2 play 15pt set</span>
          </div>
        </div>

        {/* Clause D: 4 or 5-way Tie */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-amber-400 font-bold text-xs uppercase tracking-wider">
                Regulation 6.d
              </span>
              <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                4 or More Teams Tied
              </span>
            </div>
            <h3 className="text-base font-bold text-white mb-2">Multi-Way Resolution & Guaranteed Play</h3>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800">
              "If four (4) or more teams are tied, the criteria are applied one after another. After ranking has been
              completed, 2nd place and 4th place will be determined by an additional set to 15 with a 2-point margin.
              No team in a 4-way or 5-way tie shall be eliminated from championship or consolation playoffs by virtue
              of tie breaker rules alone."
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-blue-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>No elimination by rulebook alone — 15pt set played</span>
          </div>
        </div>
      </div>

      {/* Sequential Criteria Order */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
          OFSAA Sequential Tiebreaker Hierarchy (Rules 6.b, 6.c, 6.d)
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          When 3 or more teams are tied in match record, these steps are evaluated strictly in sequence:
        </p>

        <div className="space-y-2.5">
          <div className="flex items-start gap-3 p-3 bg-slate-800/60 rounded-lg border border-slate-700/60">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center shrink-0">
              i
            </span>
            <div>
              <span className="text-xs font-bold text-white">Won/Lost Matches Ratio (Among Tied Teams Only)</span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Highest ratio of won/lost matches, considering matches played in pool play among the tied teams only.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-800/60 rounded-lg border border-slate-700/60">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center shrink-0">
              ii
            </span>
            <div>
              <span className="text-xs font-bold text-white">Won/Lost Sets (Games) Ratio (Among Tied Teams Only)</span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Highest ratio of won/lost sets, considering matches played in pool play among the tied teams only.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-800/60 rounded-lg border border-slate-700/60">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center shrink-0">
              iii
            </span>
            <div>
              <span className="text-xs font-bold text-white">Won/Lost Sets (Games) Ratio (All Matches in Pool)</span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Highest ratio of won/lost sets considering all matches in pool play.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-800/60 rounded-lg border border-slate-700/60">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center shrink-0">
              iv
            </span>
            <div>
              <span className="text-xs font-bold text-white">Points For / Points Against Ratio (Among Tied Teams Only)</span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Highest ratio of points for/against, considering games played in pool play among the tied teams only.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-800/60 rounded-lg border border-slate-700/60">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center shrink-0">
              v
            </span>
            <div>
              <span className="text-xs font-bold text-white">Points For / Points Against Ratio (All Games in Pool)</span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Highest ratio of points for/against, considering all games played in pool play.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Live Tiebreaker Inspector for Current Tournament */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-400" />
              <span>Live Pool Tiebreaker Inspector</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select a pool to inspect active ties and see how the OFSAA algorithm ranks teams:
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {(['A', 'B', 'C', 'D'] as PoolId[]).map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPool(p)}
                className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                  selectedPool === p ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Pool {p}
              </button>
            ))}
          </div>
        </div>

        {tiedTeams.length === 0 ? (
          <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/50 text-xs text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Currently no tied match records in Pool {selectedPool}. Standings are determined cleanly by match wins.</span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
              <span className="font-bold">Active Ties in Pool {selectedPool}: </span>
              {tiedTeams.map((t) => t.team.schoolName || t.team.name).join(', ')}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px] uppercase font-semibold">
                  <tr>
                    <th className="p-2.5">Rank</th>
                    <th className="p-2.5">Team</th>
                    <th className="p-2.5 text-center">MW-ML</th>
                    <th className="p-2.5 text-center">SW-SL</th>
                    <th className="p-2.5 text-center">Set Ratio</th>
                    <th className="p-2.5 text-center">Pt Ratio</th>
                    <th className="p-2.5">Tiebreaker Resolution Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {poolStandings.map((st) => (
                    <tr key={st.teamId} className={st.isTied ? 'bg-amber-500/5' : ''}>
                      <td className="p-2.5 font-bold text-amber-400">#{st.rank}</td>
                      <td className="p-2.5 font-semibold text-white">
                        {st.team.schoolName || st.team.name} ({st.team.poolSlot})
                      </td>
                      <td className="p-2.5 text-center font-mono">
                        {st.matchesWon}-{st.matchesLost}
                      </td>
                      <td className="p-2.5 text-center font-mono">
                        {st.setsWon}-{st.setsLost}
                      </td>
                      <td className="p-2.5 text-center font-mono text-slate-300">
                        {st.setRatio >= 90 ? 'MAX' : st.setRatio.toFixed(3)}
                      </td>
                      <td className="p-2.5 text-center font-mono text-slate-300">
                        {st.pointRatio >= 90 ? 'MAX' : st.pointRatio.toFixed(3)}
                      </td>
                      <td className="p-2.5 text-slate-300 font-medium">
                        {st.tiebreakerReason || 'Clean match record'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
