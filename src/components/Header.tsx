import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { 
  Trophy, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  MapPin, 
  Calendar, 
  Download, 
  FileText, 
  RefreshCw,
  Sparkles,
  Info
} from 'lucide-react';

interface HeaderProps {
  onOpenLogin: () => void;
  onOpenRegulations: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenLogin,
  onOpenRegulations,
  searchQuery,
  setSearchQuery,
}) => {
  const { tournament, isAdmin, logout, resetToSkeleton, loadDemoData, exportTournamentJson } = useTournament();
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white shadow-xl sticky top-0 z-30">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 font-semibold text-xs tracking-wider uppercase py-1.5 px-4 text-center flex items-center justify-center gap-2">
        <Trophy className="w-3.5 h-3.5 text-slate-950" />
        <span>OFSAA Official Volleyball Championship Results & Live Standings Hub</span>
        <span className="hidden md:inline-block bg-slate-950/20 text-slate-950 px-2 py-0.5 rounded text-[10px] font-bold">
          Regulation 6 Tiebreaker Compliant
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Title and Branding */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 p-0.5 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center border border-amber-500/30">
                <span className="text-2xl" role="img" aria-label="volleyball">🏐</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold px-2 py-0.5 rounded tracking-wide uppercase">
                  OFSAA {tournament.year}
                </span>
                <span className="bg-slate-800 text-slate-300 text-[11px] font-medium px-2 py-0.5 rounded border border-slate-700">
                  {tournament.format} Draw • 4 Pools
                </span>
                {tournament.isSkeletonMode && (
                  <span className="bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[11px] font-medium px-2 py-0.5 rounded flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Skeleton Mode
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-0.5">
                {tournament.name}
              </h1>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-400 mt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  {tournament.dates}
                </span>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  {tournament.venues.join(' | ')}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions & Admin Toggle */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Box */}
            <div className="relative flex-1 sm:w-56">
              <input
                type="text"
                placeholder="Search team, school, court..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800/90 text-sm text-slate-200 placeholder-slate-400 px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Official Regulations Button */}
            <button
              onClick={onOpenRegulations}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
              title="View official OFSAA playing regulations and tiebreaker rules"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>OFSAA Rules</span>
            </button>

            {/* Export JSON Button */}
            <button
              onClick={exportTournamentJson}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
              title="Export tournament data to JSON file"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Export</span>
            </button>

            {/* Convenor Admin Login / Status */}
            {isAdmin ? (
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg">
                <span className="flex items-center gap-1 text-xs font-bold text-amber-400">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  Convenor Active
                </span>
                <button
                  onClick={logout}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2 py-0.5 rounded border border-slate-700 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/90 hover:bg-amber-600 hover:text-white border border-slate-700 hover:border-amber-500 rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Convenor Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
