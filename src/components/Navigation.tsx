import React from 'react';
import { 
  BarChart3, 
  Trophy, 
  CalendarDays, 
  ListOrdered, 
  FileText, 
  SlidersHorizontal
} from 'lucide-react';
import { useTournament } from '../context/TournamentContext';

export type TabKey = 'standings' | 'schedule' | 'playoffs' | 'seeding' | 'tiebreakers' | 'admin';

interface NavigationProps {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  onOpenLogin: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const { isAdmin } = useTournament();

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'standings', label: 'Pools & Standings', icon: <BarChart3 className="w-4 h-4" /> },
    { key: 'schedule', label: 'Schedule & Scores', icon: <CalendarDays className="w-4 h-4" /> },
    { key: 'playoffs', label: 'Playoff Brackets', icon: <Trophy className="w-4 h-4" /> },
    { key: 'seeding', label: 'Seeding Table', icon: <ListOrdered className="w-4 h-4" /> },
    { key: 'tiebreakers', label: 'Official Regulations', icon: <FileText className="w-4 h-4" /> },
  ];

  // Only display Convenor Admin tab if the convenor is authenticated (hidden for public viewers)
  if (isAdmin) {
    tabs.push({
      key: 'admin',
      label: 'Convenor Control',
      icon: <SlidersHorizontal className="w-4 h-4 text-sky-400" />
    });
  }

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs sticky top-[52px] sm:top-[58px] z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2.5 no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const isConvenorTab = tab.key === 'admin';
            
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? isConvenorTab
                      ? 'bg-[#0b2341] text-sky-300 shadow-sm ring-2 ring-sky-400/40'
                      : 'bg-[#0b2341] text-white shadow-sm'
                    : isConvenorTab
                      ? 'text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {isConvenorTab && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
