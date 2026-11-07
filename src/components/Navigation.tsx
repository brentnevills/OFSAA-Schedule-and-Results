import React from 'react';
import { 
  BarChart3, 
  Trophy, 
  CalendarDays, 
  ListOrdered, 
  Scale, 
  SlidersHorizontal,
  Lock
} from 'lucide-react';
import { useTournament } from '../context/TournamentContext';

export type TabKey = 'standings' | 'playoffs' | 'schedule' | 'seeding' | 'tiebreakers' | 'admin';

interface NavigationProps {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  onOpenLogin: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab, onOpenLogin }) => {
  const { isAdmin } = useTournament();

  const tabs: { key: TabKey; label: string; icon: React.ReactNode; requiresAdmin?: boolean }[] = [
    { key: 'standings', label: 'Pools & Standings', icon: <BarChart3 className="w-4 h-4" /> },
    { key: 'playoffs', label: 'Playoff Brackets', icon: <Trophy className="w-4 h-4" /> },
    { key: 'schedule', label: 'Schedule & Scores', icon: <CalendarDays className="w-4 h-4" /> },
    { key: 'seeding', label: 'Seeding Table', icon: <ListOrdered className="w-4 h-4" /> },
    { key: 'tiebreakers', label: 'Tiebreaker Rules', icon: <Scale className="w-4 h-4" /> },
    { key: 'admin', label: 'Convenor Admin', icon: <SlidersHorizontal className="w-4 h-4" />, requiresAdmin: false },
  ];

  return (
    <nav className="bg-slate-900/90 backdrop-blur border-b border-slate-800 sticky top-[92px] md:top-[85px] z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  if (tab.key === 'admin' && !isAdmin) {
                    onOpenLogin();
                  } else {
                    setActiveTab(tab.key);
                  }
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.key === 'admin' && !isAdmin && (
                  <Lock className="w-3 h-3 text-slate-500 ml-0.5" />
                )}
                {tab.key === 'admin' && isAdmin && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
