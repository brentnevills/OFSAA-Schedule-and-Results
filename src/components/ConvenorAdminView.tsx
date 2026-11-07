import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { Match } from '../types/tournament';
import { TeamLogo } from './TeamLogo';
import { 
  RotateCcw, 
  Sparkles, 
  Download, 
  Upload, 
  Check, 
  Edit3, 
  Save, 
  KeyRound, 
  AlertTriangle,
  MapPin,
  ShieldCheck
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
    importTournamentJson,
    updateTournamentInfo,
    updateCredentials,
  } = useTournament();

  const [activeAdminTab, setActiveAdminTab] = useState<'roster' | 'scores' | 'settings' | 'backup'>('roster');

  // General settings state
  const [tournName, setTournName] = useState(tournament.name);
  const [tournDates, setTournDates] = useState(tournament.dates);
  const [tournLocation, setTournLocation] = useState(tournament.location);
  const [venuesText, setVenuesText] = useState((tournament.venues || []).join(', '));
  const [savedSettingsMsg, setSavedSettingsMsg] = useState(false);

  // Password state
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [credMsg, setCredMsg] = useState<{ text: string; error: boolean } | null>(null);

  // Import JSON state
  const [jsonText, setJsonText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedVenues = venuesText
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);

    await updateTournamentInfo({
      name: tournName,
      dates: tournDates,
      location: tournLocation,
      venues: parsedVenues,
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
      window.confirm(
        'Initialize a FRESH SKELETON? This clears all existing scores and sets teams to Seeds 1-20 ready for your actual championship entries.'
      )
    ) {
      await resetToSkeleton();
      alert('Tournament reset to fresh skeleton draw.');
    }
  };

  const handleLoadDemoConfirm = async () => {
    if (
      window.confirm(
        'Load demo sample schools with Ursuline College Chatham (UCC Lancers) and sample scores? You can reset back to skeleton anytime.'
      )
    ) {
      await loadDemoData();
      alert('Sample tournament data loaded.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#0b2341] text-white p-6 rounded-2xl shadow-xs border-b-4 border-sky-400 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-sky-400 text-[#0b2341] text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Convenor Control Center
            </span>
            <span className="text-xs font-semibold text-sky-200">
              Host: Ursuline College Chatham
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white mt-1">
            Tournament Management Backend
          </h2>
          <p className="text-xs text-sky-100/80 mt-0.5">
            Manage qualifying teams, upload logos, record match scores, and adjust settings.
          </p>
        </div>

        {/* Quick Skeleton / Demo triggers */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleResetConfirm}
            className="px-3.5 py-2 rounded-xl text-xs font-black bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center gap-1.5 shadow-2xs transition-colors"
            title="Reset to clean skeleton tournament"
          >
            <RotateCcw className="w-3.5 h-3.5 text-sky-300" />
            <span>Reset to Blank Skeleton</span>
          </button>
          <button
            onClick={handleLoadDemoConfirm}
            className="px-3.5 py-2 rounded-xl text-xs font-black bg-sky-500 hover:bg-sky-400 text-[#0b2341] shadow-2xs flex items-center gap-1.5 transition-colors"
            title="Load demo schools (UCC featured) and scores"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Sample Schools</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveAdminTab('roster')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
            activeAdminTab === 'roster'
              ? 'bg-[#0b2341] text-white shadow-2xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          1. Team Qualification & Logos ({tournament.teams.length})
        </button>
        <button
          onClick={() => setActiveAdminTab('scores')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
            activeAdminTab === 'scores'
              ? 'bg-[#0b2341] text-white shadow-2xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          2. Scorekeeper Matrix ({tournament.matches.length})
        </button>
        <button
          onClick={() => setActiveAdminTab('settings')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
            activeAdminTab === 'settings'
              ? 'bg-[#0b2341] text-white shadow-2xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          3. Settings, Venues & Password
        </button>
        <button
          onClick={() => setActiveAdminTab('backup')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
            activeAdminTab === 'backup'
              ? 'bg-[#0b2341] text-white shadow-2xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          4. Restore & Import JSON
        </button>
      </div>

      {/* TAB 1: TEAM QUALIFICATION & LOGOS */}
      {activeAdminTab === 'roster' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div>
              <h3 className="text-sm font-black text-[#0b2341] uppercase tracking-wider">
                Qualification & Team Logo Manager
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Click any team card to upload a school logo file or paste an image URL, update school name, and assign colors.
              </p>
            </div>
            <div className="text-xs font-bold text-[#0b2341] bg-sky-50 px-3 py-1.5 rounded-xl border border-sky-200">
              {tournament.teams.filter((t) => t.isQualified).length} of {tournament.teams.length} Confirmed
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tournament.teams.map((team) => {
              return (
                <div
                  key={team.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between hover:border-sky-300 transition-all"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <TeamLogo team={team} size="lg" />

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-slate-900 text-sm truncate">
                          {team.schoolName || team.name}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-sky-50 text-sky-900 border border-sky-200">
                          #{team.seed}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="font-bold text-[#0b2341]">{team.poolSlot}</span>
                        <span>•</span>
                        <span>Pool {team.pool}</span>
                        <span>•</span>
                        <span>{team.association}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenTeamModal(team.id)}
                      className="px-3 py-1.5 text-xs font-bold text-[#0b2341] hover:text-sky-800 bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-sky-600" />
                      <span>Edit / Logo</span>
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
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div>
              <h3 className="text-sm font-black text-[#0b2341] uppercase tracking-wider">
                Direct Score Entry Matrix
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Click any match to record set scores. Pool standings and Section 6 tiebreakers compute instantly.
              </p>
            </div>
            <div className="text-xs font-bold text-slate-700 font-mono bg-slate-100 px-3 py-1 rounded-lg">
              Final: {tournament.matches.filter((m) => m.status === 'final').length} / {tournament.matches.length}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {tournament.matches.map((m) => {
              const isFinal = m.status === 'final';
              return (
                <div
                  key={m.id}
                  onClick={() => onOpenScoreModal(m)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isFinal
                      ? 'bg-slate-50 border-slate-200 hover:border-sky-400'
                      : 'bg-white border-slate-200 hover:border-sky-400 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                    <span className="font-bold text-[#0b2341] bg-sky-50 px-2 py-0.5 rounded">
                      {m.pool ? `Pool ${m.pool}` : m.name || m.matchNumber}
                    </span>
                    <span className="font-semibold">{m.time}</span>
                  </div>

                  <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span className="truncate max-w-[120px]">{m.team1Placeholder || m.team1Id}</span>
                    <span className="font-mono text-sm font-black text-[#0b2341]">
                      {isFinal ? `${m.team1SetsWon ?? 0} - ${m.team2SetsWon ?? 0}` : 'vs'}
                    </span>
                    <span className="truncate max-w-[120px] text-right">{m.team2Placeholder || m.team2Id}</span>
                  </div>

                  {m.court && (
                    <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-sky-600" />
                      <span>{m.court}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: SETTINGS, VENUES & PASSWORD */}
      {activeAdminTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tournament General Details */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-[#0b2341] uppercase tracking-wider">
              Championship Information & Venues
            </h3>
            <p className="text-xs text-slate-500">
              Edit the official championship name, dates, host location, and gym venues when ready.
            </p>

            <form onSubmit={handleSaveInfo} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Championship Title</label>
                <input
                  type="text"
                  value={tournName}
                  onChange={(e) => setTournName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Championship Dates</label>
                <input
                  type="text"
                  value={tournDates}
                  onChange={(e) => setTournDates(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Host Location / Region</label>
                <input
                  type="text"
                  value={tournLocation}
                  onChange={(e) => setTournLocation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Editable Venues list */}
              <div>
                <label className="text-slate-700 font-bold block mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-sky-600" />
                  <span>Venues / Gymnasiums (Comma separated, edit or assign anytime)</span>
                </label>
                <input
                  type="text"
                  value={venuesText}
                  onChange={(e) => setVenuesText(e.target.value)}
                  placeholder="e.g. UCC Main Gym, UCC Secondary Gym, St. Clair College"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <span className="text-[11px] text-slate-400 block mt-1">
                  Keep empty for simplified mode or enter courts whenever you are ready to assign venues.
                </span>
              </div>

              {savedSettingsMsg && (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Tournament details updated successfully!</span>
                </div>
              )}

              <button
                type="submit"
                className="px-4 py-2.5 bg-[#0b2341] hover:bg-[#163a66] text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Save className="w-4 h-4 text-sky-400" />
                <span>Save Tournament Details</span>
              </button>
            </form>
          </div>

          {/* Draw Format & Password */}
          <div className="space-y-6">
            {/* Draw Format Switcher */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
              <h3 className="text-sm font-black text-[#0b2341] uppercase tracking-wider">
                Championship Draw Format
              </h3>
              <p className="text-xs text-slate-500">
                Switch between OFSAA standard 20-team draw (4 pools of 5) and 16-team draw (4 pools of 4).
              </p>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Switch to 20-team format? This resets the draw structure.')) {
                      setTournamentFormat('20-team');
                    }
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                    tournament.format === '20-team'
                      ? 'bg-[#0b2341] text-sky-300 shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  20-Team Format (Standard)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Switch to 16-team format? This resets the draw structure.')) {
                      setTournamentFormat('16-team');
                    }
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                    tournament.format === '16-team'
                      ? 'bg-[#0b2341] text-sky-300 shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  16-Team Format
                </button>
              </div>
            </div>

            {/* Convenor Password & Security */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
              <h3 className="text-sm font-black text-[#0b2341] uppercase tracking-wider">
                Convenor Credentials & Security
              </h3>
              <p className="text-xs text-slate-500">
                Update the authorized convenor credentials for this championship.
              </p>

              <form onSubmit={handleUpdatePassword} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Convenor Username</label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Enter new username"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Confirm Password</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                {credMsg && (
                  <div
                    className={`p-2 rounded-lg text-xs flex items-center gap-1.5 ${
                      credMsg.error
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {credMsg.error ? <AlertTriangle className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                    <span>{credMsg.text}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#0b2341] font-bold rounded-lg border border-slate-300 transition-colors flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5 text-sky-600" />
                  <span>Update Credentials</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: RESTORE & IMPORT */}
      {activeAdminTab === 'backup' && (
        <div className="max-w-2xl mx-auto">
          {/* Import JSON */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Upload className="w-5 h-5 text-sky-600" />
              <h3 className="text-base font-black text-[#0b2341]">Import / Restore Tournament</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Restore tournament state from a previous JSON export file or paste raw JSON.
            </p>

            <div>
              <label className="flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-sky-300 hover:border-sky-500 bg-sky-50/50 hover:bg-sky-50 text-xs font-bold text-sky-900 cursor-pointer transition-colors shadow-2xs">
                <Upload className="w-4 h-4 text-sky-600" />
                <span>Upload JSON file from computer</span>
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
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
              <button
                type="button"
                onClick={handleImportJsonPaste}
                disabled={!jsonText.trim()}
                className="mt-2 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg border border-slate-300 disabled:opacity-50 transition-colors"
              >
                Import from Pasted JSON
              </button>
            </div>

            {importStatus && (
              <div className="p-2.5 rounded-lg bg-sky-50 border border-sky-200 text-xs text-sky-900">
                {importStatus}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
