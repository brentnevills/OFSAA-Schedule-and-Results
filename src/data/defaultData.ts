import { Match, PoolId, Team, TournamentData, TournamentFormat } from '../types/tournament';
import { OFSAA_SEEDING_MAP_20, OFSAA_SEEDING_MAP_16 } from '../utils/ofsaaTiebreaker';

export const ONTARIO_ASSOCIATIONS = [
  'SWOSSAA', // Southwestern Ontario
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

export const VENUES = [
  'St. Anne (Court 1)',
  "St. Joe's (Court 2)",
  'CCH (Court 3)',
  'Assumption (Court 4)',
];

export const VENUE_NAMES = ['St. Anne', "St. Joe's", 'CCH', 'Assumption'];

export const LOGO_PRESETS: { label: string; icon: string; color: string }[] = [
  { label: 'Volleyball Gold', icon: '🏐', color: '#f59e0b' },
  { label: 'Blue Eagles', icon: '🦅', color: '#2563eb' },
  { label: 'Red Lions', icon: '🦁', color: '#dc2626' },
  { label: 'Green Knights', icon: '⚔️', color: '#16a34a' },
  { label: 'Purple Saints', icon: '👑', color: '#7c3aed' },
  { label: 'Golden Hawks', icon: '⚡', color: '#d97706' },
  { label: 'Black Bears', icon: '🐻', color: '#1f2937' },
  { label: 'Crimson Crusaders', icon: '🛡️', color: '#991b1b' },
  { label: 'Navy Rams', icon: '🐏', color: '#1e3a8a' },
  { label: 'Orange Tigers', icon: '🐯', color: '#ea580c' },
  { label: 'Silver Falcons', icon: '🦅', color: '#4b5563' },
  { label: 'Teal Waves', icon: '🌊', color: '#0d9488' },
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

    const preset = LOGO_PRESETS[(seed - 1) % LOGO_PRESETS.length];

    teams.push({
      id: slot,
      seed,
      pool,
      poolSlot: slot,
      name: `TBD (Seed #${seed})`,
      schoolName: `Qualifier #${seed}`,
      teamNickname: `Seed ${seed}`,
      association: ONTARIO_ASSOCIATIONS[(seed - 1) % ONTARIO_ASSOCIATIONS.length],
      logoUrl: preset.icon,
      accentColor: preset.color,
      isQualified: false,
    });
  }

  return teams;
}

// Generate the official OFSAA schedule matches (Day 1 & Day 2 Round Robin + Playoffs)
export function generateScheduleMatches(format: TournamentFormat = '20-team'): Match[] {
  const matches: Match[] = [];

  if (format === '20-team') {
    // DAY 1 - ROUND ROBIN (20 teams - 4 courts)
    // 9:00 AM
    matches.push(
      { id: 'RR-1', stage: 'pool', pool: 'A', day: 1, dayLabel: 'Day 1 - Thursday', time: '9:00 AM', court: 'St. Anne', team1Id: 'A1', team2Id: 'A5', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-2', stage: 'pool', pool: 'A', day: 1, dayLabel: 'Day 1 - Thursday', time: '9:00 AM', court: "St. Joe's", team1Id: 'A2', team2Id: 'A4', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-3', stage: 'pool', pool: 'C', day: 1, dayLabel: 'Day 1 - Thursday', time: '9:00 AM', court: 'CCH', team1Id: 'C2', team2Id: 'C4', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-4', stage: 'pool', pool: 'C', day: 1, dayLabel: 'Day 1 - Thursday', time: '9:00 AM', court: 'Assumption', team1Id: 'C1', team2Id: 'C5', status: 'scheduled', bestOf: 3, sets: [] }
    );
    // 10:30 AM
    matches.push(
      { id: 'RR-5', stage: 'pool', pool: 'B', day: 1, dayLabel: 'Day 1 - Thursday', time: '10:30 AM', court: 'St. Anne', team1Id: 'B1', team2Id: 'B5', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-6', stage: 'pool', pool: 'B', day: 1, dayLabel: 'Day 1 - Thursday', time: '10:30 AM', court: "St. Joe's", team1Id: 'B2', team2Id: 'B4', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-7', stage: 'pool', pool: 'D', day: 1, dayLabel: 'Day 1 - Thursday', time: '10:30 AM', court: 'CCH', team1Id: 'D2', team2Id: 'D4', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-8', stage: 'pool', pool: 'D', day: 1, dayLabel: 'Day 1 - Thursday', time: '10:30 AM', court: 'Assumption', team1Id: 'D1', team2Id: 'D5', status: 'scheduled', bestOf: 3, sets: [] }
    );
    // 12:00 PM
    matches.push(
      { id: 'RR-9', stage: 'pool', pool: 'C', day: 1, dayLabel: 'Day 1 - Thursday', time: '12:00 PM', court: 'St. Anne', team1Id: 'C2', team2Id: 'C3', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-10', stage: 'pool', pool: 'C', day: 1, dayLabel: 'Day 1 - Thursday', time: '12:00 PM', court: "St. Joe's", team1Id: 'C1', team2Id: 'C4', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-11', stage: 'pool', pool: 'A', day: 1, dayLabel: 'Day 1 - Thursday', time: '12:00 PM', court: 'CCH', team1Id: 'A2', team2Id: 'A3', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-12', stage: 'pool', pool: 'A', day: 1, dayLabel: 'Day 1 - Thursday', time: '12:00 PM', court: 'Assumption', team1Id: 'A1', team2Id: 'A4', status: 'scheduled', bestOf: 3, sets: [] }
    );
    // 1:30 PM
    matches.push(
      { id: 'RR-13', stage: 'pool', pool: 'D', day: 1, dayLabel: 'Day 1 - Thursday', time: '1:30 PM', court: 'St. Anne', team1Id: 'D2', team2Id: 'D3', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-14', stage: 'pool', pool: 'D', day: 1, dayLabel: 'Day 1 - Thursday', time: '1:30 PM', court: "St. Joe's", team1Id: 'D1', team2Id: 'D4', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-15', stage: 'pool', pool: 'B', day: 1, dayLabel: 'Day 1 - Thursday', time: '1:30 PM', court: 'CCH', team1Id: 'B2', team2Id: 'B3', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-16', stage: 'pool', pool: 'B', day: 1, dayLabel: 'Day 1 - Thursday', time: '1:30 PM', court: 'Assumption', team1Id: 'B1', team2Id: 'B4', status: 'scheduled', bestOf: 3, sets: [] }
    );
    // 3:00 PM
    matches.push(
      { id: 'RR-17', stage: 'pool', pool: 'A', day: 1, dayLabel: 'Day 1 - Thursday', time: '3:00 PM', court: 'St. Anne', team1Id: 'A3', team2Id: 'A5', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-18', stage: 'pool', pool: 'A', day: 1, dayLabel: 'Day 1 - Thursday', time: '3:00 PM', court: "St. Joe's", team1Id: 'A1', team2Id: 'A2', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-19', stage: 'pool', pool: 'C', day: 1, dayLabel: 'Day 1 - Thursday', time: '3:00 PM', court: 'CCH', team1Id: 'C1', team2Id: 'C2', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-20', stage: 'pool', pool: 'C', day: 1, dayLabel: 'Day 1 - Thursday', time: '3:00 PM', court: 'Assumption', team1Id: 'C3', team2Id: 'C5', status: 'scheduled', bestOf: 3, sets: [] }
    );
    // 4:30 PM
    matches.push(
      { id: 'RR-21', stage: 'pool', pool: 'B', day: 1, dayLabel: 'Day 1 - Thursday', time: '4:30 PM', court: 'St. Anne', team1Id: 'B3', team2Id: 'B5', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-22', stage: 'pool', pool: 'B', day: 1, dayLabel: 'Day 1 - Thursday', time: '4:30 PM', court: "St. Joe's", team1Id: 'B1', team2Id: 'B2', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-23', stage: 'pool', pool: 'D', day: 1, dayLabel: 'Day 1 - Thursday', time: '4:30 PM', court: 'CCH', team1Id: 'D1', team2Id: 'D2', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-24', stage: 'pool', pool: 'D', day: 1, dayLabel: 'Day 1 - Thursday', time: '4:30 PM', court: 'Assumption', team1Id: 'D3', team2Id: 'D5', status: 'scheduled', bestOf: 3, sets: [] }
    );

    // DAY 2 - ROUND ROBIN (20 teams - 4 courts)
    // 8:30 AM
    matches.push(
      { id: 'RR-25', stage: 'pool', pool: 'C', day: 2, dayLabel: 'Day 2 - Friday', time: '8:30 AM', court: 'St. Anne', team1Id: 'C4', team2Id: 'C5', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-26', stage: 'pool', pool: 'A', day: 2, dayLabel: 'Day 2 - Friday', time: '8:30 AM', court: "St. Joe's", team1Id: 'A1', team2Id: 'A3', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-27', stage: 'pool', pool: 'C', day: 2, dayLabel: 'Day 2 - Friday', time: '8:30 AM', court: 'CCH', team1Id: 'C1', team2Id: 'C3', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-28', stage: 'pool', pool: 'A', day: 2, dayLabel: 'Day 2 - Friday', time: '8:30 AM', court: 'Assumption', team1Id: 'A4', team2Id: 'A5', status: 'scheduled', bestOf: 3, sets: [] }
    );
    // 10:00 AM
    matches.push(
      { id: 'RR-29', stage: 'pool', pool: 'D', day: 2, dayLabel: 'Day 2 - Friday', time: '10:00 AM', court: 'St. Anne', team1Id: 'D4', team2Id: 'D5', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-30', stage: 'pool', pool: 'B', day: 2, dayLabel: 'Day 2 - Friday', time: '10:00 AM', court: "St. Joe's", team1Id: 'B1', team2Id: 'B3', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-31', stage: 'pool', pool: 'D', day: 2, dayLabel: 'Day 2 - Friday', time: '10:00 AM', court: 'CCH', team1Id: 'D1', team2Id: 'D3', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-32', stage: 'pool', pool: 'B', day: 2, dayLabel: 'Day 2 - Friday', time: '10:00 AM', court: 'Assumption', team1Id: 'B4', team2Id: 'B5', status: 'scheduled', bestOf: 3, sets: [] }
    );
    // 11:30 AM
    matches.push(
      { id: 'RR-33', stage: 'pool', pool: 'A', day: 2, dayLabel: 'Day 2 - Friday', time: '11:30 AM', court: 'St. Anne', team1Id: 'A3', team2Id: 'A4', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-34', stage: 'pool', pool: 'C', day: 2, dayLabel: 'Day 2 - Friday', time: '11:30 AM', court: "St. Joe's", team1Id: 'C2', team2Id: 'C5', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-35', stage: 'pool', pool: 'A', day: 2, dayLabel: 'Day 2 - Friday', time: '11:30 AM', court: 'CCH', team1Id: 'A2', team2Id: 'A5', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-36', stage: 'pool', pool: 'C', day: 2, dayLabel: 'Day 2 - Friday', time: '11:30 AM', court: 'Assumption', team1Id: 'C3', team2Id: 'C4', status: 'scheduled', bestOf: 3, sets: [] }
    );
    // 1:00 PM
    matches.push(
      { id: 'RR-37', stage: 'pool', pool: 'B', day: 2, dayLabel: 'Day 2 - Friday', time: '1:00 PM', court: 'St. Anne', team1Id: 'B3', team2Id: 'B4', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-38', stage: 'pool', pool: 'D', day: 2, dayLabel: 'Day 2 - Friday', time: '1:00 PM', court: "St. Joe's", team1Id: 'D2', team2Id: 'D5', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-39', stage: 'pool', pool: 'B', day: 2, dayLabel: 'Day 2 - Friday', time: '1:00 PM', court: 'CCH', team1Id: 'B2', team2Id: 'B5', status: 'scheduled', bestOf: 3, sets: [] },
      { id: 'RR-40', stage: 'pool', pool: 'D', day: 2, dayLabel: 'Day 2 - Friday', time: '1:00 PM', court: 'Assumption', team1Id: 'D3', team2Id: 'D4', status: 'scheduled', bestOf: 3, sets: [] }
    );
  }

  // DAY 2 - PLAYOFFS (3/5 Matches)
  // 4:30 PM Consolation Quarterfinals
  matches.push(
    {
      id: 'CQF-1',
      stage: 'consolation_qf',
      matchNumber: 'G1',
      name: 'Consolation Quarterfinal 1',
      day: 2,
      dayLabel: 'Day 2 - Friday',
      time: '4:30 PM',
      court: 'St. Anne',
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
      matchNumber: 'G2',
      name: 'Consolation Quarterfinal 2',
      day: 2,
      dayLabel: 'Day 2 - Friday',
      time: '4:30 PM',
      court: "St. Joe's",
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
      matchNumber: 'G3',
      name: 'Consolation Quarterfinal 3',
      day: 2,
      dayLabel: 'Day 2 - Friday',
      time: '4:30 PM',
      court: 'CCH',
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
      matchNumber: 'G4',
      name: 'Consolation Quarterfinal 4',
      day: 2,
      dayLabel: 'Day 2 - Friday',
      time: '4:30 PM',
      court: 'Assumption',
      team1Id: 'TBD',
      team2Id: 'TBD',
      team1Placeholder: '3rd Pool B',
      team2Placeholder: '4th Pool A',
      status: 'scheduled',
      bestOf: 5,
      sets: [],
    }
  );

  // 6:30 PM Championship Quarterfinals
  matches.push(
    {
      id: 'HQF-1',
      stage: 'championship_qf',
      matchNumber: 'G5',
      name: 'Championship Quarterfinal 1',
      day: 2,
      dayLabel: 'Day 2 - Friday',
      time: '6:30 PM',
      court: 'St. Anne',
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
      matchNumber: 'G6',
      name: 'Championship Quarterfinal 2',
      day: 2,
      dayLabel: 'Day 2 - Friday',
      time: '6:30 PM',
      court: "St. Joe's",
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
      matchNumber: 'G7',
      name: 'Championship Quarterfinal 3',
      day: 2,
      dayLabel: 'Day 2 - Friday',
      time: '6:30 PM',
      court: 'CCH',
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
      matchNumber: 'G8',
      name: 'Championship Quarterfinal 4',
      day: 2,
      dayLabel: 'Day 2 - Friday',
      time: '6:30 PM',
      court: 'Assumption',
      team1Id: 'TBD',
      team2Id: 'TBD',
      team1Placeholder: '1st Pool B',
      team2Placeholder: '2nd Pool A',
      status: 'scheduled',
      bestOf: 5,
      sets: [],
    }
  );

  // DAY 3 - PLAYOFFS (3/5 Matches)
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
      court: "St. Joe's",
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
      court: 'CCH',
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
      court: "St. Joe's",
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
      court: 'CCH',
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
    court: 'St. Anne',
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
    court: 'St. Anne',
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
    court: 'St. Anne',
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
    name: "OFSAA Boys' AAA Volleyball Championship 2026",
    classification: 'AAA',
    gender: "Boys'",
    year: '2026',
    format,
    dates: 'Thursday, November 26 – Saturday, November 28, 2026',
    location: 'Windsor-Essex, Ontario',
    venues: VENUE_NAMES,
    mainVenue: 'St. Anne Catholic High School',
    teams: generateSkeletonTeams(format),
    matches: generateScheduleMatches(format),
    adminUsername: 'admin',
    adminPasswordHash: 'ofsaa2026',
    lastUpdated: new Date().toISOString(),
    isSkeletonMode: true,
  };
}

export function createDemoTournament(format: TournamentFormat = '20-team'): TournamentData {
  const data = createSkeletonTournament(format);
  data.isSkeletonMode = false;

  // Realistic Ontario High School Volleyball Teams
  const demoTeamsData = [
    { seed: 1, school: 'St. Anne CSS', name: 'Saints', assoc: 'SWOSSAA', icon: '👑', color: '#1e3a8a' },
    { seed: 2, school: 'Eden HS', name: 'Flyers', assoc: 'SOSSA', icon: '⚡', color: '#047857' },
    { seed: 3, school: 'Bill Crothers SS', name: 'Colts', assoc: 'YRAA', icon: '🐎', color: '#b91c1c' },
    { seed: 4, school: 'Uxbridge SS', name: 'Tigers', assoc: 'LOSSA', icon: '🐯', color: '#ea580c' },
    { seed: 5, school: 'Catholic Central HS (CCH)', name: 'Crusaders', assoc: 'SWOSSAA', icon: '🛡️', color: '#7c3aed' },
    { seed: 6, school: 'Oakville Trafalgar HS', name: 'Red Devils', assoc: 'GHAC', icon: '😈', color: '#dc2626' },
    { seed: 7, school: 'St. Joseph’s CHS', name: 'Lasers', assoc: 'SWOSSAA', icon: '⚡', color: '#0284c7' },
    { seed: 8, school: 'Kingston CVI', name: 'Blues', assoc: 'EOSSAA', icon: '🔷', color: '#1d4ed8' },
    { seed: 9, school: 'Westdale SS', name: 'Warriors', assoc: 'SOSSA', icon: '⚔️', color: '#4338ca' },
    { seed: 10, school: 'Glebe CI', name: 'Gryphons', assoc: 'NCSSAA', icon: '🦅', color: '#059669' },
    { seed: 11, school: 'Assumption CSS', name: 'Raiders', assoc: 'SWOSSAA', icon: '💜', color: '#6d28d9' },
    { seed: 12, school: 'Chaminade College', name: 'Gryphons', assoc: 'TDCAA', icon: '🦅', color: '#0f766e' },
    { seed: 13, school: 'Lockerby Composite', name: 'Vikings', assoc: 'NOSSA', icon: '🛡️', color: '#b45309' },
    { seed: 14, school: 'St. Michael’s College', name: 'Blue Buzzers', assoc: 'TDCAA', icon: '🐝', color: '#2563eb' },
    { seed: 15, school: 'Waterloo CI', name: 'Vikings', assoc: 'CWOSSA', icon: '⛵', color: '#0369a1' },
    { seed: 16, school: 'St. Francis Xavier', name: 'Tigers', assoc: 'ROPSSAA', icon: '🐅', color: '#c2410c' },
    { seed: 17, school: 'Sir Winston Churchill', name: 'Bulldogs', assoc: 'SOSSA', icon: '🐶', color: '#475569' },
    { seed: 18, school: 'Eastview SS', name: 'Wildcats', assoc: 'GBSSA', icon: '🐾', color: '#15803d' },
    { seed: 19, school: 'St. Peter CHS', name: 'Knights', assoc: 'NCSSAA', icon: '⚔️', color: '#9333ea' },
    { seed: 20, school: 'Westgate CVI', name: 'Tigers', assoc: 'NWOSSAA', icon: '🐯', color: '#d97706' },
  ];

  data.teams = data.teams.map((t) => {
    const demo = demoTeamsData.find((d) => d.seed === t.seed);
    if (demo) {
      return {
        ...t,
        name: `${demo.school} ${demo.name}`,
        schoolName: demo.school,
        teamNickname: demo.name,
        association: demo.assoc,
        logoUrl: demo.icon,
        accentColor: demo.color,
        isQualified: true,
      };
    }
    return t;
  });

  // Pre-seed some Day 1 match scores to demonstrate live standings & tiebreaker calculations!
  const scoresDemo: Record<string, { s1: [number, number]; s2: [number, number]; s3?: [number, number] }> = {
    'RR-1': { s1: [25, 18], s2: [25, 15] },          // A1 def A5 2-0
    'RR-2': { s1: [25, 23], s2: [22, 25], s3: [15, 11] }, // A2 def A4 2-1
    'RR-3': { s1: [25, 21], s2: [25, 19] },          // C2 def C4 2-0
    'RR-4': { s1: [25, 16], s2: [25, 20] },          // C1 def C5 2-0
    'RR-5': { s1: [25, 17], s2: [25, 21] },          // B1 def B5 2-0
    'RR-6': { s1: [25, 22], s2: [25, 18] },          // B2 def B4 2-0
    'RR-7': { s1: [25, 23], s2: [25, 20] },          // D2 def D4 2-0
    'RR-8': { s1: [25, 14], s2: [25, 17] },          // D1 def D5 2-0
    'RR-9': { s1: [23, 25], s2: [25, 20], s3: [15, 12] }, // C2 def C3 2-1
    'RR-10': { s1: [25, 19], s2: [25, 21] },         // C1 def C4 2-0
    'RR-11': { s1: [25, 20], s2: [25, 18] },         // A2 def A3 2-0
    'RR-12': { s1: [25, 17], s2: [25, 15] },         // A1 def A4 2-0
    'RR-13': { s1: [25, 21], s2: [22, 25], s3: [15, 13] }, // D2 def D3 2-1
    'RR-14': { s1: [25, 20], s2: [25, 16] },         // D1 def D4 2-0
    'RR-15': { s1: [25, 21], s2: [25, 19] },         // B2 def B3 2-0
    'RR-16': { s1: [25, 15], s2: [25, 18] },         // B1 def B4 2-0
    'RR-17': { s1: [25, 20], s2: [25, 22] },         // A3 def A5 2-0
    'RR-18': { s1: [25, 22], s2: [23, 25], s3: [15, 12] }, // A1 def A2 2-1
    'RR-19': { s1: [25, 20], s2: [25, 19] },         // C1 def C2 2-0
    'RR-20': { s1: [25, 18], s2: [25, 21] },         // C3 def C5 2-0
  };

  data.matches = data.matches.map((m) => {
    const sc = scoresDemo[m.id];
    if (sc) {
      const sets = [
        { setNumber: 1, team1Score: sc.s1[0], team2Score: sc.s1[1] },
        { setNumber: 2, team1Score: sc.s2[0], team2Score: sc.s2[1] },
      ];
      if (sc.s3) {
        sets.push({ setNumber: 3, team1Score: sc.s3[0], team2Score: sc.s3[1] });
      }

      let t1Wins = 0;
      let t2Wins = 0;
      sets.forEach((s) => {
        if (s.team1Score > s.team2Score) t1Wins++;
        else t2Wins++;
      });

      return {
        ...m,
        status: 'final' as const,
        sets,
        team1SetsWon: t1Wins,
        team2SetsWon: t2Wins,
        winnerId: t1Wins > t2Wins ? m.team1Id : m.team2Id,
        loserId: t1Wins > t2Wins ? m.team2Id : m.team1Id,
      };
    }
    return m;
  });

  return data;
}
