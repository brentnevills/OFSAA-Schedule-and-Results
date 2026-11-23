import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
import { Match, MatchStatus, PoolId, SetScore, Team, TeamStanding, TournamentData, TournamentFormat } from '../types/tournament';
import { calculatePoolStandings, calculateSetsAndPoints, getPoolAndSlotForSeed } from '../utils/ofsaaTiebreaker';
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
  cloudStatus: 'connecting' | 'connected' | 'quota_exceeded' | 'error';
  cloudError: string | null;
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
const LOGOS_CACHE_KEY = 'ofsaa_cloud_logos_v1';
const AUTHORIZED_CONVENOR_EMAIL = 'brentnevills@gmail.com';
const TOURNAMENT_DOC_ID = 'ofsaa_boys_aaa_2026';
const EMAIL_REGEX = /^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/;
const CLOUD_LOGO_PREFIX = 'cloud-logo://';

type CloudLogosMap = Record<string, { url: string; version: string }>;

function readCachedCloudLogos(): CloudLogosMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOGOS_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed as CloudLogosMap;
    }
  } catch {}
  return {};
}

function writeCachedCloudLogos(logos: CloudLogosMap) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOGOS_CACHE_KEY, JSON.stringify(logos));
  } catch {}
}

export function isQuotaExceededError(err: unknown): boolean {
  const code = typeof err === 'object' && err !== null && 'code' in err ? String((err as any).code) : '';
  if (code === 'resource-exhausted') return true;
  const msg = err instanceof Error ? err.message : String(err || '');
  return /quota\s*(limit)?\s*exceeded|resource[-_ ]exhausted|free daily read units/i.test(msg);
}

function sanitizeLogoDocId(teamId: string, seed?: number): string {
  const base = (teamId || `seed_${seed || 1}`).replace(/[^a-zA-Z0-9_-]/g, '_');
  return (base || 'team_logo').slice(0, 100);
}

function parseCloudLogoPointer(val?: string): { docId: string; version: string } | null {
  if (!val || !val.startsWith(CLOUD_LOGO_PREFIX)) return null;
  const rest = val.slice(CLOUD_LOGO_PREFIX.length);
  const [rawId, query] = rest.split('?');
  const docId = rawId ? rawId.trim() : '';
  if (!docId || !/^[a-zA-Z0-9_-]{1,128}$/.test(docId)) return null;
  const versionMatch = query ? query.match(/(?:^|&)v=([^&]+)/) : null;
  return { docId, version: versionMatch ? versionMatch[1] : '' };
}

async function shrinkLegacyLogoIfNeeded(dataUrl: string, maxChars = 320_000): Promise<string> {
  if (dataUrl.length <= maxChars || typeof document === 'undefined') return dataUrl;
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new window.Image();
      image.onerror = reject;
      image.onload = () => resolve(image);
      image.src = dataUrl;
    });
    const w0 = img.naturalWidth || img.width || 160;
    const h0 = img.naturalHeight || img.height || 160;
    for (const maxDim of [180, 144, 112, 96]) {
      let w = w0;
      let h = h0;
      if (w >= h && w > maxDim) {
        h = Math.max(1, Math.round((h * maxDim) / w));
        w = maxDim;
      } else if (h > w && h > maxDim) {
        w = Math.max(1, Math.round((w * maxDim) / h));
        h = maxDim;
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) break;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      for (const q of [0.8, 0.65, 0.5]) {
        const webp = canvas.toDataURL('image/webp', q);
        if (webp.startsWith('data:image/webp') && webp.length <= maxChars) return webp;
      }
      const jpeg = canvas.toDataURL('image/jpeg', 0.72);
      if (jpeg.length <= maxChars) return jpeg;
    }
  } catch {}
  return dataUrl;
}

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
  quotaExceeded?: boolean;
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
    if (isQuotaExceededError(err)) {
      return { authorized: false, isPrimary: false, quotaExceeded: true };
    }
  }
  return { authorized: false, isPrimary: false };
}

export function extractSaveErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err || 'Unknown error');
  let extracted = raw;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.error === 'string') {
      extracted = parsed.error;
    }
  } catch {}
  if (isQuotaExceededError(err) || isQuotaExceededError(extracted)) {
    return 'Cloud database daily quota reached (free tier limit). Quota resets tomorrow, or upgrade the Firebase database plan to resume cloud access immediately.';
  }
  return extracted;
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
  const [rawTournament, setRawTournament] = useState<TournamentData>(() => {
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

  const [cloudLogos, setCloudLogos] = useState<CloudLogosMap>(() => readCachedCloudLogos());
  const cloudLogosRef = useRef<CloudLogosMap>(cloudLogos);
  cloudLogosRef.current = cloudLogos;
  const rawTournamentRef = useRef<TournamentData>(rawTournament);
  rawTournamentRef.current = rawTournament;
  const fetchingLogosRef = useRef<Record<string, string>>({});
  const isMigratingCloudRef = useRef<boolean>(false);

  const tournament = useMemo<TournamentData>(() => {
    const hasPointers = rawTournament.teams.some((t) => t.logoUrl?.startsWith(CLOUD_LOGO_PREFIX));
    if (!hasPointers) return rawTournament;
    return {
      ...rawTournament,
      teams: rawTournament.teams.map((t) => {
        const ptr = parseCloudLogoPointer(t.logoUrl);
        if (!ptr) return t;
        return {
          ...t,
          logoUrl: cloudLogos[ptr.docId]?.url || '',
        };
      }),
    };
  }, [rawTournament, cloudLogos]);

  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isPrimaryAdmin, setIsPrimaryAdmin] = useState<boolean>(false);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [convenorEmail, setConvenorEmail] = useState<string | null>(null);
  const [convenorUid, setConvenorUid] = useState<string | null>(null);
  const [coConvenors, setCoConvenors] = useState<CoConvenor[]>([]);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(false);
  const [cloudStatus, setCloudStatus] = useState<'connecting' | 'connected' | 'quota_exceeded' | 'error'>('connecting');
  const [cloudError, setCloudError] = useState<string | null>(null);

  const isVerifyingLoginRef = useRef<boolean>(false);
  const isAdminRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    isAdminRef.current = isAdmin;
  }, [isAdmin]);

  // Fetch referenced /team_logos/{logoId} documents whenever pointers appear or change version
  useEffect(() => {
    const toFetch: Array<{ docId: string; version: string }> = [];

    for (const team of rawTournament.teams) {
      const ptr = parseCloudLogoPointer(team.logoUrl);
      if (!ptr) continue;
      const cached = cloudLogosRef.current[ptr.docId];
      if (cached && cached.version === ptr.version) continue;
      if (fetchingLogosRef.current[ptr.docId] === ptr.version && cached) continue;
      if (fetchingLogosRef.current[ptr.docId] === `${ptr.version}__pending`) continue;
      toFetch.push(ptr);
    }

    if (toFetch.length === 0) return;

    toFetch.forEach(({ docId, version }) => {
      fetchingLogosRef.current[docId] = `${version}__pending`;
      getDoc(doc(db, 'team_logos', docId))
        .then((snap) => {
          if (!isMountedRef.current) return;
          fetchingLogosRef.current[docId] = version;
          if (snap.exists()) {
            const data = snap.data() as { logoUrl?: string };
            if (typeof data.logoUrl === 'string' && data.logoUrl) {
              setCloudLogos((prev) => {
                const updated = {
                  ...prev,
                  [docId]: { url: data.logoUrl!, version },
                };
                writeCachedCloudLogos(updated);
                return updated;
              });
            }
          }
        })
        .catch((err) => {
          delete fetchingLogosRef.current[docId];
          console.warn(`Logo fetch notice (${docId}):`, err);
          if (!isMountedRef.current) return;
          if (isQuotaExceededError(err)) {
            setIsCloudConnected(false);
            setCloudStatus('quota_exceeded');
            setCloudError('Cloud daily read quota reached (resets tomorrow). Uploaded logos cannot load from cloud until quota resets or the database is upgraded.');
          }
        });
    });
  }, [rawTournament.teams]);

  // Track Firebase Auth session state and verify primary or delegated convenor status
  useEffect(() => {
    let active = true;
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (isVerifyingLoginRef.current) return;

      if (!user) {
        if (!active) return;
        isAdminRef.current = false;
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
        isAdminRef.current = true;
        setIsAdmin(true);
        setIsPrimaryAdmin(isPrimary);
        setConvenorEmail(user.email || null);
        setConvenorUid(user.uid);
        setLoginError(null);
      } else {
        await signOut(auth).catch(() => {});
        if (!active) return;
        isAdminRef.current = false;
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
          if (isQuotaExceededError(err)) {
            console.warn('Co-convenor list listener paused: Firestore daily quota reached.');
            return;
          }
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

  // Real-time multi-device cloud synchronization with Firestore (single listener for lifetime)
  useEffect(() => {
    let isMounted = true;
    const tournamentRef = doc(db, 'tournaments', TOURNAMENT_DOC_ID);

    const unsubscribe = onSnapshot(
      tournamentRef,
      (snapshot) => {
        if (!isMounted) return;
        setIsCloudConnected(true);
        setCloudStatus('connected');
        setCloudError(null);
        setIsLoading(false);

        const canWrite = Boolean(auth.currentUser?.emailVerified && isAdminRef.current);

        if (snapshot.exists()) {
          const rawCloud = snapshot.data() as Record<string, any>;
          const hadLegacyCredentials =
            'adminPasswordHash' in rawCloud ||
            'adminUsername' in rawCloud ||
            'updatedAt' in rawCloud ||
            'hostSchool' in rawCloud ||
            'convenor' in rawCloud;
          const cloudData = sanitizeTournamentData(rawCloud);

          if (cloudData.teams.length >= 16 && Array.isArray(cloudData.matches)) {
            const hasInlineDataLogos = cloudData.teams.some(
              (t) => typeof t.logoUrl === 'string' && t.logoUrl.startsWith('data:image/')
            );
            setRawTournament(cloudData);
            if (typeof window !== 'undefined') {
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudData));
              } catch {}
            }

            if ((hadLegacyCredentials || hasInlineDataLogos) && canWrite && !isMigratingCloudRef.current) {
              isMigratingCloudRef.current = true;
              saveTournament(cloudData)
                .catch((e) => console.warn('Background tournament migration notice:', e))
                .finally(() => {
                  isMigratingCloudRef.current = false;
                });
            }
          } else if (canWrite) {
            const defaultTourney = sanitizeTournamentData(createSkeletonTournament('20-team'));
            const cleanPayload = JSON.parse(JSON.stringify(defaultTourney));
            setDoc(tournamentRef, cleanPayload).catch((e) =>
              console.warn('Repair cloud seed notice:', e)
            );
          }
        } else if (canWrite) {
          const cleanPayload = JSON.parse(JSON.stringify(sanitizeTournamentData(rawTournamentRef.current)));
          setDoc(tournamentRef, cleanPayload)
            .then(() => {
              if (isMounted) {
                setIsCloudConnected(true);
                setCloudStatus('connected');
                setCloudError(null);
              }
            })
            .catch((err) => {
              console.warn('Initial cloud seed notice:', err);
            });
        }
      },
      (error) => {
        console.warn('Firestore snapshot listener notice:', error);
        if (!isMounted) return;
        setIsCloudConnected(false);
        setIsLoading(false);
        if (isQuotaExceededError(error)) {
          setCloudStatus('quota_exceeded');
          setCloudError('Cloud daily read quota reached (resets tomorrow). Showing saved local data.');
        } else {
          setCloudStatus('error');
          setCloudError(error?.message || 'Unable to reach cloud database.');
        }
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Save changes to Firestore (instantly broadcasting to all devices worldwide), and offline storage
  const saveTournament = async (
    newTournament: TournamentData,
    options?: { allowLogoClearForTeamIds?: string[] }
  ) => {
    if (!auth.currentUser || !auth.currentUser.emailVerified || !isAdminRef.current) {
      handleFirestoreError(
        new Error('Authorized convenor Google sign-in is required to save tournament updates.'),
        OperationType.WRITE,
        `tournaments/${TOURNAMENT_DOC_ID}`
      );
    }

    const sanitizedHydrated = sanitizeTournamentData(newTournament, tournament.id || 'ofsaa-2026');
    const nowIso = new Date().toISOString();
    const versionStamp = String(Date.now());
    sanitizedHydrated.lastUpdated = nowIso;

    // 1. Offload uploaded data:image logos to dedicated /team_logos/{docId} documents
    // so tournaments/{id} stays tiny (~27 KB) and never hits the 1 MB Firestore limit.
    const nextCloudLogos: Record<string, { url: string; version: string }> = {
      ...cloudLogosRef.current,
    };
    const logoWritePromises: Promise<void>[] = [];
    const logoDeleteIds: string[] = [];

    const payloadTeams: Team[] = await Promise.all(
      sanitizedHydrated.teams.map(async (team) => {
        const docId = sanitizeLogoDocId(team.id, team.seed);
        const logoVal = (team.logoUrl || '').trim();
        const prevRawTeam = rawTournamentRef.current.teams.find((rt) => rt.id === team.id);
        const prevPtr = parseCloudLogoPointer(prevRawTeam?.logoUrl);
        const canClearUnloaded = Boolean(options?.allowLogoClearForTeamIds?.includes(team.id));

        if (logoVal.startsWith('data:image/')) {
          const cached = nextCloudLogos[docId];
          if (cached && cached.url === logoVal && prevPtr && prevPtr.docId === docId) {
            return {
              ...team,
              logoUrl: prevRawTeam!.logoUrl!,
            };
          }

          const compactUrl = await shrinkLegacyLogoIfNeeded(logoVal, 320_000);
          if (compactUrl.length > 440_000) {
            handleFirestoreError(
              new Error(
                `Logo for ${team.schoolName || team.name} exceeds the 440 KB cloud logo limit. Please upload a smaller image or use a web URL.`
              ),
              OperationType.WRITE,
              `team_logos/${docId}`
            );
          }

          nextCloudLogos[docId] = { url: compactUrl, version: versionStamp };
          logoWritePromises.push(
            setDoc(doc(db, 'team_logos', docId), {
              teamId: docId,
              logoUrl: compactUrl,
              updatedAt: nowIso,
            }).catch((err) => {
              handleFirestoreError(err, OperationType.WRITE, `team_logos/${docId}`);
            })
          );

          return {
            ...team,
            logoUrl: `${CLOUD_LOGO_PREFIX}${docId}?v=${versionStamp}`,
          };
        }

        if (logoVal.startsWith(CLOUD_LOGO_PREFIX)) {
          return { ...team, logoUrl: logoVal };
        }

        // If the team previously had a cloud-logo pointer that hadn't finished hydrating yet
        // (e.g. offline/quota limit), preserve it unless this save explicitly cleared that team's logo.
        if (!logoVal && prevPtr && !nextCloudLogos[prevPtr.docId]?.url && !canClearUnloaded) {
          return { ...team, logoUrl: prevRawTeam!.logoUrl! };
        }

        // Empty or external http(s) URL: clean up any previously stored cloud-logo doc
        if (nextCloudLogos[docId] || (prevPtr && prevPtr.docId === docId)) {
          delete nextCloudLogos[docId];
          logoDeleteIds.push(docId);
        }

        return { ...team, logoUrl: logoVal };
      })
    );

    if (logoWritePromises.length > 0) {
      await Promise.all(logoWritePromises);
    }

    if (logoDeleteIds.length > 0) {
      Promise.all(
        logoDeleteIds.map((docId) => deleteDoc(doc(db, 'team_logos', docId)).catch(() => {}))
      ).catch(() => {});
    }

    const rawToSave: TournamentData = {
      ...sanitizedHydrated,
      teams: payloadTeams,
    };

    const cleanPayload = JSON.parse(JSON.stringify(rawToSave));
    const serialized = JSON.stringify(cleanPayload);
    const payloadBytes = typeof Blob !== 'undefined' ? new Blob([serialized]).size : serialized.length;
    if (payloadBytes > 920_000) {
      handleFirestoreError(
        new Error(
          `Tournament data is ${Math.round(payloadBytes / 1024)} KB, which is too close to the 1 MB cloud database limit.`
        ),
        OperationType.WRITE,
        `tournaments/${TOURNAMENT_DOC_ID}`
      );
    }

    // 2. Write compact tournament document to Firestore first
    const tournamentRef = doc(db, 'tournaments', TOURNAMENT_DOC_ID);
    try {
      await setDoc(tournamentRef, cleanPayload);
      setIsCloudConnected(true);
      setCloudStatus('connected');
      setCloudError(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `tournaments/${TOURNAMENT_DOC_ID}`);
    }

    // 3. Update hydrated local state & compact offline cache once Firestore confirms the write
    cloudLogosRef.current = nextCloudLogos;
    setCloudLogos(nextCloudLogos);
    writeCachedCloudLogos(nextCloudLogos);
    setRawTournament(rawToSave);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, serialized);
      } catch {}
    }

    // 4. Also keep local Express server in sync when running full-stack
    try {
      await fetch('/api/tournament', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: serialized,
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
      const { authorized, isPrimary, quotaExceeded } = await checkConvenorAuthorization(user);

      if (!authorized) {
        const signedInEmail = user?.email || 'unknown account';
        await signOut(auth).catch(() => {});
        isAdminRef.current = false;
        setIsAdmin(false);
        setIsPrimaryAdmin(false);
        setConvenorEmail(null);
        setConvenorUid(null);
        setLoginError(
          quotaExceeded
            ? 'Unable to verify co-convenor permissions because the cloud database daily quota has been reached. Try again tomorrow or upgrade the database plan.'
            : `Access denied for ${signedInEmail}. Ask the primary convenor (${AUTHORIZED_CONVENOR_EMAIL}) to grant this Google account co-convenor access.`
        );
        return false;
      }

      isAdminRef.current = true;
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
    isAdminRef.current = false;
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
    await saveTournament(
      { ...tournament, teams: updatedTeams },
      { allowLogoClearForTeamIds: updates.logoUrl !== undefined ? [teamId] : [] }
    );
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
        await saveTournament(
          { ...tournament, teams: updatedTeams },
          { allowLogoClearForTeamIds: updates.logoUrl !== undefined ? [otherTeam.id] : [] }
        );
        return;
      }
    }

    // No seed swap needed (seed unchanged or unassigned)
    const fallbackSlot = newSeed !== undefined ? getPoolAndSlotForSeed(newSeed, tournament.format) : null;
    const updatedTeams = tournament.teams.map((t) => {
      if (t.id === teamId) {
        return {
          ...t,
          ...updates,
          ...(newSeed !== undefined && fallbackSlot
            ? { seed: newSeed, pool: fallbackSlot.pool, poolSlot: fallbackSlot.slot }
            : {}),
        };
      }
      return t;
    });
    await saveTournament(
      { ...tournament, teams: updatedTeams },
      { allowLogoClearForTeamIds: updates.logoUrl !== undefined ? [teamId] : [] }
    );
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
      const slotInfo = getPoolAndSlotForSeed(newSeed, tournament.format);
      const updatedTeams = tournament.teams.map((t) =>
        t.id === teamId ? { ...t, seed: newSeed, pool: slotInfo.pool, poolSlot: slotInfo.slot } : t
      );
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
    await saveTournament({ ...tournament, teams: updatedTeams }, { allowLogoClearForTeamIds: [teamId] });
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
        cloudStatus,
        cloudError,
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
