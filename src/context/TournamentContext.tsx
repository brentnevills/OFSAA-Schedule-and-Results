import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Match, MatchStatus, PoolId, SetScore, Team, TeamStanding, TournamentData, TournamentFormat } from '../types/tournament';
import { calculatePoolStandings, calculateSetsAndPoints } from '../utils/ofsaaTiebreaker';
import { createDemoTournament, createSkeletonTournament, assignDefaultCourts, DEFAULT_VENUES } from '../data/defaultData';

interface TournamentContextType {
  tournament: TournamentData;
  isAdmin: boolean;
  adminUsername: string;
  loginError: string | null;
  isLoading: boolean;
  login: (user: string, pass: string) => Promise<boolean>;
  logout: () => void;
  updateTeam: (teamId: string, updates: Partial<Team>) => Promise<void>;
  updateTeamSeed: (teamId: string, newSeed: number) => Promise<void>;
  addTeam: (teamData: { schoolName: string; teamNickname?: string; association?: string; seed?: number; logoUrl?: string; accentColor?: string; isQualified?: boolean }) => Promise<void>;
  removeTeam: (teamId: string) => Promise<void>;
  updateMatchScore: (matchId: string, sets: SetScore[], status?: MatchStatus, notes?: string, court?: string) => Promise<void>;
  updateMatch: (matchId: string, updates: Partial<Match>) => Promise<void>;
  updateMatchCourt: (matchId: string, court: string) => Promise<void>;
  updateVenues: (venues: string[], applyToMatches?: boolean) => Promise<void>;
  applyVenuesToSchedule: (venues?: string[]) => Promise<void>;
  resetMatchScore: (matchId: string) => Promise<void>;
  setTournamentFormat: (format: TournamentFormat) => Promise<void>;
  resetToSkeleton: () => Promise<void>;
  loadDemoData: () => Promise<void>;
  importTournamentJson: (jsonString: string) => Promise<boolean>;
  updateTournamentInfo: (info: Partial<TournamentData>) => Promise<void>;
  standingsByPool: Record<PoolId, TeamStanding[]>;
  teamsMap: Map<string, Team>;
  matchesMap: Map<string, Match>;
  updateCredentials: (newUsername: string, newPassword: string) => Promise<void>;
}

const TournamentContext = createContext<TournamentContextType | null>(null);

const STORAGE_KEY = 'ofsaa_boys_aaa_2026_v3';
const AUTH_KEY = 'ofsaa_convenor_session';

// Clean up any lingering admin keys from localStorage so entering users are strictly in public mode
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('ofsaa_admin_token');
    localStorage.removeItem('ofsaa_convenor_session');
  } catch {}
}

export const TournamentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tournament, setTournament] = useState<TournamentData>(() => {
    // Initial check in localStorage
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem(STORAGE_KEY);
      if (local) {
        try {
          const parsed = JSON.parse(local);
          if (!parsed.venues || parsed.venues.length === 0) {
            parsed.venues = [...DEFAULT_VENUES];
          }
          if (parsed.matches && parsed.matches.some((m: Match) => !m.court || m.court === '')) {
            parsed.matches = assignDefaultCourts(parsed.matches, parsed.venues);
          }
          return parsed;
        } catch {
          // ignore error
        }
      }
    }
    return createSkeletonTournament('20-team');
  });

  // Always default to false for any new visitor / tab (sessionStorage only)
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('ofsaa_admin_token');
        return Boolean(sessionStorage.getItem(AUTH_KEY));
      } catch {
        return false;
      }
    }
    return false;
  });

  const [adminUsername, setAdminUsername] = useState<string>('convenor');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync with server on mount and continuously via polling + visibility listener
  useEffect(() => {
    let isMounted = true;

    async function fetchFromServer() {
      try {
        const res = await fetch('/api/tournament', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data && data.teams && data.matches && isMounted) {
            if (!data.venues || data.venues.length === 0) {
              data.venues = [...DEFAULT_VENUES];
            }
            if (data.matches.some((m: Match) => !m.court || m.court === '')) {
              data.matches = assignDefaultCourts(data.matches, data.venues);
            }
            setTournament((prev) => {
              // If incoming server data is newer or local is uninitialized, update
              if (!prev.lastUpdated || (data.lastUpdated && new Date(data.lastUpdated) > new Date(prev.lastUpdated))) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
                return data;
              }
              return prev;
            });
          }
        }
      } catch (e) {
        console.warn('Backend API sync notice:', e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    // Initial load
    fetchFromServer();

    // 10-second interval polling for multi-device live sync
    const pollTimer = setInterval(fetchFromServer, 10000);

    // Sync when tab becomes active / window focused (e.g. coach unlocking phone)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchFromServer();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', fetchFromServer);

    return () => {
      isMounted = false;
      clearInterval(pollTimer);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', fetchFromServer);
    };
  }, []);

  // Save changes to both API and localStorage
  const saveTournament = async (newTournament: TournamentData) => {
    newTournament.lastUpdated = new Date().toISOString();
    setTournament(newTournament);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTournament));

    try {
      const res = await fetch('/api/tournament', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTournament),
      });
      if (res.ok) {
        const result = await res.json();
        if (result && result.data) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(result.data));
        }
      }
    } catch (err) {
      console.warn('Saved locally, offline or background server write issue:', err);
    }
  };

  const teamsMap = useMemo(() => {
    const map = new Map<string, Team>();
    for (const team of tournament.teams) {
      map.set(team.id, team);
    }
    return map;
  }, [tournament.teams]);

  const matchesMap = useMemo(() => {
    const map = new Map<string, Match>();
    for (const m of tournament.matches) {
      map.set(m.id, m);
    }
    return map;
  }, [tournament.matches]);

  // Compute standings for all pools
  const standingsByPool = useMemo(() => {
    return {
      A: calculatePoolStandings('A', tournament.teams, tournament.matches, tournament.format),
      B: calculatePoolStandings('B', tournament.teams, tournament.matches, tournament.format),
      C: calculatePoolStandings('C', tournament.teams, tournament.matches, tournament.format),
      D: calculatePoolStandings('D', tournament.teams, tournament.matches, tournament.format),
    };
  }, [tournament.teams, tournament.matches, tournament.format]);

  // Automatically advance pool qualifiers to Playoff Brackets ONLY when statistically certain
  useEffect(() => {
    const s = standingsByPool;

    // Helper: only return teamId if team has statistically clinched that exact seed, or pool is 100% complete
    const getClinchedTeamId = (poolId: PoolId, targetRank: number): string => {
      const poolMatches = tournament.matches.filter((m) => m.pool === poolId && m.stage === 'pool');
      const allComplete = poolMatches.length > 0 && poolMatches.every((m) => m.status === 'final');

      const teamStanding = s[poolId]?.[targetRank - 1];
      if (!teamStanding) return 'TBD';

      // If all matches in pool are complete, final rank is certain
      if (allComplete) {
        return teamStanding.teamId;
      }

      // If intermediate, check if team has clinched this exact rank
      if (teamStanding.clinchedRank === targetRank) {
        return teamStanding.teamId;
      }

      return 'TBD';
    };

    const a1 = getClinchedTeamId('A', 1);
    const a2 = getClinchedTeamId('A', 2);
    const a3 = getClinchedTeamId('A', 3);
    const a4 = getClinchedTeamId('A', 4);

    const b1 = getClinchedTeamId('B', 1);
    const b2 = getClinchedTeamId('B', 2);
    const b3 = getClinchedTeamId('B', 3);
    const b4 = getClinchedTeamId('B', 4);

    const c1 = getClinchedTeamId('C', 1);
    const c2 = getClinchedTeamId('C', 2);
    const c3 = getClinchedTeamId('C', 3);
    const c4 = getClinchedTeamId('C', 4);

    const d1 = getClinchedTeamId('D', 1);
    const d2 = getClinchedTeamId('D', 2);
    const d3 = getClinchedTeamId('D', 3);
    const d4 = getClinchedTeamId('D', 4);

    let hasChanges = false;
    const updatedMatches = tournament.matches.map((match) => {
      let t1 = match.team1Id;
      let t2 = match.team2Id;

      // Consolation QF
      if (match.id === 'CQF-1') {
        t1 = a3 || 'TBD';
        t2 = b4 || 'TBD';
      } else if (match.id === 'CQF-2') {
        t1 = d3 || 'TBD';
        t2 = c4 || 'TBD';
      } else if (match.id === 'CQF-3') {
        t1 = c3 || 'TBD';
        t2 = d4 || 'TBD';
      } else if (match.id === 'CQF-4') {
        t1 = b3 || 'TBD';
        t2 = a4 || 'TBD';
      }
      // Championship QF
      else if (match.id === 'HQF-1') {
        t1 = a1 || 'TBD';
        t2 = b2 || 'TBD';
      } else if (match.id === 'HQF-2') {
        t1 = d1 || 'TBD';
        t2 = c2 || 'TBD';
      } else if (match.id === 'HQF-3') {
        t1 = c1 || 'TBD';
        t2 = d2 || 'TBD';
      } else if (match.id === 'HQF-4') {
        t1 = b1 || 'TBD';
        t2 = a2 || 'TBD';
      }

      if (t1 !== match.team1Id || t2 !== match.team2Id) {
        hasChanges = true;
        return { ...match, team1Id: t1, team2Id: t2 };
      }
      return match;
    });

    // Advance semifinal winners
    const getWinner = (mId: string) => {
      const m = updatedMatches.find((x) => x.id === mId);
      return m?.status === 'final' ? m.winnerId : 'TBD';
    };
    const getLoser = (mId: string) => {
      const m = updatedMatches.find((x) => x.id === mId);
      return m?.status === 'final' ? m.loserId : 'TBD';
    };

    const finalMatches = updatedMatches.map((match) => {
      let t1 = match.team1Id;
      let t2 = match.team2Id;

      if (match.id === 'CSF-1') {
        t1 = getWinner('CQF-1') || 'TBD';
        t2 = getWinner('CQF-2') || 'TBD';
      } else if (match.id === 'CSF-2') {
        t1 = getWinner('CQF-3') || 'TBD';
        t2 = getWinner('CQF-4') || 'TBD';
      } else if (match.id === 'HSF-1') {
        t1 = getWinner('HQF-1') || 'TBD';
        t2 = getWinner('HQF-2') || 'TBD';
      } else if (match.id === 'HSF-2') {
        t1 = getWinner('HQF-3') || 'TBD';
        t2 = getWinner('HQF-4') || 'TBD';
      } else if (match.id === 'CFIN') {
        t1 = getWinner('CSF-1') || 'TBD';
        t2 = getWinner('CSF-2') || 'TBD';
      } else if (match.id === 'BRONZE') {
        t1 = getLoser('HSF-1') || 'TBD';
        t2 = getLoser('HSF-2') || 'TBD';
      } else if (match.id === 'GOLD') {
        t1 = getWinner('HSF-1') || 'TBD';
        t2 = getWinner('HSF-2') || 'TBD';
      }

      if (t1 !== match.team1Id || t2 !== match.team2Id) {
        hasChanges = true;
        return { ...match, team1Id: t1, team2Id: t2 };
      }
      return match;
    });

    if (hasChanges) {
      saveTournament({ ...tournament, matches: finalMatches });
    }
  }, [standingsByPool]);

  const login = async (user: string, pass: string): Promise<boolean> => {
    setLoginError(null);
    try {
      // First try server authentication
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass }),
      });

      if (res.ok) {
        const body = await res.json();
        sessionStorage.setItem(AUTH_KEY, body.token);
        setIsAdmin(true);
        setAdminUsername(body.username || user);
        return true;
      }
    } catch {
      // Server error/static fallback
    }

    // Local fallback check
    const currentPass = tournament.adminPasswordHash || 'ofsaa2026';
    const currentAdmin = tournament.adminUsername || 'convenor';
    if (
      (user === currentAdmin || user === 'convenor') &&
      (pass === currentPass || pass === 'ofsaa2026')
    ) {
      sessionStorage.setItem(AUTH_KEY, 'local-token');
      setIsAdmin(true);
      setAdminUsername(user);
      return true;
    }

    setLoginError('Invalid convenor username or password.');
    return false;
  };

  const logout = () => {
    try {
      sessionStorage.removeItem(AUTH_KEY);
      localStorage.removeItem('ofsaa_admin_token');
      localStorage.removeItem('ofsaa_convenor_session');
    } catch {}
    setIsAdmin(false);
  };

  const updateTeam = async (teamId: string, updates: Partial<Team>) => {
    const updatedTeams = tournament.teams.map((t) => (t.id === teamId ? { ...t, ...updates } : t));
    await saveTournament({ ...tournament, teams: updatedTeams });
  };

  const updateTeamSeed = async (teamId: string, newSeed: number) => {
    const currentTeam = tournament.teams.find((t) => t.id === teamId);
    if (!currentTeam || currentTeam.seed === newSeed) return;

    const otherTeam = tournament.teams.find((t) => t.seed === newSeed && t.id !== teamId);

    // Swap school identity data so each school assumes the correct seed and pool slot position
    if (otherTeam) {
      const updatedTeams = tournament.teams.map((t) => {
        if (t.id === currentTeam.id) {
          return {
            ...t,
            schoolName: otherTeam.schoolName,
            teamNickname: otherTeam.teamNickname,
            name: otherTeam.name,
            association: otherTeam.association,
            logoUrl: otherTeam.logoUrl,
            accentColor: otherTeam.accentColor,
            isQualified: otherTeam.isQualified,
          };
        }
        if (t.id === otherTeam.id) {
          return {
            ...t,
            schoolName: currentTeam.schoolName,
            teamNickname: currentTeam.teamNickname,
            name: currentTeam.name,
            association: currentTeam.association,
            logoUrl: currentTeam.logoUrl,
            accentColor: currentTeam.accentColor,
            isQualified: currentTeam.isQualified,
          };
        }
        return t;
      });
      await saveTournament({ ...tournament, teams: updatedTeams });
    } else {
      const updatedTeams = tournament.teams.map((t) => (t.id === teamId ? { ...t, seed: newSeed } : t));
      await saveTournament({ ...tournament, teams: updatedTeams });
    }
  };

  const addTeam = async (teamData: {
    schoolName: string;
    teamNickname?: string;
    association?: string;
    seed?: number;
    logoUrl?: string;
    accentColor?: string;
    isQualified?: boolean;
  }) => {
    const trimmedSchool = teamData.schoolName.trim();
    const nickname = (teamData.teamNickname || '').trim();
    const fullName = nickname ? `${trimmedSchool} ${nickname}` : trimmedSchool;
    const targetSeed = teamData.seed;

    let targetTeam: Team | undefined;
    if (targetSeed) {
      targetTeam = tournament.teams.find((t) => t.seed === targetSeed);
    }
    if (!targetTeam) {
      targetTeam = tournament.teams.find((t) => !t.isQualified || t.name.includes('TBD'));
    }
    if (!targetTeam && tournament.teams.length > 0) {
      targetTeam = tournament.teams[tournament.teams.length - 1];
    }

    if (targetTeam) {
      const updatedTeams = tournament.teams.map((t) => {
        if (t.id === targetTeam!.id) {
          return {
            ...t,
            schoolName: trimmedSchool,
            teamNickname: nickname,
            name: fullName,
            association: teamData.association || 'SWOSSAA',
            logoUrl: teamData.logoUrl || '',
            accentColor: teamData.accentColor || '#0b2341',
            isQualified: teamData.isQualified !== false,
          };
        }
        return t;
      });
      await saveTournament({ ...tournament, teams: updatedTeams });
    }
  };

  const removeTeam = async (teamId: string) => {
    const target = tournament.teams.find((t) => t.id === teamId);
    if (!target) return;
    const updatedTeams = tournament.teams.map((t) => {
      if (t.id === teamId) {
        return {
          ...t,
          schoolName: `Qualifier ${t.seed}`,
          teamNickname: '',
          name: `Seed ${t.seed} (TBD)`,
          logoUrl: '',
          isQualified: false,
        };
      }
      return t;
    });
    await saveTournament({ ...tournament, teams: updatedTeams });
  };

  const updateMatchScore = async (
    matchId: string,
    sets: SetScore[],
    status: MatchStatus = 'final',
    notes?: string,
    court?: string
  ) => {
    const updatedMatches = tournament.matches.map((m) => {
      if (m.id !== matchId) return m;

      const calc = calculateSetsAndPoints({ ...m, sets });
      return {
        ...m,
        sets,
        status,
        team1SetsWon: calc.team1Sets,
        team2SetsWon: calc.team2Sets,
        winnerId: calc.winnerId,
        loserId: calc.loserId,
        notes: notes !== undefined ? notes : m.notes,
        court: court !== undefined ? court : m.court,
      };
    });

    await saveTournament({ ...tournament, matches: updatedMatches });
  };

  const updateMatch = async (matchId: string, updates: Partial<Match>) => {
    const updatedMatches = tournament.matches.map((m) => {
      if (m.id !== matchId) return m;
      return { ...m, ...updates };
    });
    await saveTournament({ ...tournament, matches: updatedMatches });
  };

  const updateMatchCourt = async (matchId: string, court: string) => {
    const updatedMatches = tournament.matches.map((m) => {
      if (m.id !== matchId) return m;
      return { ...m, court };
    });
    await saveTournament({ ...tournament, matches: updatedMatches });
  };

  const updateVenues = async (newVenues: string[], applyToMatches: boolean = false) => {
    let updatedMatches = tournament.matches;
    if (applyToMatches) {
      updatedMatches = assignDefaultCourts(tournament.matches, newVenues);
    }
    await saveTournament({ ...tournament, venues: newVenues, matches: updatedMatches });
  };

  const applyVenuesToSchedule = async (venuesToUse?: string[]) => {
    const v = venuesToUse || tournament.venues || DEFAULT_VENUES;
    const updatedMatches = assignDefaultCourts(tournament.matches, v);
    await saveTournament({ ...tournament, venues: v, matches: updatedMatches });
  };

  const resetMatchScore = async (matchId: string) => {
    const updatedMatches = tournament.matches.map((m) => {
      if (m.id !== matchId) return m;
      return {
        ...m,
        sets: [],
        status: 'scheduled' as const,
        team1SetsWon: 0,
        team2SetsWon: 0,
        winnerId: undefined,
        loserId: undefined,
        notes: undefined,
      };
    });

    await saveTournament({ ...tournament, matches: updatedMatches });
  };

  const setTournamentFormat = async (format: TournamentFormat) => {
    const newTournament = createSkeletonTournament(format);
    await saveTournament(newTournament);
  };

  const resetToSkeleton = async () => {
    const skeleton = createSkeletonTournament(tournament.format);
    await saveTournament(skeleton);
  };

  const loadDemoData = async () => {
    const demo = createDemoTournament(tournament.format);
    await saveTournament(demo);
  };

  const importTournamentJson = async (jsonString: string): Promise<boolean> => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.teams || !parsed.matches) {
        throw new Error('Invalid format');
      }
      await saveTournament(parsed);
      return true;
    } catch (e) {
      console.error('Failed to import JSON', e);
      return false;
    }
  };

  const updateTournamentInfo = async (info: Partial<TournamentData>) => {
    await saveTournament({ ...tournament, ...info });
  };

  const updateCredentials = async (newUsername: string, newPassword: string) => {
    await saveTournament({
      ...tournament,
      adminUsername: newUsername,
      adminPasswordHash: newPassword,
    });
    setAdminUsername(newUsername);
  };

  return (
    <TournamentContext.Provider
      value={{
        tournament,
        isAdmin,
        adminUsername,
        loginError,
        isLoading,
        login,
        logout,
        updateTeam,
        updateTeamSeed,
        addTeam,
        removeTeam,
        updateMatchScore,
        updateMatch,
        updateMatchCourt,
        updateVenues,
        applyVenuesToSchedule,
        resetMatchScore,
        setTournamentFormat,
        resetToSkeleton,
        loadDemoData,
        importTournamentJson,
        updateTournamentInfo,
        standingsByPool,
        teamsMap,
        matchesMap,
        updateCredentials,
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
};

export const useTournament = () => {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error('useTournament must be used within a TournamentProvider');
  }
  return context;
};
