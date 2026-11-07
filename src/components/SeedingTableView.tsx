import React from 'react';
import { useTournament } from '../context/TournamentContext';
import { TeamLogo } from './TeamLogo';
import { ListOrdered, Edit3, CheckCircle2, Clock } from 'lucide-react';

interface SeedingTableViewProps {
  onOpenTeamModal: (teamId: string) => void;
}

export const SeedingTableView: React.FC<SeedingTableViewProps> = ({ onOpenTeamModal }) => {
  const { tournament, isAdmin } = useTournament();

  const sortedTeams = [...tournament.teams].sort((a, b) => a.seed - b.seed);

  return (
    <div className="space-y-6">
      {/* Introduction Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-[#0b2341] flex items-center gap-2">
              <ListOrdered className="w-5 h-5 text-sky-600" />
              <span>Championship Seeding & Draw Distribution</span>
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl">
              In accordance with OFSAA Playing Regulations Section 2, teams are seeded 1 through {tournament.teams.length} and distributed across Pools A, B, C, and D based on the official OFSAA serpentine matrix.
            </p>
          </div>
          <div className="text-xs font-bold bg-sky-50 text-[#0b2341] px-3.5 py-1.5 rounded-xl border border-sky-200 self-start">
            {tournament.teams.filter((t) => t.isQualified).length} of {tournament.teams.length} Teams Confirmed
          </div>
        </div>

        {/* Official Criteria */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <span className="font-extrabold text-slate-900">OFSAA Seeding Factors (Regulation 2.b): </span>
          Overall Record, League Performance, Common Opponents, Head-to-Head, Previous Association Finishes, Association Strength, and Roster Strength.
        </div>
      </div>

      {/* Standardized OFSAA Pool Draw Matrix */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <h3 className="text-xs font-black text-[#0b2341] uppercase tracking-wider mb-2">
          Official OFSAA Draw Placement Matrix (Regulation 2.d)
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Distribution of seeded seeds into preliminary round pools:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-[#0b2341] text-white font-extrabold uppercase text-[11px] border-b border-sky-400">
              <tr>
                <th className="py-2.5 px-4 border-r border-slate-700 bg-[#0b2341] text-sky-300">Pool A</th>
                <th className="py-2.5 px-4 border-r border-slate-700 bg-[#0b2341] text-sky-300">Pool B</th>
                <th className="py-2.5 px-4 border-r border-slate-700 bg-[#0b2341] text-sky-300">Pool C</th>
                <th className="py-2.5 px-4 bg-[#0b2341] text-sky-300">Pool D</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-mono text-xs">
              <tr className="bg-sky-50/50 font-bold text-slate-900">
                <td className="py-2 border-r border-slate-200">Seed 1 (A1)</td>
                <td className="py-2 border-r border-slate-200">Seed 3 (B1)</td>
                <td className="py-2 border-r border-slate-200">Seed 2 (C1)</td>
                <td className="py-2">Seed 4 (D1)</td>
              </tr>
              <tr>
                <td className="py-2 border-r border-slate-200">Seed 6 (A2)</td>
                <td className="py-2 border-r border-slate-200">Seed 8 (B2)</td>
                <td className="py-2 border-r border-slate-200">Seed 5 (C2)</td>
                <td className="py-2">Seed 7 (D2)</td>
              </tr>
              <tr className="bg-slate-50/50">
                <td className="py-2 border-r border-slate-200">Seed 11 (A3)</td>
                <td className="py-2 border-r border-slate-200">Seed 9 (B3)</td>
                <td className="py-2 border-r border-slate-200">Seed 12 (C3)</td>
                <td className="py-2">Seed 10 (D3)</td>
              </tr>
              <tr>
                <td className="py-2 border-r border-slate-200">Seed 16 (A4)</td>
                <td className="py-2 border-r border-slate-200">Seed 14 (B4)</td>
                <td className="py-2 border-r border-slate-200">Seed 15 (C4)</td>
                <td className="py-2">Seed 13 (D4)</td>
              </tr>
              {tournament.format === '20-team' && (
                <tr className="bg-slate-50/50">
                  <td className="py-2 border-r border-slate-200">Seed 20 (A5)</td>
                  <td className="py-2 border-r border-slate-200">Seed 19 (B5)</td>
                  <td className="py-2 border-r border-slate-200">Seed 18 (C5)</td>
                  <td className="py-2">Seed 17 (D5)</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full Seeding List Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="bg-[#0b2341] text-white px-5 py-3.5 flex items-center justify-between border-b-2 border-sky-400">
          <h3 className="text-xs font-black uppercase tracking-wider text-white">
            Tournament Seeds 1 – {tournament.teams.length}
          </h3>
          <span className="text-xs text-sky-200">
            {isAdmin ? 'Click Edit Team to customize schools and insert logos' : 'Official Seed Table'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 w-14 text-center">Seed</th>
                <th className="py-3 px-3">School / Team</th>
                <th className="py-3 px-3">Association</th>
                <th className="py-3 px-3 text-center">Assigned Pool</th>
                <th className="py-3 px-3 text-center">Pool Slot</th>
                <th className="py-3 px-3 text-center">Status</th>
                {isAdmin && <th className="py-3 px-3 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedTeams.map((team) => {
                return (
                  <tr key={team.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Seed # */}
                    <td className="py-3 px-3 text-center font-bold">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#0b2341] text-sky-300 font-mono text-xs font-extrabold">
                        #{team.seed}
                      </span>
                    </td>

                    {/* School Name & Logo */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <TeamLogo team={team} size="md" />

                        <div>
                          <span className="font-bold text-slate-900 text-sm block">
                            {team.schoolName || team.name}
                          </span>
                          {team.teamNickname && (
                            <span className="text-[11px] text-slate-500">
                              {team.teamNickname}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Association */}
                    <td className="py-3 px-3">
                      <span className="bg-slate-100 text-slate-700 font-bold text-[11px] px-2.5 py-1 rounded-md border border-slate-200">
                        {team.association}
                      </span>
                    </td>

                    {/* Assigned Pool */}
                    <td className="py-3 px-3 text-center font-bold text-[#0b2341]">
                      <span className="inline-block bg-sky-50 text-sky-900 border border-sky-200 px-2.5 py-0.5 rounded font-bold">
                        Pool {team.pool}
                      </span>
                    </td>

                    {/* Pool Slot */}
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                      {team.poolSlot}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 text-center">
                      {team.isQualified ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Confirmed</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Pending</span>
                        </span>
                      )}
                    </td>

                    {/* Admin Edit */}
                    {isAdmin && (
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => onOpenTeamModal(team.id)}
                          className="px-2.5 py-1 text-xs font-bold text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg inline-flex items-center gap-1 transition-colors"
                        >
                          <Edit3 className="w-3 h-3 text-sky-600" />
                          <span>Edit Team</span>
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
