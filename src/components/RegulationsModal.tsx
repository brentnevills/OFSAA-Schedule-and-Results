import React, { useState } from 'react';
import { X, FileText, Scale, Shield, Users, Clock, AlertCircle } from 'lucide-react';

interface RegulationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RegulationsModal: React.FC<RegulationsModalProps> = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState<'rules' | 'tiebreakers' | 'subs' | 'protest'>('rules');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-800/90 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">OFSAA Volleyball Playing Regulations</h3>
              <p className="text-xs text-slate-400">Official Constitution & Championship Directives</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 py-2 gap-2 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveSection('rules')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
              activeSection === 'rules' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            1. Structure & Formats
          </button>
          <button
            onClick={() => setActiveSection('tiebreakers')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
              activeSection === 'tiebreakers' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            2. Section 6 Tiebreakers
          </button>
          <button
            onClick={() => setActiveSection('subs')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
              activeSection === 'subs' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            3. Subs, Libero & Ceiling
          </button>
          <button
            onClick={() => setActiveSection('protest')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
              activeSection === 'protest' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            4. Protests & Awards
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed">
          {activeSection === 'rules' && (
            <div className="space-y-4">
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
                <h4 className="text-sm font-bold text-amber-400 mb-1">Championship Structure & Procedures (Regulation 2.a)</h4>
                <p>
                  The OFSAA Volleyball Championships shall be a sixteen (16) or twenty (20) team pool format.
                  The teams shall be divided into four (4) pools of four (4) teams (16 entries) or four (4) pools of five (5) teams (20 entries)
                  and each pool shall play against each team in the pool.
                </p>
                <div className="mt-2 pt-2 border-t border-slate-700 text-slate-200">
                  <strong className="text-emerald-400">Advancement: </strong>
                  The top two (2) teams in each pool after round robin play advance to Championship playoffs.
                  The third and fourth place teams in each pool advance to Consolation playoffs.
                  The fifth place team does not advance past pool play.
                </div>
              </div>

              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
                <h4 className="text-sm font-bold text-amber-400 mb-1">Match Formats (Directive 1.e)</h4>
                <p>
                  All matches in pool play (round robin) shall be best two (2) out of three (3) sets.
                  All matches of the playoffs (consolation and championship quarter-finals, semi-finals, consolation final, bronze medal match, and gold medal match) shall be best three (3) out of five (5) sets.
                </p>
              </div>

              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
                <h4 className="text-sm font-bold text-amber-400 mb-1">Warmup Procedures (Regulation 2.b)</h4>
                <ul className="list-disc pl-4 space-y-1 mt-1 text-slate-300">
                  <li>Minimum of 5 minutes common on-court warm-up time for each team.</li>
                  <li>Official warm-up begins at 13 minutes before game time.</li>
                  <li>Serving team receives first 5 minutes on court (13 min to 8 min remaining).</li>
                  <li>Receiving team receives next 5 minutes on court (8 min to 3 min remaining).</li>
                  <li>Remaining 3 minutes serves as pre-match preparations and baseline protocol.</li>
                </ul>
              </div>
            </div>
          )}

          {activeSection === 'tiebreakers' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-200">
                <h4 className="font-bold text-amber-300 text-sm mb-1">Regulation 6 Tie Breaking Rules</h4>
                <p>
                  The rules of Volleyball Canada (VC), as of September 1st of the current school year, shall govern play at the OFSAA Championship with the following tie breaking exceptions:
                </p>
              </div>

              <div className="bg-slate-800/40 p-3.5 rounded-lg border border-slate-700/60">
                <strong className="text-white">a. Two (2) Teams Tied:</strong>
                <p className="mt-1">
                  If two (2) teams are tied at the end of pool play, the team winning the match between the two tied teams shall receive the higher ranking.
                </p>
              </div>

              <div className="bg-slate-800/40 p-3.5 rounded-lg border border-slate-700/60">
                <strong className="text-white">b. Three (3) Teams Tied for 1st or 3rd Place:</strong>
                <p className="mt-1">
                  The following criteria (in sequence) determine the highest ranked team, and the remaining two (2) teams play a set to 15 (2-point margin of victory) to complete final pool rankings:
                </p>
                <ol className="list-decimal pl-5 mt-2 space-y-1 text-slate-300">
                  <li>Highest ratio of won/lost matches among tied teams only.</li>
                  <li>Highest ratio of won/lost sets among tied teams only.</li>
                  <li>Highest ratio of won/lost sets considering all matches in pool play.</li>
                  <li>Highest ratio of points for/against among tied teams only.</li>
                  <li>Highest ratio of points for/against considering all games in pool play.</li>
                </ol>
              </div>

              <div className="bg-slate-800/40 p-3.5 rounded-lg border border-slate-700/60">
                <strong className="text-white">c. Three (3) Teams Tied for 2nd Place:</strong>
                <p className="mt-1">
                  Criteria applied in sequence to determine the LOWEST ranked team, and the remaining two (2) teams play a set to 15 (2-point margin of victory) to complete pool rankings.
                </p>
              </div>

              <div className="bg-slate-800/40 p-3.5 rounded-lg border border-slate-700/60">
                <strong className="text-white">d. Four (4) or More Teams Tied:</strong>
                <p className="mt-1">
                  Criteria applied one after another until tie is broken. After ranking is completed, 2nd and 4th place are determined by an additional set to 15 with 2-point margin.
                </p>
                <p className="mt-2 text-amber-300 italic">
                  Note: No team in a 4-way or 5-way tie shall be eliminated from championship playoffs or from continuation in consolation playoffs by virtue of tie breaker rules. An additional set must be played up to 15 with a 2-point margin of victory.
                </p>
              </div>
            </div>
          )}

          {activeSection === 'subs' && (
            <div className="space-y-4">
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
                <h4 className="text-sm font-bold text-amber-400 mb-1">12 Substitution Rule (Regulation 6.i)</h4>
                <p>
                  For OFSAA competition teams are allowed a maximum of 12 substitutions in any one set.
                  There is no limit to the number of times a player may leave or re-enter a set as long as the maximum number of substitutions is adhered to and they leave or re-enter for the same player.
                  Once a player has a designated substitution partner in a set, that is the only player that they may leave or re-enter that set for.
                </p>
              </div>

              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
                <h4 className="text-sm font-bold text-amber-400 mb-1">Libero Player (Regulation 6.j)</h4>
                <ul className="list-disc pl-4 space-y-1 text-slate-300">
                  <li>Each team has the right to designate up to two (2) specialist defensive players (Liberos).</li>
                  <li>Coach may re-designate Liberos each set.</li>
                  <li>Only one Libero may be on the court at any time.</li>
                  <li>The Libero CAN be either team captain or game captain while performing as Libero.</li>
                </ul>
              </div>

              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
                <h4 className="text-sm font-bold text-amber-400 mb-1">One-Touch Ceiling Rule (Regulation 6.l)</h4>
                <p>
                  A ball remains in play if it contacts the ceiling or overhead object(s) directly above the playing area on the team's own side of the court, provided it touches only one surface.
                  The ball is in play as long as it continues moving. If it stops or crosses over to opponent's side after contacting ceiling, it is OUT.
                </p>
              </div>
            </div>
          )}

          {activeSection === 'protest' && (
            <div className="space-y-4">
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
                <h4 className="text-sm font-bold text-amber-400 mb-1">Protest Committee & Procedure (Regulation 13)</h4>
                <p>
                  All protests must be submitted in writing to the Championship convenor within thirty (30) minutes of the completion of the match, accompanied by a $100.00 fee (refundable if upheld).
                </p>
                <div className="mt-2 text-rose-300">
                  Note: Officials' judgment decisions and eligibility of transfer students may not be protested at the championship.
                </div>
              </div>

              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
                <h4 className="text-sm font-bold text-amber-400 mb-1">Official Awards (Regulation 8)</h4>
                <ul className="list-disc pl-4 space-y-1 text-slate-300">
                  <li>OFSAA gold, silver, bronze, and antique bronze medallions (18 each) presented to top 4 teams in Championship.</li>
                  <li>Championship school receives the prestigious OFSAA Provincial Championship Banner.</li>
                  <li>Consolation champion school receives the official OFSAA Consolation Plaque.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-800/90 px-6 py-3 border-t border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
