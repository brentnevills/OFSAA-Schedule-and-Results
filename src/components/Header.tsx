import React from 'react';
import { useTournament } from '../context/TournamentContext';
import { 
  ShieldCheck, 
  Calendar, 
  FileText, 
  Award,
  LogOut
} from 'lucide-react';

interface HeaderProps {
  onOpenLogin: () => void;
  onOpenRegulations: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenRegulations,
}) => {
  const { tournament, isAdmin, logout } = useTournament();

  return (
    <header className="bg-[#0b2341] text-white shadow-md border-b-4 border-sky-400 sticky top-0 z-30">
      {/* Top Accent Strip */}
      <div className="bg-sky-500 text-[#0b2341] font-bold text-xs tracking-wider uppercase py-1 px-4 text-center flex items-center justify-center gap-2">
        <span>OFSAA Boys AAA Volleyball 2026 Championship</span>
        <span className="hidden md:inline-block text-[#0b2341]/40">•</span>
        <span className="hidden md:inline-block font-semibold">
          Host: Ursuline College Chatham (UCC)
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Title and Branding */}
          <div className="flex items-center gap-3.5">
            {/* Clean Athletic Insignia Shield */}
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 p-0.5 flex items-center justify-center shadow-md shrink-0">
              <div className="w-full h-full bg-[#0b2341] rounded-[10px] flex items-center justify-center border border-sky-400/40">
                <Award className="w-6 h-6 text-sky-400" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="bg-sky-400/20 text-sky-200 border border-sky-400/40 text-[11px] font-bold px-2 py-0.5 rounded tracking-wider uppercase">
                  OFSAA {tournament.year}
                </span>
                <span className="bg-white/10 text-slate-200 text-[11px] font-medium px-2 py-0.5 rounded border border-white/15">
                  {tournament.format} Tournament • 4 Pools
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
                OFSAA Boys AAA Volleyball 2026 Championship
              </h1>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-sky-200/90 mt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-sky-400" />
                  {tournament.dates}
                </span>
                <span className="text-sky-300/40">•</span>
                <span>Chatham-Kent, Ontario</span>
              </div>
            </div>
          </div>

          {/* Quick Actions & Discreet Admin Status */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Official Regulations Button */}
            <button
              onClick={onOpenRegulations}
              className="px-3 py-1.5 text-xs font-semibold text-sky-100 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg flex items-center gap-1.5 transition-colors"
              title="View OFSAA regulations and Section 6 tiebreaker protocol"
            >
              <FileText className="w-3.5 h-3.5 text-sky-300" />
              <span>OFSAA Rules</span>
            </button>

            {/* Only shown when logged in: Convenor badge & logout */}
            {isAdmin && (
              <div className="flex items-center gap-2 bg-sky-500/20 border border-sky-400/40 px-2.5 py-1 rounded-lg">
                <span className="flex items-center gap-1 text-xs font-bold text-sky-300">
                  <ShieldCheck className="w-4 h-4 text-sky-400" />
                  Convenor Mode
                </span>
                <button
                  onClick={logout}
                  className="text-xs bg-[#07172b] hover:bg-rose-900/60 text-slate-200 hover:text-white px-2 py-0.5 rounded border border-white/10 flex items-center gap-1 transition-colors"
                  title="Sign out of convenor mode"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Exit</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
