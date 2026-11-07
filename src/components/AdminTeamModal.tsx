import React, { useState, useEffect } from 'react';
import { Team } from '../types/tournament';
import { useTournament } from '../context/TournamentContext';
import { ONTARIO_ASSOCIATIONS, LOGO_PRESETS } from '../data/defaultData';
import { X, Check, Upload, Image, Sparkles } from 'lucide-react';

interface AdminTeamModalProps {
  teamId: string | null;
  onClose: () => void;
}

export const AdminTeamModal: React.FC<AdminTeamModalProps> = ({ teamId, onClose }) => {
  const { teamsMap, updateTeam } = useTournament();

  const [schoolName, setSchoolName] = useState('');
  const [teamNickname, setTeamNickname] = useState('');
  const [association, setAssociation] = useState('SWOSSAA');
  const [logoUrl, setLogoUrl] = useState('');
  const [accentColor, setAccentColor] = useState('#f59e0b');
  const [isQualified, setIsQualified] = useState(true);

  const team = teamId ? teamsMap.get(teamId) : null;

  useEffect(() => {
    if (team) {
      setSchoolName(team.schoolName || team.name || '');
      setTeamNickname(team.teamNickname || '');
      setAssociation(team.association || 'SWOSSAA');
      setLogoUrl(team.logoUrl || '🏐');
      setAccentColor(team.accentColor || '#f59e0b');
      setIsQualified(team.isQualified !== false);
    }
  }, [team]);

  if (!team) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setLogoUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team) return;

    const trimmedSchool = schoolName.trim() || `Seed #${team.seed} Qualifier`;
    const fullName = teamNickname.trim()
      ? `${trimmedSchool} ${teamNickname.trim()}`
      : trimmedSchool;

    await updateTeam(team.id, {
      schoolName: trimmedSchool,
      teamNickname: teamNickname.trim(),
      name: fullName,
      association,
      logoUrl,
      accentColor,
      isQualified,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-800/90 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded">
                Seed #{team.seed} • {team.poolSlot}
              </span>
              <span className="text-xs text-slate-400">Pool {team.pool}</span>
            </div>
            <h3 className="text-lg font-black text-white mt-1">Configure Qualified Team</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5">
          {/* School Name */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              School Name *
            </label>
            <input
              type="text"
              required
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="e.g. St. Anne Catholic High School"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Team Nickname / Mascot */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Mascot / Nickname (Optional)
            </label>
            <input
              type="text"
              value={teamNickname}
              onChange={(e) => setTeamNickname(e.target.value)}
              placeholder="e.g. Saints, Crusaders, Flyers"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Association */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              OFSAA Member Association *
            </label>
            <select
              value={association}
              onChange={(e) => setAssociation(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {ONTARIO_ASSOCIATIONS.map((assoc) => (
                <option key={assoc} value={assoc}>
                  {assoc}
                </option>
              ))}
            </select>
          </div>

          {/* Team Logo / Badge */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-300 block">
              Team Logo or Mascot Emblem
            </label>

            {/* Current Preview */}
            <div className="flex items-center gap-4 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold shrink-0 border-2 shadow-inner"
                style={{
                  backgroundColor: `${accentColor}33`,
                  borderColor: accentColor,
                }}
              >
                {logoUrl?.startsWith('data:') || logoUrl?.startsWith('http') ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <span>{logoUrl || '🏐'}</span>
                )}
              </div>
              <div className="flex-1 text-xs">
                <span className="font-semibold text-slate-200 block">
                  {schoolName || 'Team Name'}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Assigned to Pool {team.pool} ({team.poolSlot})
                </span>
              </div>
            </div>

            {/* File Upload Button */}
            <div>
              <label className="flex items-center justify-center gap-2 p-2.5 rounded-lg border border-dashed border-slate-700 hover:border-amber-500 bg-slate-950/40 text-xs text-slate-300 hover:text-white cursor-pointer transition-colors">
                <Upload className="w-4 h-4 text-amber-400" />
                <span>Upload Logo Image from Computer</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Direct Image URL input */}
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={logoUrl.startsWith('data:') ? '' : logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="Or paste image web URL (https://...)"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Preset Mascot Pickers */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                Or pick standard sports emblem:
              </span>
              <div className="grid grid-cols-6 gap-2">
                {LOGO_PRESETS.map((preset) => (
                  <button
                    type="button"
                    key={preset.label}
                    onClick={() => {
                      setLogoUrl(preset.icon);
                      setAccentColor(preset.color);
                    }}
                    className={`p-2 rounded-lg text-lg flex items-center justify-center border transition-all ${
                      logoUrl === preset.icon
                        ? 'bg-amber-500/20 border-amber-500 shadow-sm'
                        : 'bg-slate-950 border-slate-800 hover:bg-slate-800'
                    }`}
                    title={preset.label}
                  >
                    <span>{preset.icon}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Accent Color */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-400">Team Jersey / Accent Color:</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                />
                <span className="text-xs font-mono text-slate-400">{accentColor}</span>
              </div>
            </div>
          </div>

          {/* Qualified Checkbox */}
          <div className="pt-2 border-t border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isQualified}
                onChange={(e) => setIsQualified(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-slate-700 bg-slate-950"
              />
              <span className="text-xs font-semibold text-slate-300">
                Mark team as officially qualified for tournament
              </span>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-300 hover:text-white px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="text-xs font-bold text-slate-950 px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Save Team</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
