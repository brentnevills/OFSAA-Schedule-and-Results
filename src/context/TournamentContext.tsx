import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
import { Match, MatchStatus, PoolId, SetScore, Team, TeamStanding, TournamentData, TournamentFormat } from '../types/tournament';
import { calculatePoolStandings, calculateSetsAndPoints } from '../utils/ofsaaTiebreaker';
import { createDemoTournament, createSkeletonTournament, assignDefaultCourts, DEFAULT_VENUES } from '../data/defaultData';
import { db, auth, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import { collection, deleteDoc, doc, getDoc, onSnapshot, query, setDoc, where } from 'firebase/firestore';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';

export interface CoConvenor {
  email: string;
  label?: string;
  addedBy: string;
  addedAt: string;
}

interface TournamentContextType {
  tournament: TournamentData;
  isAdmin: boolean;
  isPrimaryAdmin: boolean;
  authReady: boolean;
  convenorEmail: string | null;
  convenorUid: string | null;
  coConvenors: CoConvenor[];
  loginError: string | null;
  isLoading: boolean;
  isCloudConnected: boolean;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
  addCoConvenor: (email: string, label?: string) => Promise<{ ok: boolean; error?: string }>;
  removeCoConvenor: (email: string) => Promise<void>;
  updateTeam: (teamId: string, updates: Partial<Team>) => Promise<void>;
  updateTeamSeed: (teamId: string, newSeed: number) => Promise<void>;
  saveTeamWithSeed: (teamId: string, updates: Partial<Team>, newSeed?: number) => Promise<void>;
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
}

const TournamentContext = createContext<TournamentContextType | null>(null);

const STORAGE_KEY = 'ofsaa_boys_aaa_2026_v3';
const AUTHORIZED_CONVENOR_EMAIL = 'brentnevills@gmail.com';
const TOURNAMENT_DOC_ID = 'ofsaa_boys_aaa_2026';
const EMAIL_REGEX = /^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/;

function isPrimaryConvenorUser(user: User | null): boolean {
  return Boolean(
    user &&
      user.emailVerified &&
      user.email &&
      user.email.toLowerCase() === AUTHORIZED_CONVENOR_EMAIL
  );
}

async function checkConvenorAuthorization(user: User | null): Promise<{
  authorized: boolean;
  isPrimary: boolean;
}> {
  if (!user || !user.emailVerified || !user.email) {
    return { authorized: false, isPrimary: false };
  }
  const emailLower = user.email.toLowerCase();
  if (emailLower === AUTHORIZED_CONVENOR_EMAIL) {
    return { authorized: true, isPrimary: true };
  }
  try {
    const convenorSnap = await getDoc(doc(db, 'convenors', emailLower));
    if (convenorSnap.exists()) {
      return { authorized: true, isPrimary: false };
    }
  } catch (err) {
    console.warn('Co-convenor verification check:', err);
  }
  return { authorized: false, isPrimary: false };
}

function sanitizeTournamentData(raw: Record<string, any>, fallbackId = 'ofsaa-2026'): TournamentData {
  const skeleton = createSkeletonTournament(raw?.format === '16-team' ? '16-team' : '20-team');
  const venues =
    Array.isArray(raw?.venues) && raw.venues.length > 0
      ? raw.venues.filter((v: unknown): v is string => typeof v === 'string')
      : [...DEFAULT_VENUES];
  const rawMatches = Array.isArray(raw?.matches) ? raw.matches : skeleton.matches;
  const matches = rawMatches.some((m: Match) => !m.court || m.court === '')
    ? assignDefaultCourts(rawMatches, venues)
    : rawMatches;

  return {
    id: typeof raw?.id === 'string' && raw.id ? raw.id : fallbackId,
    name: typeof raw?.name === 'string' && raw.name ? raw.name : skeleton.name,
    classification: typeof raw?.classification === 'string' ? raw.classification : skeleton.classification,
    gender: typeof raw?.gender === 'string' ? raw.gender : skeleton.gender,
    year: typeof raw?.year === 'number' ? raw.year : parseInt(String(raw?.year || '2026'), 10) || 2026,
    format: raw?.format === '16-team' ? '16-team' : '20-team',
    dates: typeof raw?.dates === 'string' ? raw.dates : skeleton.dates,
    location: typeof raw?.location === 'string' ? raw.location : skeleton.location,
    venues,
    mainVenue: typeof raw?.mainVenue === 'string' ? raw.mainVenue : skeleton.mainVenue,
    teams: Array.isArray(raw?.teams) ? raw.teams : skeleton.teams,
    matches,
    lastUpdated: typeof raw?.lastUpdated === 'string' ? raw.lastUpdated : new Date().toISOString(),
    isSkeletonMode: typeof raw?.isSkeletonMode === 'boolean' ? raw.isSkeletonMode : skeleton.isSkeletonMode,
  };
}

// Clean up any legacy insecure auth tokens from storage on startup
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('ofsaa_admin_token');
    localStorage.removeItem('ofsaa_convenor_session');
    sessionStorage.removeItem('ofsaa_convenor_session');
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
          if (parsed && Array.isArray(parsed.teams) && Array.isArray(parsed.matches) && parsed.teams.length > 0) {
            return sanitizeTournamentData(parsed);
          }
        } catch {
          // ignore error
        }
      }
    }
    return createSkeletonTournament('20-team');
  });

  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isPrimaryAdmin, setIsPrimaryAdmin] = useState<boolean>(false);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [convenorEmail, setConvenorEmail] = useState<string | null>(null);
  const [convenorUid, setConvenorUid] = useState<string | null>(null);
  const [coConvenors, setCoConvenors] = useState<CoConvenor[]>([]);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(false);

  const isVerifyingLoginRef = useRef<boolean>(false);
  const isAdminRef = useRef<boolean>(false);

  useEffect(() => {
    isAdminRef.current = isAdmin;
  }, [isAdmin]);

  // Track Firebase Auth session state and verify primary or delegated convenor status
  useEffect(() => {
    let active = true;
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (isVerifyingLoginRef.current) return;

      if (!user) {
        if (!active) return;
        setIsAdmin(false);
        setIsPrimaryAdmin(false);
        setConvenorEmail(null);
        setConvenorUid(null);
        setCoConvenors([]);
        setAuthReady(true);
        return;
      }

      const { authorized, isPrimary } = await checkConvenorAuthorization(user);
      if (!active) return;

      if (authorized) {
        setIsAdmin(true);
        setIsPrimaryAdmin(isPrimary);
        setConvenorEmail(user.email || null);
        setConvenorUid(user.uid);
        setLoginError(null);
      } else {
        await signOut(auth).catch(() => {});
        if (!active) return;
        setIsAdmin(false);
        setIsPrimaryAdmin(false);
        setConvenorEmail(null);
        setConvenorUid(null);
        setCoConvenors([]);
      }
      setAuthReady(true);
    });

    return () => {
      active = false;
      unsubscribeAuth();
    };
  }, []);

  // Subscribe to co-convenors list (primary admin) or live revocation watch (delegated co-convenor)
  useEffect(() => {
    if (!authReady || !isAdmin || !convenorEmail) {
      setCoConvenors([]);
      return;
    }

    if (isPrimaryAdmin) {
      const convenorsQuery = query(
        collection(db, 'convenors'),
        where('addedBy', '==', AUTHORIZED_CONVENOR_EMAIL)
      );
      const unsubscribeList = onSnapshot(
        convenorsQuery,
        (snapshot) => {
          const list: CoConvenor[] = snapshot.docs.map((d) => {
            const data = d.data() as CoConvenor;
            return {
              email: data.email || d.id,
              label: data.label || '',
              addedBy: data.addedBy || AUTHORIZED_CONVENOR_EMAIL,
              addedAt: data.addedAt || '',
            };
          });
          list.sort((a, b) => a.email.localeCompare(b.email));
          setCoConvenors(list);
        },
        (err) => {
          handleFirestoreError(err, OperationType.LIST, 'convenors');
        }
      );
      return () => unsubscribeList();
    }

    // Delegated co-convenor: listen to own doc so revocation takes effect immediately
    const selfRef = doc(db, 'convenors', convenorEmail.toLowerCase());
    const unsubscribeSelf = onSnapshot(
      selfRef,
      (snap) => {
        if (!snap.exists()) {
          signOut(auth).catch(() => {});
          setIsAdmin(false);
          setIsPrimaryAdmin(false);
          setConvenorEmail(null);
          setConvenorUid(null);
          setLoginError('Your co-convenor access was revoked by the primary tournament convenor.');
        }
      },
      (err) => {
        console.warn('Co-convenor status listener notice:', err);
      }
    );
    return () => unsubscribeSelf();
  }, [authReady, isAdmin, isPrimaryAdmin, convenorEmail]);

  // Real-time multi-device cloud synchronization with Firestore
  useEffect(() => {
    let isMounted = true;
    const tournamentRef = doc(db, 'tournaments', TOURNAMENT_DOC_ID);

    // Attach real-time snapshot listener so any device receives instant updates
    const unsubscribe = onSnapshot(
      tournamentRef,
      (snapshot) => {
        if (!isMounted) return;
        setIsCloudConnected(true);
        setIsLoading(false);

        const canWrite = Boolean(auth.currentUser?.emailVerified && isAdmin);

        if (snapshot.exists()) {
          const rawCloud = snapshot.data() as Record<string, any>;
          const hadLegacyCredentials = 'adminPasswordHash' in rawCloud || 'adminUsername' in rawCloud;
          const cloudData = sanitizeTournamentData(rawCloud);

          if (cloudData.teams.length >= 16 && Array.isArray(cloudData.matches)) {
            setTournament(cloudData);
            if (typeof window !== 'undefined') {
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudData));
              } catch {}
            }

            // Automatically purge any leftover legacy credential fields when an authorized convenor connects
            if (hadLegacyCredentials && canWrite) {
              const cleanPayload = JSON.parse(JSON.stringify(cloudData));
              setDoc(tournamentRef, cleanPayload).catch((e) =>
                console.warn('Credential cleanup notice:', e)
              );
            }
          } else if (canWrite) {
            // Seed with full tournament if cloud document is empty or incomplete (convenor only)
            const defaultTourney = sanitizeTournamentData(createSkeletonTournament('20-team'));
            const cleanPayload = JSON.parse(JSON.stringify(defaultTourney));
            setDoc(tournamentRef, cleanPayload).catch((e) =>
              console.warn('Repair cloud seed notice:', e)
            );
          }
        } else if (canWrite) {
          // If Firestore is empty on initial provision, initialize with default tournament (convenor only)
          const cleanPayload = JSON.parse(JSON.stringify(sanitizeTournamentData(tournament)));
          setDoc(tournamentRef, cleanPayload)
            .then(() => {
              if (isMounted) setIsCloudConnected(true);
            })
            .catch((err) => {
              console.warn('Initial cloud seed notice:', err);
            });
        }
      },
      (error) => {
        console.warn('Firestore snapshot listener notice:', error);
        if (isMounted) {
          setIsCloudConnected(false);
          setIsLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [authReady, isAdmin]);

  // Save changes to Firestore (instantly broadcasting to all devices worldwide), and offline storage
  const saveTournament = async (newTournament: TournamentData) => {
    if (!auth.currentUser || !auth.currentUser.emailVerified || !isAdminRef.current) {
      handleFirestoreError(
        new Error('Authorized convenor Google sign-in is required to save tournament updates.'),
        OperationType.WRITE,
        `tournaments/${TOURNAMENT_DOC_ID}`
      );
    }

    const sanitized = sanitizeTournamentData(newTournament, tournament.id || 'ofsaa-2026');
    sanitized.lastUpdated = new Date().toISOString();
    setTournament(sanitized);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
      } catch {}
    }

    // 1. Write to Firestore so all spectators, coaches, and convenors across all devices see it live
    const tournamentRef = doc(db, 'tournaments', TOURNAMENT_DOC_ID);
    const cleanPayload = JSON.parse(JSON.stringify(sanitized));
    try {
      await setDoc(tournamentRef, cleanPayload);
      setIsCloudConnected(true);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `tournaments/${TOURNAMENT_DOC_ID}`);
    }

    // 2. Also keep local Express server in sync when running full-stack
    try {
      await fetch('/api/tournament', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitized),
      });
    } catch {}
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

    if (hasChanges && isAdmin) {
      saveTournament({ ...tournament, matches: finalMatches });
    }
  }, [standingsByPool, isAdmin]);

  const loginWithGoogle = async (): Promise<boolean> => {
    setLoginError(null);
    isVerifyingLoginRef.current = true;
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const { authorized, isPrimary } = await checkConvenorAuthorization(user);

      if (!authorized) {
        const signedInEmail = user?.email || 'unknown account';
        await signOut(auth).catch(() => {});
        setIsAdmin(false);
        setIsPrimaryAdmin(false);
        setConvenorEmail(null);
        setConvenorUid(null);
        setLoginError(
          `Access denied for ${signedInEmail}. Ask the primary convenor (${AUTHORIZED_CONVENOR_EMAIL}) to grant this Google account co-convenor access.`
        );
        return false;
      }

      setIsAdmin(true);
      setIsPrimaryAdmin(isPrimary);
      setConvenorEmail(user.email || null);
      setConvenorUid(user.uid);
      return true;
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setLoginError('Google sign-in was cancelled.');
      } else if (code === 'auth/unauthorized-domain') {
        setLoginError(
          'This domain is not authorized for Google sign-in yet. Add this hostname under Firebase Authentication Authorized domains.'
        );
      } else {
        setLoginError(err?.message || 'Google sign-in failed. Please try again.');
      }
      return false;
    } finally {
      isVerifyingLoginRef.current = false;
    }
  };

  const logout = async () => {
    setLoginError(null);
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Error signing out:', err);
    }
    try {
      sessionStorage.removeItem('ofsaa_convenor_session');
      localStorage.removeItem('ofsaa_admin_token');
      localStorage.removeItem('ofsaa_convenor_session');
    } catch {}
    setIsAdmin(false);
    setIsPrimaryAdmin(false);
    setConvenorEmail(null);
    setConvenorUid(null);
    setCoConvenors([]);
  };

  const addCoConvenor = async (
    rawEmail: string,
    rawLabel?: string
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!isPrimaryConvenorUser(auth.currentUser)) {
      return { ok: false, error: 'Only the primary convenor can manage co-convenor access.' };
    }
    const email = rawEmail.trim().toLowerCase();
    const label = (rawLabel || '').trim().slice(0, 80);

    if (!email || email.length > 128 || !EMAIL_REGEX.test(email)) {
      return { ok: false, error: 'Please enter a valid Google email address.' };
    }
    if (email === AUTHORIZED_CONVENOR_EMAIL) {
      return { ok: false, error: `${email} is already the primary convenor account.` };
    }

    const payload: CoConvenor = {
      email,
      ...(label ? { label } : {}),
      addedBy: AUTHORIZED_CONVENOR_EMAIL,
      addedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'convenors', email), payload);
      return { ok: true };
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `convenors/${email}`);
    }
  };

  const removeCoConvenor = async (rawEmail: string) => {
    if (!isPrimaryConvenorUser(auth.currentUser)) {
      handleFirestoreError(
        new Error('Only the primary convenor can revoke co-convenor access.'),
        OperationType.DELETE,
        `convenors/${rawEmail}`
      );
    }
    const email = rawEmail.trim().toLowerCase();
    try {
      await deleteDoc(doc(db, 'convenors', email));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `convenors/${email}`);
    }
  };

  const updateTeam = async (teamId: string, updates: Partial<Team>) => {
    const updatedTeams = tournament.teams.map((t) => (t.id === teamId ? { ...t, ...updates } : t));
    await saveTournament({ ...tournament, teams: updatedTeams });
  };

  const saveTeamWithSeed = async (teamId: string, updates: Partial<Team>, newSeed?: number) => {
    const currentTeam = tournament.teams.find((t) => t.id === teamId);
    if (!currentTeam) return;

    const targetSeed = newSeed !== undefined ? newSeed : currentTeam.seed;

    if (targetSeed !== currentTeam.seed) {
      const otherTeam = tournament.teams.find((t) => t.seed === targetSeed && t.id !== teamId);
      if (otherTeam) {
        // Swap: otherTeam slot gets the updated currentTeam info (and targetSeed)
        // currentTeam slot gets otherTeam's previous school info (and oldSeed)
        const updatedTeams = tournament.teams.map((t) => {
          if (t.id === otherTeam.id) {
            return {
              ...t,
              ...updates,
              seed: otherTeam.seed,
              pool: otherTeam.pool,
              poolSlot: otherTeam.poolSlot,
            };
          }
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
              seed: currentTeam.seed,
              pool: currentTeam.pool,
              poolSlot: currentTeam.poolSlot,
            };
          }
          return t;
        });
        await saveTournament({ ...tournament, teams: updatedTeams });
        return;
      }
    }

    // No seed swap needed (seed unchanged or unassigned)
    const updatedTeams = tournament.teams.map((t) => {
      if (t.id === teamId) {
        return {
          ...t,
          ...updates,
          ...(newSeed !== undefined ? { seed: newSeed } : {}),
        };
      }
      return t;
    });
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
      // If target seed was already qualified and chosen specifically, swap with another placeholder
      if (targetTeam.isQualified && targetSeed) {
        const placeholder = tournament.teams.find((t) => !t.isQualified && t.id !== targetTeam!.id);
        if (placeholder) {
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
            if (t.id === placeholder.id) {
              return {
                ...t,
                schoolName: targetTeam!.schoolName,
                teamNickname: targetTeam!.teamNickname,
                name: targetTeam!.name,
                association: targetTeam!.association,
                logoUrl: targetTeam!.logoUrl,
                accentColor: targetTeam!.accentColor,
                isQualified: targetTeam!.isQualified,
              };
            }
            return t;
          });
          await saveTournament({ ...tournament, teams: updatedTeams });
          return;
        }
      }

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
    const oldVenues = tournament.venues && tournament.venues.length > 0 ? tournament.venues : DEFAULT_VENUES;
    let updatedMatches = tournament.matches;

    if (applyToMatches) {
      updatedMatches = assignDefaultCourts(tournament.matches, newVenues);
    } else {
      // Create migration map for any renamed venues (e.g. 'Gym 1' -> 'UCC Main Gym')
      const renameMap = new Map<string, string>();
      oldVenues.forEach((oldV, idx) => {
        const newV = newVenues[idx];
        if (oldV && newV && oldV !== newV) {
          renameMap.set(oldV, newV);
        }
      });

      if (renameMap.size > 0) {
        updatedMatches = tournament.matches.map((m) => {
          if (m.court && renameMap.has(m.court)) {
            return { ...m, court: renameMap.get(m.court)! };
          }
          return m;
        });
      }
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
      const clean = sanitizeTournamentData(parsed, tournament.id || 'ofsaa-2026');
      // Keep immutable document id consistent with existing tournament
      clean.id = tournament.id || clean.id;
      await saveTournament(clean);
      return true;
    } catch (e) {
      console.error('Failed to import JSON', e);
      return false;
    }
  };

  const updateTournamentInfo = async (info: Partial<TournamentData>) => {
    await saveTournament({ ...tournament, ...info });
  };

  return (
    <TournamentContext.Provider
      value={{
        tournament,
        isAdmin,
        isPrimaryAdmin,
        authReady,
        convenorEmail,
        convenorUid,
        coConvenors,
        loginError,
        isLoading,
        isCloudConnected,
        loginWithGoogle,
        logout,
        addCoConvenor,
        removeCoConvenor,
        updateTeam,
        updateTeamSeed,
        saveTeamWithSeed,
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
