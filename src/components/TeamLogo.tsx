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

  // Size dimensions (substantially enlarged for high visibility)
  const sizeClasses = {
    xs: 'w-7 h-7 text-[10px]',
    sm: 'w-9 h-9 text-xs font-bold',
    md: 'w-12 h-12 text-sm font-extrabold',
    lg: 'w-16 h-16 text-base font-black',
    xl: 'w-24 h-24 text-xl font-black',
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
      <img
        src={logoUrl}
        alt={name || 'Team Logo'}
        className={`${sizeClasses} shrink-0 object-contain drop-shadow-sm select-none ${className}`}
        onError={() => setImageError(true)}
      />
    );
  }

  // Athletic Monogram Badge (clean, borderless)
  return (
    <div
      className={`${sizeClasses} shrink-0 rounded-xl flex items-center justify-center font-black tracking-wider select-none shadow-2xs ${className}`}
      style={{
        backgroundColor: `${accentColor}18`,
        color: accentColor,
      }}
      title={name}
    >
      <span>{getMonogram()}</span>
    </div>
  );
};
