import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { Match, Team, TournamentFormat } from '../types/tournament';
import { 
  SlidersHorizontal, 
  RotateCcw, 
  Sparkles, 
  Download, 
  Upload, 
  Lock, 
  Check, 
  Edit3, 
  Save, 
  KeyRound, 
  ShieldCheck, 
  Calendar,
  AlertTriangle,
  HelpCircle,
  FileCode
} from 'lucide-react';

interface ConvenorAdminViewProps {
  onOpenScoreModal: (match: Match) => void;
  onOpenTeamModal: (teamId: string) => void;
}

export const ConvenorAdminView: React.FC<ConvenorAdminViewProps> = ({
  onOpenScoreModal,
  onOpenTeamModal,
}) => {
  const {
    tournament,
    resetToSkeleton,
    loadDemoData,
    setTournamentFormat,
    exportTournamentJson,
    importTournamentJson,
    updateTournamentInfo,
    updateCredentials,
    teamsMap,
  } = useTournament();

  const [activeAdminTab, setActiveAdminTab] = useState<'roster' | 'scores' | 'settings' | 'backup'>('roster');

  // General settings state
  const [tournName, setTournName] = useState(tournament.name);
  const [tournDates, setTournDates] = useState(tournament.dates);
  const [tournLocation, setTournLocation] = useState(tournament.location);
  const [savedSettingsMsg, setSavedSettingsMsg] = useState(false);

  // Password state
  const [newUsername, setNewUsername] = useState(tournament.adminUsername || 'admin');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [credMsg, setCredMsg] = useState<{ text: string; error: boolean } | null>(null);

  // Import JSON state
  const [jsonText, setJsonText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateTournamentInfo({
      name: tournName,
      dates: tournDates,
      location: tournLocation,
    });
    setSavedSettingsMsg(true);
    setTimeout(() => setSavedSettingsMsg(false), 3000);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredMsg(null);
    if (!newPassword) {
      setCredMsg({ text: 'Password cannot be empty', error: true });
      return;
    }
    if (newPassword !== confirmPassword) {
      setCredMsg({ text: 'Passwords do not match', error: true });
      return;
    }
    await updateCredentials(newUsername, newPassword);
    setCredMsg({ text: 'Convenor credentials updated successfully!', error: false });
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target?.result as string;
        if (text) {
          const ok = await importTournamentJson(text);
          if (ok) {
            setImportStatus('Tournament restored successfully!');
          } else {
            setImportStatus('Failed to import tournament JSON. Invalid file.');
          }
        }
      };
      reader.readAsText(file);
    }
  };

  const handleImportJsonPaste = async () => {
    if (!jsonText.trim()) return;
    const ok = await importTournamentJson(jsonText);
    if (ok) {
      setImportStatus('Tournament imported successfully!');
      setJsonText('');
    } else {
      setImportStatus('Failed to parse JSON. Please check syntax.');
    }
  };

  const handleResetConfirm = async () => {
    if (
      confirm(
        'Are you sure you want to initialize a FRESH SKELETON? This will clear all existing scores and reset teams to unassigned qualifiers ready for your real tournament.'
      )
    ) {
      await resetToSkeleton();
      alert('Tournament reset to clean skeleton successfully!');
    }
  };

  const handleLoadDemoConfirm = async () => {
    if (
      confirm(
        'Load demo tournament with sample Ontario teams and scores? (You can reset back to a clean skeleton at any time)'
      )
    ) {
      await loadDemoData();
      alert('Demo tournament data loaded!');
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 p-5 rounded-xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-slate-950 text-amber-400 text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider">
              Convenor Control Center
            </span>
            <span className="text-xs font-semibold text-slate-900">
              Live Editing & Public Sync
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-950 mt-1">
            Tournament Management Backend
          </h2>
          <p className="text-xs text-slate-900 mt-0.5">
            Changes made here automatically update public pool standings, tiebreaker ratios, and playoff brackets.
          </p>
        </div>

        {/* Quick Skeleton / Demo triggers */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleResetConfirm}
            className="px-3.5 py-2 rounded-lg text-xs font-bold bg-slate-950 hover:bg-slate-900 text-amber-400 border border-slate-900 flex items-center gap-1.5 shadow-md transition-colors"
            title="Reset to clean skeleton with unassigned qualification slots"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clean Skeleton Mode</span>
          </button>
          <button
            onClick={handleLoadDemoConfirm}
            className="px-3.5 py-2 rounded-lg text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 border border-amber-500 flex items-center gap-1.5 shadow-md transition-colors"
            title="Load demo data with sample schools and scores"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Demo Data</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveAdminTab('roster')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeAdminTab === 'roster'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
          }`}
        >
          1. Team Qualification & Roster ({tournament.teams.length})
        </button>
        <button
          onClick={() => setActiveAdminTab('scores')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeAdminTab === 'scores'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
          }`}
        >
          2. Scorekeeper Matrix ({tournament.matches.length})
        </button>
        <button
          onClick={() => setActiveAdminTab('settings')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeAdminTab === 'settings'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
          }`}
        >
          3. Tournament Info & Format
        </button>
        <button
          onClick={() => setActiveAdminTab('backup')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeAdminTab === 'backup'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
          }`}
        >
          4. GitHub Backup & Export
        </button>
      </div>

      {/* TAB 1: TEAM QUALIFICATION & ROSTER */}
      {activeAdminTab === 'roster' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Qualification Manager
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Insert team names, logos, school colors, and regional associations as schools qualify from their Association Championships.
              </p>
            </div>
            <div className="text-xs font-mono text-amber-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              {tournament.teams.filter((t) => t.isQualified).length} of {tournament.teams.length} Confirmed
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tournament.teams.map((team) => {
              return (
                <div
                  key={team.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-md flex items-center justify-between hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold shrink-0 border border-slate-700"
                      style={{
                        backgroundColor: team.accentColor ? `${team.accentColor}25` : '#1e293b',
                        borderColor: team.accentColor || '#475569',
                      }}
                    >
                      {team.logoUrl?.startsWith('data:') || team.logoUrl?.startsWith('http') ? (
                        <img
                          src={team.logoUrl}
                          alt={team.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <span>{team.logoUrl || '🏐'}</span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-100 text-sm truncate">
                          {team.schoolName || team.name}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          #{team.seed}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span className="font-semibold text-slate-300">{team.poolSlot}</span>
                        <span>•</span>
                        <span>Pool {team.pool}</span>
                        <span>•</span>
                        <span className="text-slate-300">{team.association}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenTeamModal(team.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Team</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: SCOREKEEPER MATRIX */}
      {activeAdminTab === 'scores' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Direct Score Entry Matrix
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Click any match to enter set scores (25-23, 15-12). Standings update automatically.
              </p>
            </div>
            <div className="text-xs text-slate-300 font-mono">
              Completed: {tournament.matches.filter((m) => m.status === 'final').length} / {tournament.matches.length}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tournament.matches.map((match) => {
              const t1 = teamsMap.get(match.team1Id);
              const t2 = teamsMap.get(match.team2Id);
              const isFinal = match.status === 'final';

              return (
                <div
                  key={match.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-700 transition-all shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-slate-800">
                      <span className="font-bold text-amber-400">
                        {match.pool ? `Pool ${match.pool}` : match.name || match.matchNumber}
                      </span>
                      <span className="font-mono">{match.time} • {match.court}</span>
                    </div>

                    <div className="my-2 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200 truncate">
                          {t1 ? t1.schoolName || t1.name : match.team1Placeholder || match.team1Id}
                        </span>
                        <span className="font-mono font-bold text-amber-400">
                          {match.team1SetsWon ?? 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200 truncate">
                          {t2 ? t2.schoolName || t2.name : match.team2Placeholder || match.team2Id}
                        </span>
                        <span className="font-mono font-bold text-amber-400">
                          {match.team2SetsWon ?? 0}
                        </span>
                      </div>
                    </div>

                    {isFinal && match.sets && match.sets.length > 0 && (
                      <div className="text-[10px] font-mono text-slate-400 pb-2">
                        {match.sets.map((s) => `${s.team1Score}-${s.team2Score}`).join(', ')}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => onOpenScoreModal(match)}
                    className="w-full mt-2 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold rounded-lg border border-amber-500/30 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isFinal ? 'Edit Score' : 'Score Game'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: TOURNAMENT SETTINGS */}
      {activeAdminTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* General Information */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Championship Information
            </h3>
            <form onSubmit={handleSaveInfo} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Tournament Title</label>
                <input
                  type="text"
                  value={tournName}
                  onChange={(e) => setTournName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Championship Dates</label>
                <input
                  type="text"
                  value={tournDates}
                  onChange={(e) => setTournDates(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Host Location / Region</label>
                <input
                  type="text"
                  value={tournLocation}
                  onChange={(e) => setTournLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              {savedSettingsMsg && (
                <div className="p-2.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-lg flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Tournament details updated successfully!</span>
                </div>
              )}

              <button
                type="submit"
                className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-lg hover:bg-amber-400 transition-colors flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Save Tournament Details</span>
              </button>
            </form>
          </div>

          {/* Draw Format & Password */}
          <div className="space-y-6">
            {/* Draw Format Switcher */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
                Championship Draw Format
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Switch between OFSAA standard 20-team draw (4 pools of 5) and 16-team draw (4 pools of 4).
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Switch to 20-team format? This will reset the draw structure.')) {
                      setTournamentFormat('20-team');
                    }
                  }}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    tournament.format === '20-team'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  20-Team Format (Standard)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Switch to 16-team format? This will reset the draw structure.')) {
                      setTournamentFormat('16-team');
                    }
                  }}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    tournament.format === '16-team'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  16-Team Format
                </button>
              </div>
            </div>

            {/* Convenor Password */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
                Convenor Password & Security
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Update the password used to access the tournament editing portal.
              </p>

              <form onSubmit={handleUpdatePassword} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Convenor Username</label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Confirm Password</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                    />
                  </div>
                </div>

                {credMsg && (
                  <div
                    className={`p-2 rounded-lg text-xs flex items-center gap-1.5 ${
                      credMsg.error
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {credMsg.error ? <AlertTriangle className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                    <span>{credMsg.text}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>Update Credentials</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: GITHUB BACKUP & EXPORT */}
      {activeAdminTab === 'backup' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Export JSON */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Download className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Export Tournament JSON</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Download the complete tournament data file including all registered teams, logos, pools, match
                results, and playoff brackets. This JSON file can be stored in your GitHub repository or kept as an
                offline backup.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800">
              <button
                onClick={exportTournamentJson}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download tournament.json</span>
              </button>
            </div>
          </div>

          {/* Import JSON */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Upload className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">Import / Restore Tournament</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Restore tournament state from a previous JSON export file or paste raw JSON.
            </p>

            <div>
              <label className="flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-slate-700 hover:border-amber-500 bg-slate-950/40 text-xs text-slate-300 hover:text-white cursor-pointer transition-colors">
                <Upload className="w-4 h-4 text-amber-400" />
                <span>Upload JSON file from disk</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportJsonFile}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder="Or paste tournament JSON content here..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={handleImportJsonPaste}
                disabled={!jsonText.trim()}
                className="mt-2 w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 disabled:opacity-50 transition-colors"
              >
                Import from Pasted JSON
              </button>
            </div>

            {importStatus && (
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
                {importStatus}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
