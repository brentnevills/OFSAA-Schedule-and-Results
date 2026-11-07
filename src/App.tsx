import React, { useState } from 'react';
import { TournamentProvider, useTournament } from './context/TournamentContext';
import { Header } from './components/Header';
import { Navigation, TabKey } from './components/Navigation';
import { PoolStandingsView } from './components/PoolStandingsView';
import { PlayoffsView } from './components/PlayoffsView';
import { ScheduleView } from './components/ScheduleView';
import { SeedingTableView } from './components/SeedingTableView';
import { TiebreakerRulesView } from './components/TiebreakerRulesView';
import { ConvenorAdminView } from './components/ConvenorAdminView';
import { LoginModal } from './components/LoginModal';
import { RegulationsModal } from './components/RegulationsModal';
import { AdminScoreModal } from './components/AdminScoreModal';
import { AdminTeamModal } from './components/AdminTeamModal';
import { Match } from './types/tournament';
import { Trophy, ShieldCheck, Heart } from 'lucide-react';

function TournamentApp() {
  const { tournament, isAdmin } = useTournament();

  const [activeTab, setActiveTab] = useState<TabKey>('standings');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [isRegulationsOpen, setIsRegulationsOpen] = useState<boolean>(false);
  const [scoreModalMatch, setScoreModalMatch] = useState<Match | null>(null);
  const [editTeamId, setEditTeamId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Header */}
      <Header
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenRegulations={() => setIsRegulationsOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenLogin={() => setIsLoginOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'standings' && (
          <PoolStandingsView
            onOpenScoreModal={(m) => setScoreModalMatch(m)}
            onOpenTeamModal={(tId) => setEditTeamId(tId)}
            onViewTiebreakerRules={() => setActiveTab('tiebreakers')}
            searchQuery={searchQuery}
          />
        )}

        {activeTab === 'playoffs' && (
          <PlayoffsView onOpenScoreModal={(m) => setScoreModalMatch(m)} />
        )}

        {activeTab === 'schedule' && (
          <ScheduleView
            onOpenScoreModal={(m) => setScoreModalMatch(m)}
            searchQuery={searchQuery}
          />
        )}

        {activeTab === 'seeding' && (
          <SeedingTableView
            onOpenTeamModal={(tId) => setEditTeamId(tId)}
            searchQuery={searchQuery}
          />
        )}

        {activeTab === 'tiebreakers' && <TiebreakerRulesView />}

        {activeTab === 'admin' && (
          <ConvenorAdminView
            onOpenScoreModal={(m) => setScoreModalMatch(m)}
            onOpenTeamModal={(tId) => setEditTeamId(tId)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-6 text-xs text-slate-400 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span className="font-semibold text-slate-300">
              OFSAA Boys' & Girls' Volleyball Championships • {tournament.year}
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <span>Section 6 Tiebreaker Automation Active</span>
            <span>•</span>
            <button
              onClick={() => setIsRegulationsOpen(true)}
              className="hover:text-amber-400 transition-colors"
            >
              Playing Regulations
            </button>
            <span>•</span>
            {isAdmin ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Convenor Logged In
              </span>
            ) : (
              <button
                onClick={() => setIsLoginOpen(true)}
                className="hover:text-amber-400 transition-colors"
              >
                Convenor Portal
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Modals */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSuccess={() => setActiveTab('admin')}
      />

      <RegulationsModal
        isOpen={isRegulationsOpen}
        onClose={() => setIsRegulationsOpen(false)}
      />

      <AdminScoreModal
        match={scoreModalMatch}
        onClose={() => setScoreModalMatch(null)}
      />

      <AdminTeamModal
        teamId={editTeamId}
        onClose={() => setEditTeamId(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <TournamentProvider>
      <TournamentApp />
    </TournamentProvider>
  );
}
