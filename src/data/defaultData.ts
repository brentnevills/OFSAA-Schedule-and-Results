import { Match, PoolId, Team, TournamentData, TournamentFormat } from '../types/tournament';
import { OFSAA_SEEDING_MAP_20, OFSAA_SEEDING_MAP_16 } from '../utils/ofsaaTiebreaker';

export const ONTARIO_ASSOCIATIONS = [
  'SWOSSAA', // Southwestern Ontario (Host Association)
  'CWOSSA',  // Central Western Ontario
  'SOSSA',   // Southern Ontario
  'GHAC',    // Golden Horseshoe
  'ROPSSAA', // Region of Peel
  'TDCAA',   // Toronto Catholic
  'TSSAA',   // Toronto
  'YRAA',    // York Region
  'LOSSA',   // Lake Ontario
  'COSSA',   // Central Ontario
  'GBSSA',   // Georgian Bay
  'EOSSAA',  // Eastern Ontario
  'NCSSAA',  // National Capital
  'NOSSA',   // Northern Ontario
  'NEOAA',   // North Eastern Ontario
  'NWOSSAA', // North Western Ontario
];

// Venues are simplified and can be customized/assigned by convenor when ready
export const DEFAULT_VENUES = ['Main Gym (Court 1)', 'Secondary Gym (Court 2)'];

// Clean professional athletic colors emphasizing Ursuline College Chatham (UCC Navy & Sky Blue)
export const TEAM_COLOR_PALETTES: { label: string; primary: string; secondary: string }[] = [
  { label: 'UCC Navy & Sky Blue', primary: '#0b2341', secondary: '#38bdf8' },
  { label: 'Royal & White', primary: '#1d4ed8', secondary: '#93c5fd' },
  { label: 'Forest Green & Gold', primary: '#166534', secondary: '#facc15' },
  { label: 'Crimson & Silver', primary: '#991b1b', secondary: '#e2e8f0' },
  { label: 'Deep Purple & White', primary: '#581c87', secondary: '#e9d5ff' },
  { label: 'Midnight Black & Red', primary: '#18181b', secondary: '#ef4444' },
  { label: 'Dark Navy & Gold', primary: '#0f172a', secondary: '#eab308' },
  { label: 'Cardinal & White', primary: '#881337', secondary: '#fecdd3' },
  { label: 'Steel Blue & White', primary: '#0369a1', secondary: '#bae6fd' },
  { label: 'Emerald & White', primary: '#047857', secondary: '#a7f3d0' },
  { label: 'Maroon & Gold', primary: '#701a75', secondary: '#fde047' },
  { label: 'Charcoal & Sky', primary: '#334155', secondary: '#7dd3fc' },
];

export function generateSkeletonTeams(format: TournamentFormat = '20-team'): Team[] {
  const count = format === '20-team' ? 20 : 16;
  const map = format === '20-team' ? OFSAA_SEEDING_MAP_20 : OFSAA_SEEDING_MAP_16;
  const teams: Team[] = [];

  for (let seed = 1; seed <= count; seed++) {
    let pool: PoolId = 'A';
    let slot = 'A1';

    for (const p of ['A', 'B', 'C', 'D'] as PoolId[]) {
      const idx = map[p].indexOf(seed);
      if (idx !== -1) {
        pool = p;
        slot = `${p}${idx + 1}`;
        break;
      }
    }

    const palette = TEAM_COLOR_PALETTES[(seed - 1) % TEAM_COLOR_PALETTES.length];

    teams.push({
      id: slot,
      seed,
      pool,
      poolSlot: slot,
      name: `Seed ${seed} (TBD)`,
      schoolName: `Qualifier ${seed}`,
      teamNickname: '',
      association: ONTARIO_ASSOCIATIONS[(seed - 1) % ONTARIO_ASSOCIATIONS.length],
      logoUrl: '', // Ready for user to insert logo URL or upload image
      accentColor: palette.primary,
      isQualified: false,
    });
  }

  return teams;
}

// Generate the official OFSAA schedule matches (Day 1 & Day 2 Round Robin + Playoffs)
// Venues are left blank/TBD by default so the convenor can edit them later
export function generateScheduleMatches(format: TournamentFormat = '20-team'): Match[] {
  const matches: Match[] = [];

  if (format === '20-team') {
    // DAY 1 - ROUND ROBIN (20 teams)
    // 9:00 AM
    matches.push(
      { id: 'RR-1', stage: 'pool', pool: 'A', matchNumber: 1, day: 1, dayLabel: 'Day 1 - Thursday', time: '9:00 AM', court: '', team1Id: 'A1', team2Id: 'A5', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-2', stage: 'pool', pool: 'A', matchNumber: 2, day: 1, dayLabel: 'Day 1 - Thursday', time: '9:00 AM', court: '', team1Id: 'A2', team2Id: 'A4', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-3', stage: 'pool', pool: 'C', matchNumber: 3, day: 1, dayLabel: 'Day 1 - Thursday', time: '9:00 AM', court: '', team1Id: 'C2', team2Id: 'C4', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-4', stage: 'pool', pool: 'C', matchNumber: 4, day: 1, dayLabel: 'Day 1 - Thursday', time: '9:00 AM', court: '', team1Id: 'C1', team2Id: 'C5', status: 'scheduled', bestOf: 3, sets: [] }
    );
    // 10:30 AM
    matches.push(
      { id: 'RR-5', stage: 'pool', pool: 'B', matchNumber: 5, day: 1, dayLabel: 'Day 1 - Thursday', time: '10:30 AM', court: '', team1Id: 'B1', team2Id: 'B5', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-6', stage: 'pool', pool: 'B', matchNumber: 6, day: 1, dayLabel: 'Day 1 - Thursday', time: '10:30 AM', court: '', team1Id: 'B2', team2Id: 'B4', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-7', stage: 'pool', pool: 'D', matchNumber: 7, day: 1, dayLabel: 'Day 1 - Thursday', time: '10:30 AM', court: '', team1Id: 'D2', team2Id: 'D4', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-8', stage: 'pool', pool: 'D', matchNumber: 8, day: 1, dayLabel: 'Day 1 - Thursday', time: '10:30 AM', court: '', team1Id: 'D1', team2Id: 'D5', status: 'scheduled', bestOf: 3, sets: [] }
    );
    // 12:00 PM
    matches.push(
      { id: 'RR-9', stage: 'pool', pool: 'C', matchNumber: 9, day: 1, dayLabel: 'Day 1 - Thursday', time: '12:00 PM', court: '', team1Id: 'C2', team2Id: 'C3', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-10', stage: 'pool', pool: 'C', matchNumber: 10, day: 1, dayLabel: 'Day 1 - Thursday', time: '12:00 PM', court: '', team1Id: 'C1', team2Id: 'C4', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-11', stage: 'pool', pool: 'A', matchNumber: 11, day: 1, dayLabel: 'Day 1 - Thursday', time: '12:00 PM', court: '', team1Id: 'A2', team2Id: 'A3', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-12', stage: 'pool', pool: 'A', matchNumber: 12, day: 1, dayLabel: 'Day 1 - Thursday', time: '12:00 PM', court: '', team1Id: 'A1', team2Id: 'A4', status: 'scheduled', bestOf: 3, sets: [] }
    );
    // 1:30 PM
    matches.push(
      { id: 'RR-13', stage: 'pool', pool: 'D', matchNumber: 13, day: 1, dayLabel: 'Day 1 - Thursday', time: '1:30 PM', court: '', team1Id: 'D2', team2Id: 'D3', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-14', stage: 'pool', pool: 'D', matchNumber: 14, day: 1, dayLabel: 'Day 1 - Thursday', time: '1:30 PM', court: '', team1Id: 'D1', team2Id: 'D4', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-15', stage: 'pool', pool: 'B', matchNumber: 15, day: 1, dayLabel: 'Day 1 - Thursday', time: '1:30 PM', court: '', team1Id: 'B2', team2Id: 'B3', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-16', stage: 'pool', pool: 'B', matchNumber: 16, day: 1, dayLabel: 'Day 1 - Thursday', time: '1:30 PM', court: '', team1Id: 'B1', team2Id: 'B4', status: 'scheduled', bestOf: 3, sets: [] }
    );
    // 3:00 PM
    matches.push(
      { id: 'RR-17', stage: 'pool', pool: 'A', matchNumber: 17, day: 1, dayLabel: 'Day 1 - Thursday', time: '3:00 PM', court: '', team1Id: 'A3', team2Id: 'A5', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-18', stage: 'pool', pool: 'A', matchNumber: 18, day: 1, dayLabel: 'Day 1 - Thursday', time: '3:00 PM', court: '', team1Id: 'A1', team2Id: 'A2', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-19', stage: 'pool', pool: 'C', matchNumber: 19, day: 1, dayLabel: 'Day 1 - Thursday', time: '3:00 PM', court: '', team1Id: 'C1', team2Id: 'C2', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-20', stage: 'pool', pool: 'C', matchNumber: 20, day: 1, dayLabel: 'Day 1 - Thursday', time: '3:00 PM', court: '', team1Id: 'C3', team2Id: 'C5', status: 'scheduled', bestOf: 3, sets: [] }
    );
    // 4:30 PM
    matches.push(
      { id: 'RR-21', stage: 'pool', pool: 'B', matchNumber: 21, day: 1, dayLabel: 'Day 1 - Thursday', time: '4:30 PM', court: '', team1Id: 'B3', team2Id: 'B5', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-22', stage: 'pool', pool: 'B', matchNumber: 22, day: 1, dayLabel: 'Day 1 - Thursday', time: '4:30 PM', court: '', team1Id: 'B1', team2Id: 'B2', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-23', stage: 'pool', pool: 'D', matchNumber: 23, day: 1, dayLabel: 'Day 1 - Thursday', time: '4:30 PM', court: '', team1Id: 'D1', team2Id: 'D2', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-24', stage: 'pool', pool: 'D', matchNumber: 24, day: 1, dayLabel: 'Day 1 - Thursday', time: '4:30 PM', court: '', team1Id: 'D3', team2Id: 'D5', status: 'scheduled', bestOf: 3, sets: [] }
    );

    // DAY 2 - ROUND ROBIN (20 teams)
    // 8:30 AM
    matches.push(
      { id: 'RR-25', stage: 'pool', pool: 'C', matchNumber: 25, day: 2, dayLabel: 'Day 2 - Friday', time: '8:30 AM', court: '', team1Id: 'C4', team2Id: 'C5', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-26', stage: 'pool', pool: 'A', matchNumber: 26, day: 2, dayLabel: 'Day 2 - Friday', time: '8:30 AM', court: '', team1Id: 'A1', team2Id: 'A3', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-27', stage: 'pool', pool: 'C', matchNumber: 27, day: 2, dayLabel: 'Day 2 - Friday', time: '8:30 AM', court: '', team1Id: 'C1', team2Id: 'C3', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-28', stage: 'pool', pool: 'A', matchNumber: 28, day: 2, dayLabel: 'Day 2 - Friday', time: '8:30 AM', court: '', team1Id: 'A4', team2Id: 'A5', status: 'scheduled', bestOf: 3, sets: [] }
    );
    // 10:00 AM
    matches.push(
      { id: 'RR-29', stage: 'pool', pool: 'D', matchNumber: 29, day: 2, dayLabel: 'Day 2 - Friday', time: '10:00 AM', court: '', team1Id: 'D4', team2Id: 'D5', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-30', stage: 'pool', pool: 'B', matchNumber: 30, day: 2, dayLabel: 'Day 2 - Friday', time: '10:00 AM', court: '', team1Id: 'B1', team2Id: 'B3', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-31', stage: 'pool', pool: 'D', matchNumber: 31, day: 2, dayLabel: 'Day 2 - Friday', time: '10:00 AM', court: '', team1Id: 'D1', team2Id: 'D3', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-32', stage: 'pool', pool: 'B', matchNumber: 32, day: 2, dayLabel: 'Day 2 - Friday', time: '10:00 AM', court: '', team1Id: 'B4', team2Id: 'B5', status: 'scheduled', bestOf: 3, sets: [] }
    );
    // 11:30 AM
    matches.push(
      { id: 'RR-33', stage: 'pool', pool: 'A', matchNumber: 33, day: 2, dayLabel: 'Day 2 - Friday', time: '11:30 AM', court: '', team1Id: 'A3', team2Id: 'A4', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-34', stage: 'pool', pool: 'C', matchNumber: 34, day: 2, dayLabel: 'Day 2 - Friday', time: '11:30 AM', court: '', team1Id: 'C2', team2Id: 'C5', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-35', stage: 'pool', pool: 'A', matchNumber: 35, day: 2, dayLabel: 'Day 2 - Friday', time: '11:30 AM', court: '', team1Id: 'A2', team2Id: 'A5', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-36', stage: 'pool', pool: 'C', matchNumber: 36, day: 2, dayLabel: 'Day 2 - Friday', time: '11:30 AM', court: '', team1Id: 'C3', team2Id: 'C4', status: 'scheduled', bestOf: 3, sets: [] }
    );
    // 1:00 PM
    matches.push(
      { id: 'RR-37', stage: 'pool', pool: 'B', matchNumber: 37, day: 2, dayLabel: 'Day 2 - Friday', time: '1:00 PM', court: '', team1Id: 'B3', team2Id: 'B4', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-38', stage: 'pool', pool: 'D', matchNumber: 38, day: 2, dayLabel: 'Day 2 - Friday', time: '1:00 PM', court: '', team1Id: 'D2', team2Id: 'D5', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-39', stage: 'pool', pool: 'B', matchNumber: 39, day: 2, dayLabel: 'Day 2 - Friday', time: '1:00 PM', court: '', team1Id: 'B2', team2Id: 'B5', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-40', stage: 'pool', pool: 'D', matchNumber: 40, day: 2, dayLabel: 'Day 2 - Friday', time: '1:00 PM', court: '', team1Id: 'D3', team2Id: 'D4', status: 'scheduled', bestOf: 3, sets: [] }
    );
  }

  // DAY 2 PLAYOFFS: CONSOLATION QUARTERFINALS (3:00 PM)
  matches.push(
    {
      id: 'CQF-1',
      stage: 'consolation_qf',
      matchNumber: 'CQF1',
      name: 'Consolation Quarterfinal 1 (G1)',
      day: 2,
      dayLabel: 'Day 2 - Friday',
      time: '3:00 PM',
      court: '',
      team1Id: 'TBD',
      team2Id: 'TBD',
      team1Placeholder: '3rd Pool A',
      team2Placeholder: '4th Pool B',
      status: 'scheduled',
      bestOf: 5,
      sets: [],
    },
    {
      id: 'CQF-2',
      stage: 'consolation_qf',
      matchNumber: 'CQF2',
      name: 'Consolation Quarterfinal 2 (G2)',
      day: 2,
      dayLabel: 'Day 2 - Friday',
      time: '3:00 PM',
      court: '',
      team1Id: 'TBD',
      team2Id: 'TBD',
      team1Placeholder: '3rd Pool D',
      team2Placeholder: '4th Pool C',
      status: 'scheduled',
      bestOf: 5,
      sets: [],
    },
    {
      id: 'CQF-3',
      stage: 'consolation_qf',
      matchNumber: 'CQF3',
      name: 'Consolation Quarterfinal 3 (G3)',
      day: 2,
      dayLabel: 'Day 2 - Friday',
      time: '3:00 PM',
      court: '',
      team1Id: 'TBD',
      team2Id: 'TBD',
      team1Placeholder: '3rd Pool C',
      team2Placeholder: '4th Pool D',
      status: 'scheduled',
      bestOf: 5,
      sets: [],
    },
    {
      id: 'CQF-4',
      stage: 'consolation_qf',
      matchNumber: 'CQF4',
      name: 'Consolation Quarterfinal 4 (G4)',
      day: 2,
      dayLabel: 'Day 2 - Friday',
      time: '3:00 PM',
      court: '',
      team1Id: 'TBD',
      team2Id: 'TBD',
      team1Placeholder: '3rd Pool B',
      team2Placeholder: '4th Pool A',
      status: 'scheduled',
      bestOf: 5,
      sets: [],
    }
  );

  // DAY 2 PLAYOFFS: CHAMPIONSHIP QUARTERFINALS (5:00 PM)
  matches.push(
    {
      id: 'HQF-1',
      stage: 'championship_qf',
      matchNumber: 'HQF1',
      name: 'Championship Quarterfinal 1 (G5)',
      day: 2,
      dayLabel: 'Day 2 - Friday',
      time: '5:00 PM',
      court: '',
      team1Id: 'TBD',
      team2Id: 'TBD',
      team1Placeholder: '1st Pool A',
      team2Placeholder: '2nd Pool B',
      status: 'scheduled',
      bestOf: 5,
      sets: [],
    },
    {
      id: 'HQF-2',
      stage: 'championship_qf',
      matchNumber: 'HQF2',
      name: 'Championship Quarterfinal 2 (G6)',
      day: 2,
      dayLabel: 'Day 2 - Friday',
      time: '5:00 PM',
      court: '',
      team1Id: 'TBD',
      team2Id: 'TBD',
      team1Placeholder: '1st Pool D',
      team2Placeholder: '2nd Pool C',
      status: 'scheduled',
      bestOf: 5,
      sets: [],
    },
    {
      id: 'HQF-3',
      stage: 'championship_qf',
      matchNumber: 'HQF3',
      name: 'Championship Quarterfinal 3 (G7)',
      day: 2,
      dayLabel: 'Day 2 - Friday',
      time: '5:00 PM',
      court: '',
      team1Id: 'TBD',
      team2Id: 'TBD',
      team1Placeholder: '1st Pool C',
      team2Placeholder: '2nd Pool D',
      status: 'scheduled',
      bestOf: 5,
      sets: [],
    },
    {
      id: 'HQF-4',
      stage: 'championship_qf',
      matchNumber: 'HQF4',
      name: 'Championship Quarterfinal 4 (G8)',
      day: 2,
      dayLabel: 'Day 2 - Friday',
      time: '5:00 PM',
      court: '',
      team1Id: 'TBD',
      team2Id: 'TBD',
      team1Placeholder: '1st Pool B',
      team2Placeholder: '2nd Pool A',
      status: 'scheduled',
      bestOf: 5,
      sets: [],
    }
  );

  // DAY 3 PLAYOFFS: SATURDAY
  // 9:00 AM Consolation Semifinals
  matches.push(
    {
      id: 'CSF-1',
      stage: 'consolation_sf',
      matchNumber: 'CSF1',
      name: 'Consolation Semifinal 1',
      day: 3,
      dayLabel: 'Day 3 - Saturday',
      time: '9:00 AM',
      court: '',
      team1Id: 'TBD',
      team2Id: 'TBD',
      team1Placeholder: 'Winner G1 (3A/4B)',
      team2Placeholder: 'Winner G2 (3D/4C)',
      status: 'scheduled',
      bestOf: 5,
      sets: [],
    },
    {
      id: 'CSF-2',
      stage: 'consolation_sf',
      matchNumber: 'CSF2',
      name: 'Consolation Semifinal 2',
      day: 3,
      dayLabel: 'Day 3 - Saturday',
      time: '9:00 AM',
      court: '',
      team1Id: 'TBD',
      team2Id: 'TBD',
      team1Placeholder: 'Winner G3 (3C/4D)',
      team2Placeholder: 'Winner G4 (3B/4A)',
      status: 'scheduled',
      bestOf: 5,
      sets: [],
    }
  );

  // 11:00 AM Championship Semifinals
  matches.push(
    {
      id: 'HSF-1',
      stage: 'championship_sf',
      matchNumber: 'HSF1',
      name: 'Championship Semifinal 1',
      day: 3,
      dayLabel: 'Day 3 - Saturday',
      time: '11:00 AM',
      court: '',
      team1Id: 'TBD',
      team2Id: 'TBD',
      team1Placeholder: 'Winner G5 (1A/2B)',
      team2Placeholder: 'Winner G6 (1D/2C)',
      status: 'scheduled',
      bestOf: 5,
      sets: [],
    },
    {
      id: 'HSF-2',
      stage: 'championship_sf',
      matchNumber: 'HSF2',
      name: 'Championship Semifinal 2',
      day: 3,
      dayLabel: 'Day 3 - Saturday',
      time: '11:00 AM',
      court: '',
      team1Id: 'TBD',
      team2Id: 'TBD',
      team1Placeholder: 'Winner G7 (1C/2D)',
      team2Placeholder: 'Winner G8 (1B/2A)',
      status: 'scheduled',
      bestOf: 5,
      sets: [],
    }
  );

  // 1:00 PM Consolation Final
  matches.push({
    id: 'CFIN',
    stage: 'consolation_final',
    matchNumber: 'CFIN',
    name: 'Consolation Final (Plaque Match)',
    day: 3,
    dayLabel: 'Day 3 - Saturday',
    time: '1:00 PM',
    court: '',
    team1Id: 'TBD',
    team2Id: 'TBD',
    team1Placeholder: 'Winner Consolation Semi 1',
    team2Placeholder: 'Winner Consolation Semi 2',
    status: 'scheduled',
    bestOf: 5,
    sets: [],
  });

  // 3:00 PM Bronze Medal Match
  matches.push({
    id: 'BRONZE',
    stage: 'bronze',
    matchNumber: 'BRONZE',
    name: 'OFSAA Bronze Medal Match (3rd Place)',
    day: 3,
    dayLabel: 'Day 3 - Saturday',
    time: '3:00 PM',
    court: '',
    team1Id: 'TBD',
    team2Id: 'TBD',
    team1Placeholder: 'Loser Championship Semi 1',
    team2Placeholder: 'Loser Championship Semi 2',
    status: 'scheduled',
    bestOf: 5,
    sets: [],
  });

  // 5:00 PM Gold Medal Championship Match
  matches.push({
    id: 'GOLD',
    stage: 'gold',
    matchNumber: 'GOLD',
    name: 'OFSAA Gold Medal Championship Match',
    day: 3,
    dayLabel: 'Day 3 - Saturday',
    time: '5:00 PM',
    court: '',
    team1Id: 'TBD',
    team2Id: 'TBD',
    team1Placeholder: 'Winner Championship Semi 1',
    team2Placeholder: 'Winner Championship Semi 2',
    status: 'scheduled',
    bestOf: 5,
    sets: [],
  });

  return matches;
}

export function createSkeletonTournament(format: TournamentFormat = '20-team'): TournamentData {
  return {
    id: 'ofsaa-2026',
    name: 'OFSAA Boys AAA Volleyball 2026 Championship',
    classification: 'AAA',
    gender: "Boys'",
    year: '2026',
    format,
    dates: 'Thursday, November 26 – Saturday, November 28, 2026',
    location: 'Chatham-Kent, Ontario',
    venues: [], // Venues removed for now, convenor can edit later
    mainVenue: 'Ursuline College Chatham',
    teams: generateSkeletonTeams(format),
    matches: generateScheduleMatches(format),
    adminUsername: 'convenor',
    adminPasswordHash: 'ofsaa2026',
    lastUpdated: new Date().toISOString(),
    isSkeletonMode: true,
  };
}

export function createDemoTournament(format: TournamentFormat = '20-team'): TournamentData {
  const data = createSkeletonTournament(format);
  data.isSkeletonMode = false;

  // Realistic sample schools with Ursuline College Chatham (UCC Lancers) featured
  const sampleSchools = [
    { seed: 1, school: 'Ursuline College Chatham', name: 'Lancers', assoc: 'SWOSSAA', color: '#0b2341' },
    { seed: 2, school: 'Eden HS', name: 'Flyers', assoc: 'SOSSA', color: '#166534' },
    { seed: 3, school: 'Bill Crothers SS', name: 'Colts', assoc: 'YRAA', color: '#991b1b' },
    { seed: 4, school: 'Uxbridge SS', name: 'Tigers', assoc: 'LOSSA', color: '#ea580c' },
    { seed: 5, school: 'Catholic Central HS (CCH)', name: 'Crusaders', assoc: 'SWOSSAA', color: '#581c87' },
    { seed: 6, school: 'Oakville Trafalgar HS', name: 'Red Devils', assoc: 'GHAC', color: '#dc2626' },
    { seed: 7, school: 'St. Joseph’s CHS', name: 'Lasers', assoc: 'SWOSSAA', color: '#0284c7' },
    { seed: 8, school: 'Kingston CVI', name: 'Blues', assoc: 'EOSSAA', color: '#1d4ed8' },
    { seed: 9, school: 'Westdale SS', name: 'Warriors', assoc: 'SOSSA', color: '#4338ca' },
    { seed: 10, school: 'Glebe CI', name: 'Gryphons', assoc: 'NCSSAA', color: '#059669' },
    { seed: 11, school: 'Assumption CSS', name: 'Raiders', assoc: 'SWOSSAA', color: '#6d28d9' },
    { seed: 12, school: 'Chaminade College', name: 'Gryphons', assoc: 'TDCAA', color: '#0f766e' },
    { seed: 13, school: 'Lockerby Composite', name: 'Vikings', assoc: 'NOSSA', color: '#b45309' },
    { seed: 14, school: 'St. Michael’s College', name: 'Blue Buzzers', assoc: 'TDCAA', color: '#2563eb' },
    { seed: 15, school: 'Waterloo CI', name: 'Vikings', assoc: 'CWOSSA', color: '#0369a1' },
    { seed: 16, school: 'St. Francis Xavier', name: 'Tigers', assoc: 'ROPSSAA', color: '#c2410c' },
    { seed: 17, school: 'Sir Winston Churchill', name: 'Bulldogs', assoc: 'SOSSA', color: '#475569' },
    { seed: 18, school: 'Eastview SS', name: 'Wildcats', assoc: 'GBSSA', color: '#15803d' },
    { seed: 19, school: 'St. Peter CHS', name: 'Knights', assoc: 'NCSSAA', color: '#9333ea' },
    { seed: 20, school: 'Westgate CVI', name: 'Tigers', assoc: 'NWOSSAA', color: '#d97706' },
  ];

  data.teams = data.teams.map((t) => {
    const s = sampleSchools.find((d) => d.seed === t.seed);
    if (s) {
      return {
        ...t,
        name: `${s.school} ${s.name}`,
        schoolName: s.school,
        teamNickname: s.name,
        association: s.assoc,
        logoUrl: '',
        accentColor: s.color,
        isQualified: true,
      };
    }
    return t;
  });

  return data;
}
