import React from 'react';
import { useTournament } from '../context/TournamentContext';
import { 
  ShieldCheck, 
  Calendar, 
  FileText, 
  Award,
  LogOut
} from 'lucide-react';
import ofsaaLogo from '../assets/ofsaa-logo.png';

interface HeaderProps {
  onOpenLogin: () => void;
  onOpenRegulations: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenRegulations,
}) => {
  const { tournament, isAdmin, logout, isCloudConnected } = useTournament();

  return (
    <header className="bg-[#0b2341] text-white shadow-md border-b-2 border-sky-400 sticky top-0 z-30">
      {/* Sleek Top Accent Strip */}
      <div className="bg-sky-500 text-[#0b2341] font-bold text-[10px] tracking-wider uppercase py-0.5 px-4 text-center flex items-center justify-center gap-2">
        <span>OFSAA Boys AAA Volleyball 2026</span>
        <span className="hidden sm:inline-block text-[#0b2341]/40">•</span>
        <span className="hidden sm:inline-block font-semibold">
          Host: Ursuline College Chatham (UCC)
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5">
        <div className="flex items-center justify-between gap-3">
          {/* Title and Branding */}
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Athletic Insignia Shield */}
            <img
              src={ofsaaLogo}
              alt="OFSAA Boys AAA Volleyball 2026 Championship Chatham"
              className="w-10 h-10 sm:w-12 sm:h-12 object-contain shrink-0 drop-shadow-md"
            />

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black tracking-tight text-white truncate leading-tight">
                  OFSAA Boys AAA Volleyball 2026 Championship
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-sky-200/90 leading-tight mt-0.5">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-sky-400" />
                  {tournament.dates}
                </span>
                <span className="text-sky-300/40">•</span>
                <span>Chatham-Kent, ON</span>
                {isCloudConnected && (
                  <>
                    <span className="text-sky-300/40">•</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-950/40 border border-emerald-500/40 px-1.5 py-0.5 rounded shadow-xs" title="Connected to live Firestore cloud database across all devices">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Live Sync</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions & Discreet Admin Status */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Official Regulations Button */}
            <button
              onClick={onOpenRegulations}
              className="px-2.5 py-1 text-xs font-semibold text-sky-100 bg-white/10 hover:bg-white/20 border border-white/20 rounded-md flex items-center gap-1.5 transition-colors"
              title="View OFSAA regulations and Section 6 tiebreaker protocol"
            >
              <FileText className="w-3.5 h-3.5 text-sky-300" />
              <span className="hidden sm:inline">OFSAA</span>
              <span>Rules</span>
            </button>

            {/* Only shown when logged in: Convenor badge & logout */}
            {isAdmin && (
              <div className="flex items-center gap-1.5 bg-sky-500/20 border border-sky-400/40 px-2 py-0.5 rounded-md">
                <span className="flex items-center gap-1 text-[11px] font-bold text-sky-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                  <span className="hidden sm:inline">Convenor</span> Mode
                </span>
                <button
                  onClick={logout}
                  className="text-[11px] bg-[#07172b] hover:bg-rose-900/60 text-slate-200 hover:text-white px-1.5 py-0.5 rounded border border-white/10 flex items-center gap-0.5 transition-colors"
                  title="Sign out of convenor mode"
                >
                  <LogOut className="w-2.5 h-2.5" />
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
