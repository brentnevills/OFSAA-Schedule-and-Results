import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTournament, extractSaveErrorMessage } from '../context/TournamentContext';
import { ONTARIO_ASSOCIATIONS, TEAM_COLOR_PALETTES } from '../data/defaultData';
import { TeamLogo } from './TeamLogo';
import {
  X,
  Check,
  Upload,
  Trash2,
  Globe,
  Palette,
  Award,
  AlertCircle,
  CheckCircle2,
  Clock,
  RotateCcw,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { getPoolAndSlotForSeed } from '../utils/ofsaaTiebreaker';

interface AdminTeamModalProps {
  teamId: string | null;
  onClose: () => void;
  onSaved?: (message: string) => void;
}

function isPlaceholderTeamName(val: string): boolean {
  const trimmed = val.trim();
  if (!trimmed) return true;
  return (
    /^qualifier\s+\d+$/i.test(trimmed) ||
    /^seed\s+\d+(\s*\(tbd\))?$/i.test(trimmed) ||
    trimmed.toLowerCase() === 'tbd'
  );
}

function normalizeLogoUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('./')
  ) {
    return trimmed;
  }
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

async function compressLogoFile(file: File): Promise<string> {
  if (file.size > 15 * 1024 * 1024) {
    throw new Error('Image file is over 15 MB. Please choose a smaller logo image.');
  }

  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the selected image file.'));
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Unsupported image format.'));
      }
    };
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onerror = () =>
      reject(new Error('Could not decode this image file. Please try a PNG, JPG, GIF, WebP, or SVG file.'));
    image.onload = () => resolve(image);
    image.src = rawDataUrl;
  });

  const rawWidth = img.naturalWidth || img.width || 160;
  const rawHeight = img.naturalHeight || img.height || 160;
  const targetBytesLimit = 45_000;
  const sizeSteps = [180, 144, 112];
  const qualitySteps = [0.84, 0.68, 0.52];

  let bestCandidate = '';

  for (const maxDim of sizeSteps) {
    let width = rawWidth;
    let height = rawHeight;

    if (width >= height && width > maxDim) {
      height = Math.max(1, Math.round((height * maxDim) / width));
      width = maxDim;
    } else if (height > width && height > maxDim) {
      width = Math.max(1, Math.round((width * maxDim) / height));
      height = maxDim;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Browser canvas unavailable for logo resizing.');
    }

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    for (const q of qualitySteps) {
      const webpUrl = canvas.toDataURL('image/webp', q);
      if (webpUrl.startsWith('data:image/webp')) {
        bestCandidate = webpUrl;
        if (webpUrl.length <= targetBytesLimit) {
          return webpUrl;
        }
      }
    }

    // Fallback when browser does not support WebP canvas encoding (e.g., older Safari)
    const pngUrl = canvas.toDataURL('image/png');
    bestCandidate = pngUrl;
    if (pngUrl.length <= targetBytesLimit) {
      return pngUrl;
    }

    // Compact JPEG fallback with white background if PNG is still oversized
    const jpegCanvas = document.createElement('canvas');
    jpegCanvas.width = width;
    jpegCanvas.height = height;
    const jCtx = jpegCanvas.getContext('2d');
    if (jCtx) {
      jCtx.fillStyle = '#ffffff';
      jCtx.fillRect(0, 0, width, height);
      jCtx.drawImage(img, 0, 0, width, height);
      const jpegUrl = jpegCanvas.toDataURL('image/jpeg', 0.72);
      if (jpegUrl.length < bestCandidate.length) {
        bestCandidate = jpegUrl;
      }
      if (jpegUrl.length <= targetBytesLimit) {
        return jpegUrl;
      }
    }
  }

  if (!bestCandidate || bestCandidate === 'data:,') {
    throw new Error('Failed to generate compressed logo image.');
  }

  return bestCandidate;
}

export const AdminTeamModal: React.FC<AdminTeamModalProps> = ({ teamId, onClose, onSaved }) => {
  const { teamsMap, saveTeamWithSeed, addTeam, removeTeam, tournament } = useTournament();

  const isNewTeam = teamId === 'new';
  const team = teamId && !isNewTeam ? teamsMap.get(teamId) : null;

  const [seed, setSeed] = useState<number>(1);
  const [schoolName, setSchoolName] = useState('');
  const [teamNickname, setTeamNickname] = useState('');
  const [association, setAssociation] = useState('SWOSSAA');
  const [logoUrl, setLogoUrl] = useState('');
  const [accentColor, setAccentColor] = useState('#0b2341');
  const [isQualified, setIsQualified] = useState(true);
  const [hasTouchedQualified, setHasTouchedQualified] = useState(false);
  const [didTouchLogo, setDidTouchLogo] = useState(false);

  const [isProcessingLogo, setIsProcessingLogo] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [imageLoadStatus, setImageLoadStatus] = useState<'idle' | 'loaded' | 'error'>('idle');

  const [isSaving, setIsSaving] = useState(false);
  const [confirmResetSlot, setConfirmResetSlot] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Collect all known associations (default OFSAA + any previously typed custom affiliations)
  const allKnownAssociations = useMemo(() => {
    const list = [...ONTARIO_ASSOCIATIONS];
    tournament.teams.forEach((t) => {
      if (t.association && t.association.trim() && !list.includes(t.association.trim())) {
        list.push(t.association.trim());
      }
    });
    return list;
  }, [tournament.teams]);

  useEffect(() => {
    if (teamId && !isNewTeam) {
      const currentTeam = teamsMap.get(teamId);
      if (currentTeam) {
        setSeed(currentTeam.seed);
        setSchoolName(currentTeam.schoolName || currentTeam.name || '');
        setTeamNickname(currentTeam.teamNickname || '');
        setAssociation(currentTeam.association || 'SWOSSAA');
        setLogoUrl(currentTeam.logoUrl || '');
        setAccentColor(currentTeam.accentColor || '#0b2341');
        setIsQualified(currentTeam.isQualified !== false);
      }
    } else if (isNewTeam) {
      const unassigned = tournament.teams.find((t) => !t.isQualified);
      setSeed(unassigned ? unassigned.seed : 1);
      setSchoolName('');
      setTeamNickname('');
      setAssociation('SWOSSAA');
      setLogoUrl('');
      setAccentColor('#0b2341');
      setIsQualified(true);
    }
    setHasTouchedQualified(false);
    setDidTouchLogo(false);
    setIsProcessingLogo(false);
    setLogoError(null);
    setImageLoadStatus('idle');
    setConfirmResetSlot(false);
    setSaveError(null);
    setIsSaving(false);
  }, [teamId, isNewTeam]);

  if (!team && !isNewTeam) return null;

  const totalSeedCount = tournament.format === '20-team' ? 20 : 16;
  const availableSeeds = Array.from({ length: totalSeedCount }, (_, i) => i + 1);
  const currentSlotInfo = getPoolAndSlotForSeed(seed, tournament.format);

  const swappedTeam =
    team && seed !== team.seed
      ? tournament.teams.find((t) => t.seed === seed && t.id !== team.id)
      : null;

  const occupiedNewTarget = isNewTeam
    ? tournament.teams.find((t) => t.seed === seed && t.isQualified)
    : null;
  const hasOpenPlaceholder = isNewTeam
    ? tournament.teams.some((t) => !t.isQualified && t.seed !== seed)
    : false;

  const handleSchoolNameChange = (value: string) => {
    setSchoolName(value);
    if (!hasTouchedQualified && !isNewTeam && team && !team.isQualified) {
      setIsQualified(!isPlaceholderTeamName(value));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset input immediately so picking the exact same file again triggers onChange
    e.target.value = '';
    if (!file) return;

    setLogoError(null);
    setSaveError(null);
    setImageLoadStatus('idle');
    setIsProcessingLogo(true);

    try {
      const compressed = await compressLogoFile(file);
      setLogoUrl(compressed);
      setDidTouchLogo(true);
    } catch (err) {
      setLogoError(extractSaveErrorMessage(err));
    } finally {
      setIsProcessingLogo(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving || isProcessingLogo) return;

    setSaveError(null);

    const trimmedSchool = schoolName.trim();
    if (!trimmedSchool) {
      setSaveError('Please enter a School Name before saving.');
      return;
    }

    const trimmedAssociation = association.trim();
    if (!trimmedAssociation) {
      setSaveError('Please enter or select an Association / Affiliation.');
      return;
    }

    const normalizedLogo = normalizeLogoUrl(logoUrl);
    if (
      normalizedLogo &&
      !normalizedLogo.startsWith('http://') &&
      !normalizedLogo.startsWith('https://') &&
      !normalizedLogo.startsWith('data:image/') &&
      !normalizedLogo.startsWith('/') &&
      !normalizedLogo.startsWith('./')
    ) {
      setSaveError(
        'Logo URL must start with https://, http://, or be an uploaded image file.'
      );
      return;
    }

    const fullName = teamNickname.trim()
      ? `${trimmedSchool} ${teamNickname.trim()}`
      : trimmedSchool;

    setIsSaving(true);
    try {
      if (isNewTeam) {
        await addTeam({
          schoolName: trimmedSchool,
          teamNickname: teamNickname.trim(),
          association: trimmedAssociation,
          seed,
          logoUrl: normalizedLogo,
          accentColor,
          isQualified,
        });
        onSaved?.(
          `Added ${trimmedSchool} at Seed #${seed} (${isQualified ? 'Confirmed' : 'Pending TBD'}).`
        );
      } else if (team) {
        await saveTeamWithSeed(
          team.id,
          {
            schoolName: trimmedSchool,
            teamNickname: teamNickname.trim(),
            name: fullName,
            association: trimmedAssociation,
            ...(didTouchLogo ? { logoUrl: normalizedLogo } : {}),
            accentColor,
            isQualified,
          },
          seed
        );
        onSaved?.(
          `Saved ${trimmedSchool} at Seed #${seed} (${isQualified ? 'Confirmed' : 'Pending TBD'}).`
        );
      }

      onClose();
    } catch (err) {
      setSaveError(extractSaveErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetSlot = async () => {
    if (!team || isSaving) return;
    setSaveError(null);
    setIsSaving(true);
    try {
      await removeTeam(team.id);
      onSaved?.(`Reset Seed #${team.seed} (${team.poolSlot}) back to Qualifier ${team.seed} (TBD).`);
      onClose();
    } catch (err) {
      setSaveError(extractSaveErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const isUploadedDataLogo = logoUrl.startsWith('data:image');
  const uploadedLogoKb = isUploadedDataLogo
    ? Math.max(1, Math.round(logoUrl.length / 1024))
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-800">
        {/* Modal Header */}
        <div className="bg-[#0b2341] text-white px-6 py-4 flex items-center justify-between border-b-2 border-sky-400">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-sky-400/20 text-sky-200 border border-sky-400/40 px-2 py-0.5 rounded">
                Seed #{seed} • {currentSlotInfo.slot}
              </span>
              <span className="text-xs text-sky-200">Pool {currentSlotInfo.pool}</span>
            </div>
            <h3 className="text-lg font-extrabold text-white mt-1">
              {isNewTeam ? 'Add Tournament Team' : 'Configure Team & Seeding'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} noValidate className="p-6 overflow-y-auto space-y-5">
          {/* Live Badge & Logo Preview */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center gap-4">
            <TeamLogo
              logoUrl={normalizeLogoUrl(logoUrl)}
              name={schoolName || `Seed ${seed}`}
              seed={seed}
              accentColor={accentColor}
              size="xl"
              onImageStatusChange={setImageLoadStatus}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Live Preview
                </span>
                {isQualified ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Confirmed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                    <Clock className="w-3 h-3 text-amber-600" />
                    Pending (TBD)
                  </span>
                )}
              </div>
              <div className="text-base font-bold text-slate-900 truncate mt-0.5">
                {schoolName || `Seed #${seed} (TBD)`} {teamNickname}
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                <span>{association || 'Association'}</span>
                <span>•</span>
                <span>
                  Seed #{seed} ({currentSlotInfo.slot})
                </span>
              </div>
            </div>
          </div>

          {/* Championship Seed # Selector */}
          <div className="bg-sky-50 border border-sky-200 p-3.5 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#0b2341] flex items-center gap-1.5">
                <Award className="w-4 h-4 text-sky-600" />
                <span>Championship Seed # (1 - {totalSeedCount})</span>
              </label>
              <span className="text-[11px] font-bold text-sky-800 bg-white border border-sky-300 px-2 py-0.5 rounded">
                Pool {currentSlotInfo.pool} • Slot {currentSlotInfo.slot}
              </span>
            </div>

            <select
              value={seed}
              onChange={(e) => setSeed(Number(e.target.value))}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {availableSeeds.map((s) => {
                const other = tournament.teams.find((t) => t.seed === s && t.id !== team?.id);
                const otherLabel = other
                  ? other.isQualified
                    ? other.schoolName
                    : other.schoolName && !isPlaceholderTeamName(other.schoolName)
                    ? `${other.schoolName} (Pending)`
                    : `Qualifier ${s}`
                  : '';
                return (
                  <option key={s} value={s}>
                    Seed #{s} {otherLabel ? `— ${otherLabel}` : ''}
                  </option>
                );
              })}
            </select>

            {swappedTeam && (
              <div className="flex items-start gap-1.5 text-[11px] text-sky-900 bg-white/70 p-2 rounded-lg border border-sky-200">
                <AlertCircle className="w-3.5 h-3.5 text-sky-700 shrink-0 mt-0.5" />
                <span>
                  Changing seed to <strong>#{seed}</strong> will swap draw positions with{' '}
                  <strong>{swappedTeam.schoolName || swappedTeam.name}</strong> (who will take Seed #
                  {team?.seed}).
                </span>
              </div>
            )}

            {occupiedNewTarget && (
              <div className="flex items-start gap-1.5 text-[11px] text-amber-900 bg-amber-50 p-2 rounded-lg border border-amber-200">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Seed #{seed} currently holds <strong>{occupiedNewTarget.schoolName}</strong>.{' '}
                  {hasOpenPlaceholder
                    ? 'Saving will move them to an open TBD seed slot.'
                    : 'All seed slots are full, so saving will replace that entry.'}
                </span>
              </div>
            )}
          </div>

          {/* School Name */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              School Name *
            </label>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => handleSchoolNameChange(e.target.value)}
              placeholder="e.g. Ursuline College Chatham"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
            />
          </div>

          {/* Prominent Qualification Confirmation Toggle */}
          <div
            className={`p-3.5 rounded-xl border transition-colors ${
              isQualified
                ? 'bg-emerald-50/70 border-emerald-200'
                : 'bg-amber-50/70 border-amber-200'
            }`}
          >
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isQualified}
                onChange={(e) => {
                  setHasTouchedQualified(true);
                  setIsQualified(e.target.checked);
                }}
                className="w-4 h-4 mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
              />
              <div className="flex-1">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <span>School has officially confirmed qualification</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  {isQualified
                    ? 'Shown as Confirmed in standings, seeding tables, and championship progress count.'
                    : 'Shown as Pending (TBD) until qualification is confirmed.'}
                </p>
              </div>
            </label>
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
              placeholder="e.g. Lancers, Crusaders, Saints"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
            />
          </div>

          {/* Association / Affiliation */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 block">
                Association / Affiliation *
              </label>
              <span className="text-[11px] text-slate-400">Select preset or type custom</span>
            </div>

            <div className="relative">
              <input
                type="text"
                list="association-presets"
                value={association}
                onChange={(e) => setAssociation(e.target.value)}
                placeholder="Type or select affiliation (e.g. SWOSSAA, CISAA, Independent)"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
              />
              <datalist id="association-presets">
                {allKnownAssociations.map((assoc) => (
                  <option key={assoc} value={assoc} />
                ))}
              </datalist>
            </div>

            {/* Quick-select chips */}
            <div className="pt-1">
              <span className="text-[10px] font-semibold text-slate-400 block mb-1">
                Quick-Select Common Associations:
              </span>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1.5 bg-slate-50 rounded-lg border border-slate-200">
                {allKnownAssociations.map((assoc) => (
                  <button
                    type="button"
                    key={assoc}
                    onClick={() => setAssociation(assoc)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                      association.trim().toUpperCase() === assoc.toUpperCase()
                        ? 'bg-[#0b2341] text-sky-300 ring-1 ring-sky-400 shadow-2xs'
                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {assoc}
                  </button>
                ))}
              </div>
            </div>
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
                  onClick={() => {
                    setLogoUrl('');
                    setDidTouchLogo(true);
                    setLogoError(null);
                    setImageLoadStatus('idle');
                  }}
                  className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Logo</span>
                </button>
              )}
            </div>

            {/* Upload Box */}
            <label
              className={`flex items-center justify-center gap-2.5 p-3 rounded-xl border-2 border-dashed text-xs font-bold cursor-pointer transition-colors shadow-2xs ${
                isProcessingLogo
                  ? 'border-sky-400 bg-sky-100/70 text-sky-900 cursor-wait'
                  : 'border-sky-300 hover:border-sky-500 bg-sky-50/50 hover:bg-sky-50 text-sky-900'
              }`}
            >
              {isProcessingLogo ? (
                <>
                  <Loader2 className="w-4 h-4 text-sky-600 animate-spin" />
                  <span>Optimizing logo for cloud sync...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 text-sky-600" />
                  <span>Click to Upload School Logo Image (PNG, JPG, WebP, SVG)</span>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={isProcessingLogo}
                className="hidden"
              />
            </label>

            {isUploadedDataLogo && (
              <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-800">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Uploaded logo ready &amp; optimized (~{uploadedLogoKb} KB)</span>
                </span>
                <span className="text-[10px] text-emerald-700 font-bold">Preview shown above</span>
              </div>
            )}

            {logoError && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-700">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                <span>{logoError}</span>
              </div>
            )}

            {/* Direct Image URL input (type="text" avoids silent native browser blocks) */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Globe className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={isUploadedDataLogo ? '' : logoUrl}
                onChange={(e) => {
                  setLogoError(null);
                  setDidTouchLogo(true);
                  setLogoUrl(e.target.value);
                }}
                placeholder={
                  isUploadedDataLogo
                    ? 'Uploaded image active — paste a web URL here to replace it'
                    : 'Or paste direct image web link (e.g. https://.../logo.png)'
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
              />
            </div>

            {!isUploadedDataLogo && logoUrl.trim() && imageLoadStatus === 'error' && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Preview could not load this URL yet. Ensure it points directly to an image file
                  (.png, .jpg, .svg, .webp) or upload the image file above.
                </span>
              </div>
            )}
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

          {saveError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>Failed to save: {saveError}</span>
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
            {!isNewTeam && team ? (
              confirmResetSlot ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleResetSlot}
                    disabled={isSaving}
                    className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors disabled:opacity-50"
                  >
                    {isSaving ? 'Resetting...' : 'Confirm Reset to TBD'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmResetSlot(false)}
                    disabled={isSaving}
                    className="text-[11px] font-semibold px-2 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
                  >
                    Keep
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmResetSlot(true)}
                  disabled={isSaving}
                  className="text-xs font-semibold text-slate-500 hover:text-rose-700 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 flex items-center gap-1 transition-colors disabled:opacity-50"
                  title="Clear school details and reset slot to TBD"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Slot</span>
                </button>
              )
            ) : (
              <span />
            )}

            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || isProcessingLogo}
                className="text-xs font-bold text-white px-5 py-2.5 rounded-lg bg-[#0b2341] hover:bg-[#163a66] shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4 text-sky-400" />
                <span>
                  {isProcessingLogo
                    ? 'Optimizing Logo...'
                    : isSaving
                    ? 'Saving...'
                    : isNewTeam
                    ? 'Add Team to Draw'
                    : 'Save Team & Seeding'}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
