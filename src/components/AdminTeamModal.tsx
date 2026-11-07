import React, { useState, useEffect } from 'react';
import { useTournament } from '../context/TournamentContext';
import { ONTARIO_ASSOCIATIONS, TEAM_COLOR_PALETTES } from '../data/defaultData';
import { TeamLogo } from './TeamLogo';
import { X, Check, Upload, Trash2, Globe, Palette } from 'lucide-react';

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
  const [accentColor, setAccentColor] = useState('#0b2341');
  const [isQualified, setIsQualified] = useState(true);

  const team = teamId ? teamsMap.get(teamId) : null;

  useEffect(() => {
    if (team) {
      setSchoolName(team.schoolName || team.name || '');
      setTeamNickname(team.teamNickname || '');
      setAssociation(team.association || 'SWOSSAA');
      setLogoUrl(team.logoUrl || '');
      setAccentColor(team.accentColor || '#0b2341');
      setIsQualified(team.isQualified !== false);
    }
  }, [team]);

  if (!team) return null;

  // Handle local image upload with lightweight client-side compression
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        // Resize to maximum 240x240 for crisp performance in tournament state
        const canvas = document.createElement('canvas');
        const maxDim = 240;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/png');
          setLogoUrl(dataUrl);
        }
      };
      if (typeof event.target?.result === 'string') {
        img.src = event.target.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team) return;

    const trimmedSchool = schoolName.trim() || `Seed ${team.seed} (TBD)`;
    const fullName = teamNickname.trim()
      ? `${trimmedSchool} ${teamNickname.trim()}`
      : trimmedSchool;

    await updateTeam(team.id, {
      schoolName: trimmedSchool,
      teamNickname: teamNickname.trim(),
      name: fullName,
      association,
      logoUrl: logoUrl.trim(),
      accentColor,
      isQualified,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-800">
        {/* Modal Header */}
        <div className="bg-[#0b2341] text-white px-6 py-4 flex items-center justify-between border-b-2 border-sky-400">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-sky-400/20 text-sky-200 border border-sky-400/40 px-2 py-0.5 rounded">
                Seed #{team.seed} • {team.poolSlot}
              </span>
              <span className="text-xs text-sky-200">Pool {team.pool}</span>
            </div>
            <h3 className="text-lg font-extrabold text-white mt-1">Configure Team & Logo</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5">
          {/* Live Badge & Logo Preview */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center gap-4">
            <TeamLogo
              logoUrl={logoUrl}
              name={schoolName || `Seed ${team.seed}`}
              seed={team.seed}
              accentColor={accentColor}
              size="xl"
            />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Live Preview
              </div>
              <div className="text-base font-bold text-slate-900 truncate">
                {schoolName || `Seed #${team.seed} (TBD)`} {teamNickname}
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                <span>{association}</span>
                <span>•</span>
                <span>Pool {team.pool}</span>
              </div>
            </div>
          </div>

          {/* School Name */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              School Name *
            </label>
            <input
              type="text"
              required
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="e.g. Ursuline College Chatham"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
            />
          </div>

          {/* Team Nickname / Mascot */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Team Nickname / Mascot (Optional)
            </label>
            <input
              type="text"
              value={teamNickname}
              onChange={(e) => setTeamNickname(e.target.value)}
              placeholder="e.g. Lancers, Flyers, Saints"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
            />
          </div>

          {/* Association */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              OFSAA Member Association *
            </label>
            <select
              value={association}
              onChange={(e) => setAssociation(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
            >
              {ONTARIO_ASSOCIATIONS.map((assoc) => (
                <option key={assoc} value={assoc}>
                  {assoc}
                </option>
              ))}
            </select>
          </div>

          {/* Easy Team Logo Insertion */}
          <div className="space-y-2.5 pt-1 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 block">
                Team Logo (Image Upload or Web URL)
              </label>
              {logoUrl && (
                <button
                  type="button"
                  onClick={() => setLogoUrl('')}
                  className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Logo</span>
                </button>
              )}
            </div>

            {/* Upload Box */}
            <label className="flex items-center justify-center gap-2.5 p-3 rounded-xl border-2 border-dashed border-sky-300 hover:border-sky-500 bg-sky-50/50 hover:bg-sky-50 text-xs font-bold text-sky-900 cursor-pointer transition-colors shadow-2xs">
              <Upload className="w-4 h-4 text-sky-600" />
              <span>Click to Upload School Logo Image (PNG, JPG, SVG)</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {/* Direct Image URL input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Globe className="w-4 h-4" />
              </div>
              <input
                type="url"
                value={logoUrl.startsWith('data:') ? '' : logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="Or paste image web link (e.g. https://.../logo.png)"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Tip: If no image is provided, a crisp athletic monogram badge will display automatically.
            </p>
          </div>

          {/* Athletic Color Selection */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-slate-500" />
                <span>Primary Athletic Color</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-7 h-7 rounded border border-slate-300 bg-transparent cursor-pointer"
                />
                <span className="text-xs font-mono text-slate-600 font-semibold">{accentColor}</span>
              </div>
            </div>

            {/* Preset Color Swatches */}
            <div className="grid grid-cols-6 gap-2 pt-1">
              {TEAM_COLOR_PALETTES.map((palette) => (
                <button
                  type="button"
                  key={palette.label}
                  onClick={() => setAccentColor(palette.primary)}
                  className={`h-7 rounded-lg border-2 transition-all flex items-center justify-center ${
                    accentColor.toLowerCase() === palette.primary.toLowerCase()
                      ? 'ring-2 ring-sky-500 border-white shadow-xs scale-105'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: palette.primary }}
                  title={palette.label}
                />
              ))}
            </div>
          </div>

          {/* Qualified Checkbox */}
          <div className="pt-2 border-t border-slate-200">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isQualified}
                onChange={(e) => setIsQualified(e.target.checked)}
                className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300"
              />
              <span className="text-xs font-semibold text-slate-700">
                School has officially confirmed qualification
              </span>
            </label>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="text-xs font-bold text-white px-5 py-2.5 rounded-lg bg-[#0b2341] hover:bg-[#163a66] shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Check className="w-4 h-4 text-sky-400" />
              <span>Save Team</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
