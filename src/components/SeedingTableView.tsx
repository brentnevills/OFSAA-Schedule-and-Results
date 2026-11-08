import React from 'react';
import { useTournament } from '../context/TournamentContext';
import { TeamLogo } from './TeamLogo';
import { ListOrdered, Edit3, CheckCircle2, Clock, UserPlus } from 'lucide-react';

interface SeedingTableViewProps {
  onOpenTeamModal: (teamId: string) => void;
}

export const SeedingTableView: React.FC<SeedingTableViewProps> = ({ onOpenTeamModal }) => {
  const { tournament, isAdmin, updateTeamSeed } = useTournament();

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

      {/* Standardized OFSAA Pool Draw Matrix - Dynamically updates with inserted teams */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-black text-[#0b2341] uppercase tracking-wider">
              Official OFSAA Draw Placement Matrix (Regulation 2.d)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Preliminary round pools distribution. Dynamically reflects all seeded teams and schools:
            </p>
          </div>
          {isAdmin && (
            <span className="text-[11px] font-bold text-sky-800 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-lg self-start">
              Click any slot to configure team
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-[#0b2341] text-white font-extrabold uppercase text-[11px] border-b border-sky-400">
              <tr>
                <th className="py-2.5 px-3 border-r border-slate-700 bg-[#0b2341] text-sky-300 w-1/4">Pool A</th>
                <th className="py-2.5 px-3 border-r border-slate-700 bg-[#0b2341] text-sky-300 w-1/4">Pool B</th>
                <th className="py-2.5 px-3 border-r border-slate-700 bg-[#0b2341] text-sky-300 w-1/4">Pool C</th>
                <th className="py-2.5 px-3 bg-[#0b2341] text-sky-300 w-1/4">Pool D</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700 text-xs">
              {[
                { tier: 'Tier 1', slots: ['A1', 'B1', 'C1', 'D1'], seeds: [1, 3, 2, 4] },
                { tier: 'Tier 2', slots: ['A2', 'B2', 'C2', 'D2'], seeds: [6, 8, 5, 7] },
                { tier: 'Tier 3', slots: ['A3', 'B3', 'C3', 'D3'], seeds: [11, 9, 12, 10] },
                { tier: 'Tier 4', slots: ['A4', 'B4', 'C4', 'D4'], seeds: [16, 14, 15, 13] },
                ...(tournament.format === '20-team'
                  ? [{ tier: 'Tier 5', slots: ['A5', 'B5', 'C5', 'D5'], seeds: [20, 19, 18, 17] }]
                  : []),
              ].map((row, rowIdx) => (
                <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-slate-50/40' : 'bg-white'}>
                  {row.slots.map((slot, colIdx) => {
                    const fallbackSeed = row.seeds[colIdx];
                    const team =
                      tournament.teams.find((t) => t.poolSlot === slot || t.id === slot) ||
                      tournament.teams.find((t) => t.seed === fallbackSeed);
                    const isRightBorder = colIdx < 3;

                    return (
                      <td
                        key={slot}
                        onClick={() => {
                          if (isAdmin && team) onOpenTeamModal(team.id);
                        }}
                        className={`p-3 text-left align-top transition-colors ${
                          isRightBorder ? 'border-r border-slate-200' : ''
                        } ${isAdmin ? 'cursor-pointer hover:bg-sky-50/70' : ''}`}
                      >
                        <div className="flex items-start gap-2.5">
                          <TeamLogo team={team} size="sm" className="mt-0.5 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono font-black text-[#0b2341] text-xs bg-sky-100/90 text-sky-950 px-1.5 py-0.2 rounded border border-sky-300">
                                {slot} • #{team?.seed || fallbackSeed}
                              </span>
                              {team?.association && (
                                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1 py-0.2 rounded border border-slate-200">
                                  {team.association}
                                </span>
                              )}
                            </div>
                            <span className="font-bold text-slate-900 text-xs block truncate mt-1">
                              {team?.schoolName || team?.name || `Seed ${fallbackSeed}`}
                            </span>
                            {team?.teamNickname && (
                              <span className="text-[10px] text-slate-500 block truncate">
                                {team.teamNickname}
                              </span>
                            )}
                          </div>
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

      {/* Full Seeding List Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="bg-[#0b2341] text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b-2 border-sky-400">
          <div className="flex items-center gap-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-white">
              Tournament Seeds 1 – {tournament.teams.length}
            </h3>
            {isAdmin && (
              <button
                onClick={() => onOpenTeamModal('new')}
                className="px-2.5 py-1 bg-sky-500 hover:bg-sky-400 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Add Team</span>
              </button>
            )}
          </div>
          <span className="text-xs text-sky-200">
            {isAdmin ? 'Convenor Mode: Re-seed teams or edit school details below' : 'Official Seed Table'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 w-16 text-center">Seed</th>
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
                const totalSeedCount = tournament.teams.length;
                return (
                  <tr key={team.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Seed # */}
                    <td className="py-3 px-3 text-center font-bold">
                      {isAdmin ? (
                        <select
                          value={team.seed}
                          onChange={(e) => updateTeamSeed(team.id, Number(e.target.value))}
                          aria-label={`Change seed for ${team.schoolName || team.name}`}
                          className="bg-[#0b2341] text-sky-300 font-mono text-xs font-extrabold px-1.5 py-1 rounded-lg border border-sky-400/50 cursor-pointer focus:ring-2 focus:ring-sky-400"
                          title="Click to swap seed position with another team"
                        >
                          {Array.from({ length: totalSeedCount }, (_, i) => i + 1).map((s) => (
                            <option key={s} value={s} className="bg-slate-900 text-white">
                              #{s}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#0b2341] text-sky-300 font-mono text-xs font-extrabold">
                          #{team.seed}
                        </span>
                      )}
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
