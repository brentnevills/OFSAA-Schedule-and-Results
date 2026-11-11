import React, { useState, useEffect } from 'react';
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
import { Match, PoolId } from './types/tournament';
import { ShieldCheck, Lock } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';

function TournamentApp() {
  const { tournament, isAdmin } = useTournament();

  const [activeTab, setActiveTab] = useState<TabKey>('standings');

  // Modals state
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [isRegulationsOpen, setIsRegulationsOpen] = useState<boolean>(false);
  const [scoreModalMatch, setScoreModalMatch] = useState<Match | null>(null);
  const [editTeamId, setEditTeamId] = useState<string | null>(null);

  // Match highlight state when clicking from standings matrix
  const [highlightedMatchId, setHighlightedMatchId] = useState<string | null>(null);
  const [returnToStandingsPool, setReturnToStandingsPool] = useState<PoolId | null>(null);

  const handleNavigateToMatch = (match: Match) => {
    setHighlightedMatchId(match.id);
    if (match.pool) {
      setReturnToStandingsPool(match.pool);
    }
    setActiveTab('schedule');
  };

  const handleReturnToStandings = () => {
    setActiveTab('standings');
  };

  // Hidden shortcut to open convenor portal: Ctrl+Shift+A or Cmd+Shift+A
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setIsLoginOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-800 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Header with UCC Chatham colors */}
      <Header
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenRegulations={() => setIsRegulationsOpen(true)}
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
            onNavigateToMatch={handleNavigateToMatch}
          />
        )}

        {activeTab === 'schedule' && (
          <ScheduleView
            onOpenScoreModal={(m) => setScoreModalMatch(m)}
            onOpenLogin={() => setIsLoginOpen(true)}
            highlightedMatchId={highlightedMatchId}
            onClearHighlight={() => setHighlightedMatchId(null)}
            returnToStandingsPool={returnToStandingsPool}
            onReturnToStandings={handleReturnToStandings}
          />
        )}

        {activeTab === 'playoffs' && (
          <PlayoffsView 
            onOpenScoreModal={(m) => setScoreModalMatch(m)} 
            onOpenLogin={() => setIsLoginOpen(true)}
          />
        )}

        {activeTab === 'seeding' && (
          <SeedingTableView
            onOpenTeamModal={(tId) => setEditTeamId(tId)}
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
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#0b2341]">
              OFSAA Boys AAA Volleyball 2026 Championship
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600 font-medium">
              Host School: Ursuline College Chatham (UCC)
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-500 text-[11px]">
            <button
              onClick={() => setIsRegulationsOpen(true)}
              className="hover:text-sky-700 transition-colors font-medium"
            >
              Playing Regulations
            </button>
            <span>•</span>
            {isAdmin ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Convenor Logged In
              </span>
            ) : (
              /* Discreet convenor link */
              <button
                onClick={() => setIsLoginOpen(true)}
                className="text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
                title="Convenor Administration"
              >
                <Lock className="w-3 h-3 text-slate-400" />
                <span>Convenor Access</span>
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
    <ErrorBoundary>
      <TournamentProvider>
        <TournamentApp />
      </TournamentProvider>
    </ErrorBoundary>
  );
}
