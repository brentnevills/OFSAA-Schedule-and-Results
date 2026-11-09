export type PoolId = 'A' | 'B' | 'C' | 'D';

export type TournamentFormat = '20-team' | '16-team';

export interface Team {
  id: string; // e.g., "A1", "B2", etc.
  seed: number; // 1 to 20
  pool: PoolId;
  poolSlot: string; // "A1", "A2", "A3", "A4", "A5"
  name: string; // School / Team display name
  schoolName: string;
  teamNickname?: string;
  association: string; // e.g., SWOSSAA, CWOSSA, TDCAA
  logoUrl?: string; // Image URL, data URI, or preset key
  accentColor?: string; // Hex color for badge/jersey
  isQualified: boolean;
}

export interface SetScore {
  setNumber: number;
  team1Score: number;
  team2Score: number;
}

export type MatchStage =
  | 'pool'
  | 'tiebreaker_playoff'
  | 'consolation_qf'
  | 'championship_qf'
  | 'consolation_sf'
  | 'championship_sf'
  | 'consolation_final'
  | 'bronze'
  | 'gold';

export type MatchStatus = 'scheduled' | 'in_progress' | 'final';

export interface Match {
  id: string;
  stage: MatchStage;
  pool?: PoolId;
  matchNumber?: number | string;
  name?: string; // e.g., "Championship Quarterfinal 1"
  day: 1 | 2 | 3;
  dayLabel: string; // "Day 1 - Thursday", "Day 2 - Friday", "Day 3 - Saturday"
  time: string; // e.g. "9:00 AM"
  court: string; // "St. Anne", "St. Joe's", "CCH", "Assumption"
  team1Id: string;
  team2Id: string;
  team1Placeholder?: string; // e.g., "1st Pool A"
  team2Placeholder?: string; // e.g., "2nd Pool B"
  status: MatchStatus;
  bestOf: 3 | 5;
  sets: SetScore[];
  team1SetsWon?: number;
  team2SetsWon?: number;
  winnerId?: string;
  loserId?: string;
  notes?: string;
}

export interface TiebreakMathData {
  h2hMatchesPlayed?: number;
  h2hMatchesWon?: number;
  h2hMatchesLost?: number;
  h2hMatchRatio?: number;
  h2hSetsWon?: number;
  h2hSetsLost?: number;
  h2hSetRatio?: number;
  overallSetsWon?: number;
  overallSetsLost?: number;
  overallSetRatio?: number;
  h2hPointsFor?: number;
  h2hPointsAgainst?: number;
  h2hPointRatio?: number;
  overallPointsFor?: number;
  overallPointsAgainst?: number;
  overallPointRatio?: number;
  decidingCriterion?: string;
  decidingStatLabel?: string;
  explanation?: string;
}

export interface PoolTiebreakerGroupReport {
  tiedTeamIds: string[];
  startRank: number;
  ruleCitation: string;
  decidingCriterion: string;
  decidingStatLabel: string;
  explanation: string;
  playoffSetRequired: boolean;
  playoffSetDetails?: string;
  teamAudits: {
    teamId: string;
    schoolName: string;
    seed: number;
    rank: number;
    reason: string;
    h2hMatchesRecord: string;
    h2hMatchRatioStr: string;
    h2hSetsRecord: string;
    h2hSetRatioStr: string;
    allSetsRecord: string;
    allSetRatioStr: string;
    h2hPointsRecord: string;
    h2hPointRatioStr: string;
    allPointsRecord: string;
    allPointRatioStr: string;
    pointDiffStr: string;
  }[];
}

export interface PoolTiebreakerReport {
  poolId: PoolId;
  hasTie: boolean;
  reports: PoolTiebreakerGroupReport[];
}

export interface TeamStanding {
  teamId: string;
  team: Team;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  setsWon: number;
  setsLost: number;
  setRatio: number; // setsWon / setsLost
  pointsFor: number;
  pointsAgainst: number;
  pointRatio: number; // pointsFor / pointsAgainst
  rank: number;
  tiebreakerReason?: string;
  isTied?: boolean;
  tiebreakMath?: TiebreakMathData;
  advancementStatus: 'championship_qf' | 'consolation_qf' | 'eliminated' | 'pending';
  clinchedRank?: number | null;
  isClinched?: boolean;
}

export interface TiebreakerAnalysis {
  tiedTeamIds: string[];
  resolved: boolean;
  explanation: string;
  tiebreakerSetRequired: boolean;
  tiebreakerSetDetails?: string;
}

export interface TournamentData {
  id: string;
  name: string;
  classification: string; // 'AAA', 'AA', 'A'
  gender: string; // "Boys'" or "Girls'"
  year: number | string;
  format: TournamentFormat;
  dates: string;
  location: string;
  venues: string[];
  mainVenue: string;
  teams: Team[];
  matches: Match[];
  adminUsername: string;
  adminPasswordHash: string; // simple password stored for convenor access
  lastUpdated: string;
  isSkeletonMode: boolean; // whether initialized in skeleton state
}
