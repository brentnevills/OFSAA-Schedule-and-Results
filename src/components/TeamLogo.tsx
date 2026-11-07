import React, { useState } from 'react';
import { Team } from '../types/tournament';

interface TeamLogoProps {
  team?: Team | null;
  logoUrl?: string;
  name?: string;
  seed?: number;
  accentColor?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const TeamLogo: React.FC<TeamLogoProps> = ({
  team,
  logoUrl: explicitLogoUrl,
  name: explicitName,
  seed: explicitSeed,
  accentColor: explicitColor,
  size = 'md',
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);

  const logoUrl = explicitLogoUrl !== undefined ? explicitLogoUrl : team?.logoUrl;
  const name = explicitName || team?.schoolName || team?.name || '';
  const seed = explicitSeed !== undefined ? explicitSeed : team?.seed;
  const accentColor = explicitColor || team?.accentColor || '#0b2341';

  // Size dimensions
  const sizeClasses = {
    xs: 'w-5 h-5 text-[9px]',
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-11 h-11 text-sm',
    xl: 'w-14 h-14 text-base font-bold',
  }[size];

  // Generate clean 2-3 letter monogram from school/team name
  const getMonogram = () => {
    if (!name) return seed ? `S${seed}` : 'VB';

    // If it's a skeleton team like "Seed 1 (TBD)" or "Qualifier 1"
    if (name.toLowerCase().includes('seed') || name.toLowerCase().includes('qualifier') || name.toLowerCase().includes('tbd')) {
      return seed ? `S${seed}` : 'TBD';
    }

    const words = name.replace(/[^a-zA-Z0-9\s]/g, '').trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].substring(0, 3).toUpperCase();
    }
    if (words.length === 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    // 3 or more words (e.g. Ursuline College Chatham -> UCC, St Anne Catholic -> SAC)
    return (words[0][0] + words[1][0] + words[2][0]).toUpperCase();
  };

  const isImageLogo = logoUrl && (logoUrl.startsWith('http') || logoUrl.startsWith('data:image') || logoUrl.startsWith('/'));

  if (isImageLogo && !imageError) {
    return (
      <div
        className={`${sizeClasses} shrink-0 rounded-lg overflow-hidden bg-white border border-slate-200 p-0.5 flex items-center justify-center shadow-2xs ${className}`}
        style={{ borderColor: `${accentColor}40` }}
      >
        <img
          src={logoUrl}
          alt={name || 'Team Logo'}
          className="w-full h-full object-contain"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  // Athletic Monogram Badge
  return (
    <div
      className={`${sizeClasses} shrink-0 rounded-lg flex items-center justify-center font-extrabold tracking-wider border shadow-2xs select-none transition-transform ${className}`}
      style={{
        backgroundColor: `${accentColor}18`,
        borderColor: `${accentColor}55`,
        color: accentColor,
      }}
      title={name}
    >
      <span>{getMonogram()}</span>
    </div>
  );
};
