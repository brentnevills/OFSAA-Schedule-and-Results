import React from 'react';
import { useTournament } from '../context/TournamentContext';
import { ListOrdered, Edit3, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';
import { PoolId } from '../types/tournament';

interface SeedingTableViewProps {
  onOpenTeamModal: (teamId: string) => void;
  searchQuery?: string;
}

export const SeedingTableView: React.FC<SeedingTableViewProps> = ({ onOpenTeamModal, searchQuery = '' }) => {
  const { tournament, isAdmin } = useTournament();

  const sortedTeams = [...tournament.teams].sort((a, b) => a.seed - b.seed);

  const filteredTeams = sortedTeams.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.schoolName.toLowerCase().includes(q) ||
      t.association.toLowerCase().includes(q) ||
      t.poolSlot.toLowerCase().includes(q) ||
      t.seed.toString() === q
    );
  });

  return (
    <div className="space-y-8">
      {/* Introduction Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ListOrdered className="w-5 h-5 text-amber-400" />
              <span>OFSAA Championship Seeding & Placement Draw</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl">
              In accordance with OFSAA Playing Regulations Section 2, the field is seeded by the convenor's seeding committee.
              Teams are placed into 4 preliminary pools based on the standardized serpentine draw structure.
            </p>
          </div>
          <div className="text-xs font-mono bg-slate-800 text-amber-400 px-3 py-1.5 rounded-lg border border-slate-700 self-start">
            {tournament.teams.filter((t) => t.isQualified).length} of {tournament.teams.length} Teams Qualified
          </div>
        </div>

        {/* Official Criteria Quote */}
        <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-400 bg-slate-950/40 p-3 rounded-lg border border-slate-800/80">
          <span className="font-bold text-slate-200">Official Seeding Criteria (Regulation 2.b): </span>
          Overall Record, League Record, Common Opponents, Strength of Schedule, Previous Association Results,
          Association Strength, Strength of Roster, and Coach assessment of appropriate seed.
        </div>
      </div>

      {/* Standardized OFSAA Pool Draw Matrix (As printed in regulations) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
          Official OFSAA Draw Placement Matrix (4 Courts)
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Regulation 2.d: Standardized distribution of seeds across pools for 16 & 20-team draws:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs border border-slate-800 rounded-lg overflow-hidden">
            <thead className="bg-slate-950 text-slate-300 font-bold uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-4 border-r border-slate-800 bg-amber-500/10 text-amber-400">Pool A</th>
                <th className="py-2.5 px-4 border-r border-slate-800 bg-amber-500/10 text-amber-400">Pool B</th>
                <th className="py-2.5 px-4 border-r border-slate-800 bg-amber-500/10 text-amber-400">Pool C</th>
                <th className="py-2.5 px-4 bg-amber-500/10 text-amber-400">Pool D</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-mono text-sm">
              <tr>
                <td className="py-2 border-r border-slate-800 font-bold text-amber-400">Seed 1 (A1)</td>
                <td className="py-2 border-r border-slate-800 font-bold text-amber-400">Seed 3 (B1)</td>
                <td className="py-2 border-r border-slate-800 font-bold text-amber-400">Seed 2 (C1)</td>
                <td className="py-2 font-bold text-amber-400">Seed 4 (D1)</td>
              </tr>
              <tr>
                <td className="py-2 border-r border-slate-800">Seed 6 (A2)</td>
                <td className="py-2 border-r border-slate-800">Seed 8 (B2)</td>
                <td className="py-2 border-r border-slate-800">Seed 5 (C2)</td>
                <td className="py-2">Seed 7 (D2)</td>
              </tr>
              <tr>
                <td className="py-2 border-r border-slate-800">Seed 11 (A3)</td>
                <td className="py-2 border-r border-slate-800">Seed 9 (B3)</td>
                <td className="py-2 border-r border-slate-800">Seed 12 (C3)</td>
                <td className="py-2">Seed 10 (D3)</td>
              </tr>
              <tr>
                <td className="py-2 border-r border-slate-800">Seed 16 (A4)</td>
                <td className="py-2 border-r border-slate-800">Seed 14 (B4)</td>
                <td className="py-2 border-r border-slate-800">Seed 15 (C4)</td>
                <td className="py-2">Seed 13 (D4)</td>
              </tr>
              {tournament.format === '20-team' && (
                <tr className="bg-slate-950/40">
                  <td className="py-2 border-r border-slate-800">Seed 20 (A5)</td>
                  <td className="py-2 border-r border-slate-800">Seed 19 (B5)</td>
                  <td className="py-2 border-r border-slate-800">Seed 18 (C5)</td>
                  <td className="py-2">Seed 17 (D5)</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full Seeding List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="bg-slate-800/90 px-4 sm:px-6 py-3.5 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Tournament Seeds 1 – {tournament.teams.length}
          </h3>
          <span className="text-xs text-slate-400">
            Click edit to assign qualifying teams and update logos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-semibold">
              <tr>
                <th className="py-3 px-3 text-center w-14">Seed</th>
                <th className="py-3 px-3">Team / School Name</th>
                <th className="py-3 px-3">Association</th>
                <th className="py-3 px-3 text-center">Assigned Pool</th>
                <th className="py-3 px-3 text-center">Pool Slot</th>
                <th className="py-3 px-3 text-center">Qualification</th>
                {isAdmin && <th className="py-3 px-3 text-right">Admin Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredTeams.map((team) => {
                return (
                  <tr key={team.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Seed # */}
                    <td className="py-3 px-3 text-center font-bold">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-800 text-amber-400 border border-slate-700 font-mono text-sm">
                        #{team.seed}
                      </span>
                    </td>

                    {/* School Name & Logo */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 border border-slate-700"
                          style={{
                            backgroundColor: team.accentColor ? `${team.accentColor}25` : '#1e293b',
                            borderColor: team.accentColor || '#475569',
                          }}
                        >
                          {team.logoUrl?.startsWith('data:') || team.logoUrl?.startsWith('http') ? (
                            <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <span>{team.logoUrl || '🏐'}</span>
                          )}
                        </div>

                        <div>
                          <span className="font-bold text-slate-100 text-sm block">
                            {team.schoolName || team.name}
                          </span>
                          {team.teamNickname && (
                            <span className="text-[11px] text-slate-400">
                              {team.teamNickname}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Association */}
                    <td className="py-3 px-3">
                      <span className="bg-slate-800 text-slate-300 font-semibold text-[11px] px-2.5 py-1 rounded border border-slate-700">
                        {team.association}
                      </span>
                    </td>

                    {/* Assigned Pool */}
                    <td className="py-3 px-3 text-center font-bold text-amber-400">
                      <span className="inline-block bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                        Pool {team.pool}
                      </span>
                    </td>

                    {/* Pool Slot */}
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-200">
                      {team.poolSlot}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 text-center">
                      {team.isQualified ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirmed</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded font-medium">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>TBD / Pending</span>
                        </span>
                      )}
                    </td>

                    {/* Admin Edit */}
                    {isAdmin && (
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => onOpenTeamModal(team.id)}
                          className="px-2.5 py-1 text-xs font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg inline-flex items-center gap-1 transition-colors"
                        >
                          <Edit3 className="w-3 h-3" />
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
