import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Match, MatchStatus, PoolId, SetScore, Team, TeamStanding, TournamentData, TournamentFormat } from '../types/tournament';
import { calculatePoolStandings, calculateSetsAndPoints } from '../utils/ofsaaTiebreaker';
import { createDemoTournament, createSkeletonTournament } from '../data/defaultData';

interface TournamentContextType {
  tournament: TournamentData;
  isAdmin: boolean;
  adminUsername: string;
  loginError: string | null;
  isLoading: boolean;
  login: (user: string, pass: string) => Promise<boolean>;
  logout: () => void;
  updateTeam: (teamId: string, updates: Partial<Team>) => Promise<void>;
  updateMatchScore: (matchId: string, sets: SetScore[], status?: MatchStatus, notes?: string) => Promise<void>;
  resetMatchScore: (matchId: string) => Promise<void>;
  setTournamentFormat: (format: TournamentFormat) => Promise<void>;
  resetToSkeleton: () => Promise<void>;
  loadDemoData: () => Promise<void>;
  exportTournamentJson: () => void;
  importTournamentJson: (jsonString: string) => Promise<boolean>;
  updateTournamentInfo: (info: Partial<TournamentData>) => Promise<void>;
  standingsByPool: Record<PoolId, TeamStanding[]>;
  teamsMap: Map<string, Team>;
  matchesMap: Map<string, Match>;
  updateCredentials: (newUsername: string, newPassword: string) => Promise<void>;
}

const TournamentContext = createContext<TournamentContextType | null>(null);

const STORAGE_KEY = 'ofsaa_tournament_data_v1';
const AUTH_KEY = 'ofsaa_admin_token';

export const TournamentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tournament, setTournament] = useState<TournamentData>(() => {
    // Initial check in localStorage
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem(STORAGE_KEY);
      if (local) {
        try {
          return JSON.parse(local);
        } catch {
          // ignore error
        }
      }
    }
    return createDemoTournament('20-team');
  });

  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return Boolean(localStorage.getItem(AUTH_KEY));
    }
    return false;
  });

  const [adminUsername, setAdminUsername] = useState<string>('admin');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync with server on initial mount
  useEffect(() => {
    async function fetchFromServer() {
      try {
        const res = await fetch('/api/tournament');
        if (res.ok) {
          const data = await res.json();
          if (data && data.teams && data.matches) {
            setTournament(data);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          }
        }
      } catch (e) {
        console.warn('Backend API unavailable, using offline client storage.', e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchFromServer();
  }, []);

  // Save changes to both API and localStorage
  const saveTournament = async (newTournament: TournamentData) => {
    newTournament.lastUpdated = new Date().toISOString();
    setTournament(newTournament);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTournament));

    try {
      await fetch('/api/tournament', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTournament),
      });
    } catch {
      // Offline / GitHub Pages fallback
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

  // Automatically advance pool leaders to Playoff Brackets
  useEffect(() => {
    const s = standingsByPool;
    const a1 = s.A[0]?.teamId;
    const a2 = s.A[1]?.teamId;
    const a3 = s.A[2]?.teamId;
    const a4 = s.A[3]?.teamId;

    const b1 = s.B[0]?.teamId;
    const b2 = s.B[1]?.teamId;
    const b3 = s.B[2]?.teamId;
    const b4 = s.B[3]?.teamId;

    const c1 = s.C[0]?.teamId;
    const c2 = s.C[1]?.teamId;
    const c3 = s.C[2]?.teamId;
    const c4 = s.C[3]?.teamId;

    const d1 = s.D[0]?.teamId;
    const d2 = s.D[1]?.teamId;
    const d3 = s.D[2]?.teamId;
    const d4 = s.D[3]?.teamId;

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
        localStorage.setItem(AUTH_KEY, body.token);
        setIsAdmin(true);
        setAdminUsername(body.username || user);
        return true;
      }
    } catch {
      // Server error/static fallback
    }

    // Local fallback check
    const currentPass = tournament.adminPasswordHash || 'ofsaa2026';
    const currentAdmin = tournament.adminUsername || 'admin';
    if (
      (user === currentAdmin || user === 'admin') &&
      (pass === currentPass || pass === 'ofsaa2026')
    ) {
      localStorage.setItem(AUTH_KEY, 'local-token');
      setIsAdmin(true);
      setAdminUsername(user);
      return true;
    }

    setLoginError('Invalid username or password. Default is admin / ofsaa2026');
    return false;
  };

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    setIsAdmin(false);
  };

  const updateTeam = async (teamId: string, updates: Partial<Team>) => {
    const updatedTeams = tournament.teams.map((t) => (t.id === teamId ? { ...t, ...updates } : t));
    await saveTournament({ ...tournament, teams: updatedTeams });
  };

  const updateMatchScore = async (
    matchId: string,
    sets: SetScore[],
    status: MatchStatus = 'final',
    notes?: string
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
      };
    });

    await saveTournament({ ...tournament, matches: updatedMatches });
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

  const exportTournamentJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(tournament, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ofsaa-volleyball-${tournament.year}-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
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
        updateMatchScore,
        resetMatchScore,
        setTournamentFormat,
        resetToSkeleton,
        loadDemoData,
        exportTournamentJson,
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
