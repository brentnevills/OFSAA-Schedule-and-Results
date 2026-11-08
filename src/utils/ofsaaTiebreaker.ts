import { 
  Match, 
  PoolId, 
  Team, 
  TeamStanding, 
  PoolTiebreakerReport, 
  PoolTiebreakerGroupReport, 
  TiebreakMathData 
} from '../types/tournament';

export function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function formatRatio(ratio: number): string {
  if (ratio >= 900) return 'MAX';
  if (isNaN(ratio) || ratio <= 0) return '0.000';
  return ratio.toFixed(3);
}

export function safeRatio(won: number, lost: number): number {
  if (lost === 0) {
    return won > 0 ? 9999 + won : 0;
  }
  return won / lost;
}

export function calculateSetsAndPoints(match: Match): {
  team1Sets: number;
  team2Sets: number;
  team1Points: number;
  team2Points: number;
  winnerId?: string;
  loserId?: string;
} {
  let team1Sets = 0;
  let team2Sets = 0;
  let team1Points = 0;
  let team2Points = 0;

  for (const set of match.sets) {
    if (set.team1Score !== undefined && set.team2Score !== undefined) {
      team1Points += set.team1Score;
      team2Points += set.team2Score;
      if (set.team1Score > set.team2Score) {
        team1Sets++;
      } else if (set.team2Score > set.team1Score) {
        team2Sets++;
      }
    }
  }

  // Fallback to pre-recorded set counts if set array is empty
  if (team1Sets === 0 && team2Sets === 0 && match.team1SetsWon !== undefined && match.team2SetsWon !== undefined) {
    team1Sets = match.team1SetsWon;
    team2Sets = match.team2SetsWon;
  }

  const setsNeeded = match.bestOf === 3 ? 2 : 3;
  let winnerId: string | undefined = match.winnerId;
  let loserId: string | undefined = match.loserId;

  if (team1Sets >= setsNeeded || (match.status === 'final' && team1Sets > team2Sets)) {
    winnerId = match.team1Id;
    loserId = match.team2Id;
  } else if (team2Sets >= setsNeeded || (match.status === 'final' && team2Sets > team1Sets)) {
    winnerId = match.team2Id;
    loserId = match.team1Id;
  }

  return { team1Sets, team2Sets, team1Points, team2Points, winnerId, loserId };
}

// Calculate raw pool statistics for each team in a given pool
export function computeRawPoolStats(poolTeams: Team[], poolMatches: Match[]): Map<string, TeamStanding> {
  const statsMap = new Map<string, TeamStanding>();

  for (const team of poolTeams) {
    statsMap.set(team.id, {
      teamId: team.id,
      team,
      matchesPlayed: 0,
      matchesWon: 0,
      matchesLost: 0,
      setsWon: 0,
      setsLost: 0,
      setRatio: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      pointRatio: 0,
      rank: 1,
      advancementStatus: 'pending',
    });
  }

  for (const match of poolMatches) {
    if (match.status !== 'final') continue;

    const t1Stats = statsMap.get(match.team1Id);
    const t2Stats = statsMap.get(match.team2Id);
    if (!t1Stats || !t2Stats) continue;

    const res = calculateSetsAndPoints(match);

    t1Stats.matchesPlayed++;
    t2Stats.matchesPlayed++;

    t1Stats.setsWon += res.team1Sets;
    t1Stats.setsLost += res.team2Sets;
    t2Stats.setsWon += res.team2Sets;
    t2Stats.setsLost += res.team1Sets;

    t1Stats.pointsFor += res.team1Points;
    t1Stats.pointsAgainst += res.team2Points;
    t2Stats.pointsFor += res.team2Points;
    t2Stats.pointsAgainst += res.team1Points;

    if (res.winnerId === t1Stats.teamId) {
      t1Stats.matchesWon++;
      t2Stats.matchesLost++;
    } else if (res.winnerId === t2Stats.teamId) {
      t2Stats.matchesWon++;
      t1Stats.matchesLost++;
    }
  }

  // Calculate full precision ratios (not truncated early)
  for (const stat of statsMap.values()) {
    stat.setRatio = safeRatio(stat.setsWon, stat.setsLost);
    stat.pointRatio = safeRatio(stat.pointsFor, stat.pointsAgainst);
  }

  return statsMap;
}

// Compute Head-to-Head mini-pool stats among a subset of tied teams
export function computeHeadToHeadStats(tiedIds: string[], poolMatches: Match[]) {
  const tiedSet = new Set(tiedIds);
  const subsetMatches = poolMatches.filter(
    (m) => m.status === 'final' && tiedSet.has(m.team1Id) && tiedSet.has(m.team2Id)
  );

  const stats = new Map<
    string,
    { 
      matchesWon: number; 
      matchesLost: number; 
      matchRatio: number;
      setsWon: number; 
      setsLost: number; 
      setRatio: number;
      pointsFor: number; 
      pointsAgainst: number;
      pointRatio: number;
    }
  >();

  for (const id of tiedIds) {
    stats.set(id, { 
      matchesWon: 0, 
      matchesLost: 0, 
      matchRatio: 0,
      setsWon: 0, 
      setsLost: 0, 
      setRatio: 0,
      pointsFor: 0, 
      pointsAgainst: 0,
      pointRatio: 0 
    });
  }

  for (const m of subsetMatches) {
    const s1 = stats.get(m.team1Id);
    const s2 = stats.get(m.team2Id);
    if (!s1 || !s2) continue;

    const res = calculateSetsAndPoints(m);
    s1.setsWon += res.team1Sets;
    s1.setsLost += res.team2Sets;
    s2.setsWon += res.team2Sets;
    s2.setsLost += res.team1Sets;

    s1.pointsFor += res.team1Points;
    s1.pointsAgainst += res.team2Points;
    s2.pointsFor += res.team2Points;
    s2.pointsAgainst += res.team1Points;

    if (res.winnerId === m.team1Id) {
      s1.matchesWon++;
      s2.matchesLost++;
    } else if (res.winnerId === m.team2Id) {
      s2.matchesWon++;
      s1.matchesLost++;
    }
  }

  for (const s of stats.values()) {
    s.matchRatio = safeRatio(s.matchesWon, s.matchesLost);
    s.setRatio = safeRatio(s.setsWon, s.setsLost);
    s.pointRatio = safeRatio(s.pointsFor, s.pointsAgainst);
  }

  return { subsetMatches, stats };
}

const EPSILON = 1e-6;

/**
 * Resolves a group of teams tied in pool matches won according to OFSAA Section 6.
 * Returns the ordered standings for this group and updates their `tiebreakerReason` and `tiebreakMath`.
 */
function resolveTiedGroup(
  tiedGroup: TeamStanding[],
  startRank: number,
  poolMatches: Match[]
): TeamStanding[] {
  if (tiedGroup.length === 0) return [];
  if (tiedGroup.length === 1) {
    tiedGroup[0].isTied = false;
    tiedGroup[0].tiebreakerReason = undefined;
    tiedGroup[0].tiebreakMath = undefined;
    return [tiedGroup[0]];
  }

  // If fewer than 2 teams in this group have played any matches, no tiebreaker is active
  const playedCount = tiedGroup.filter((t) => t.matchesPlayed > 0).length;
  if (playedCount < 2) {
    const sorted = [...tiedGroup].sort((a, b) => {
      if (b.matchesPlayed !== a.matchesPlayed) return b.matchesPlayed - a.matchesPlayed;
      return a.team.seed - b.team.seed;
    });
    sorted.forEach((st) => {
      st.isTied = false;
      st.tiebreakerReason = undefined;
      st.tiebreakMath = undefined;
    });
    return sorted;
  }

  // If some teams have played and some have not, resolve the played teams and append unplayed by seed
  const playedTeams = tiedGroup.filter((t) => t.matchesPlayed > 0);
  const unplayedTeams = tiedGroup.filter((t) => t.matchesPlayed === 0);
  if (unplayedTeams.length > 0 && playedTeams.length > 0) {
    let resolvedPlayed: TeamStanding[] = [];
    if (playedTeams.length === 1) {
      playedTeams[0].isTied = false;
      playedTeams[0].tiebreakerReason = undefined;
      playedTeams[0].tiebreakMath = undefined;
      resolvedPlayed = [playedTeams[0]];
    } else {
      resolvedPlayed = resolveTiedGroup(playedTeams, startRank, poolMatches);
    }

    const sortedUnplayed = [...unplayedTeams].sort((a, b) => a.team.seed - b.team.seed);
    sortedUnplayed.forEach((st) => {
      st.isTied = false;
      st.tiebreakerReason = undefined;
      st.tiebreakMath = undefined;
    });

    return [...resolvedPlayed, ...sortedUnplayed];
  }

  const tiedIds = tiedGroup.map((t) => t.teamId);
  const { stats: h2hStats } = computeHeadToHeadStats(tiedIds, poolMatches);

  // Helper to build tiebreak math data
  const buildMathData = (
    s: TeamStanding,
    decidingCriterion: string,
    decidingStatLabel: string,
    explanation: string
  ): TiebreakMathData => {
    const h = h2hStats.get(s.teamId);
    return {
      h2hMatchesPlayed: h ? h.matchesWon + h.matchesLost : 0,
      h2hMatchesWon: h?.matchesWon ?? 0,
      h2hMatchesLost: h?.matchesLost ?? 0,
      h2hMatchRatio: h?.matchRatio ?? 0,
      h2hSetsWon: h?.setsWon ?? 0,
      h2hSetsLost: h?.setsLost ?? 0,
      h2hSetRatio: h?.setRatio ?? 0,
      overallSetsWon: s.setsWon,
      overallSetsLost: s.setsLost,
      overallSetRatio: s.setRatio,
      h2hPointsFor: h?.pointsFor ?? 0,
      h2hPointsAgainst: h?.pointsAgainst ?? 0,
      h2hPointRatio: h?.pointRatio ?? 0,
      overallPointsFor: s.pointsFor,
      overallPointsAgainst: s.pointsAgainst,
      overallPointRatio: s.pointRatio,
      decidingCriterion,
      decidingStatLabel,
      explanation,
    };
  };

  // Case: Two teams tied -> Rule 6(a)
  if (tiedGroup.length === 2) {
    const t1 = tiedGroup[0];
    const t2 = tiedGroup[1];

    if (t1.matchesPlayed === 0 && t2.matchesPlayed === 0) {
      const bySeed = t1.team.seed < t2.team.seed ? [t1, t2] : [t2, t1];
      bySeed.forEach((st) => {
        st.isTied = false;
        st.tiebreakerReason = undefined;
        st.tiebreakMath = undefined;
      });
      return bySeed;
    }

    t1.isTied = true;
    t2.isTied = true;

    const h2hMatch = poolMatches.find(
      (m) =>
        m.status === 'final' &&
        ((m.team1Id === t1.teamId && m.team2Id === t2.teamId) ||
          (m.team1Id === t2.teamId && m.team2Id === t1.teamId))
    );

    if (h2hMatch && h2hMatch.winnerId) {
      const winner = h2hMatch.winnerId === t1.teamId ? t1 : t2;
      const loser = h2hMatch.winnerId === t1.teamId ? t2 : t1;

      winner.tiebreakerReason = `${getOrdinal(startRank)} by Head-to-Head`;
      loser.tiebreakerReason = `${getOrdinal(startRank + 1)} by Head-to-Head`;

      winner.tiebreakMath = buildMathData(
        winner,
        'Rule 6(a) • Head-to-Head Result',
        'Head-to-Head',
        `${winner.team.schoolName || winner.team.name} defeated ${loser.team.schoolName || loser.team.name} head-to-head.`
      );
      loser.tiebreakMath = buildMathData(
        loser,
        'Rule 6(a) • Head-to-Head Result',
        'Head-to-Head',
        `Lost head-to-head match against ${winner.team.schoolName || winner.team.name}.`
      );

      return [winner, loser];
    }

    // Head-to-head match unplayed: check overall set ratio
    if (Math.abs(t1.setRatio - t2.setRatio) > EPSILON) {
      const higher = t1.setRatio > t2.setRatio ? t1 : t2;
      const lower = t1.setRatio > t2.setRatio ? t2 : t1;

      higher.tiebreakerReason = `${getOrdinal(startRank)} by All Sets`;
      lower.tiebreakerReason = `${getOrdinal(startRank + 1)} by All Sets`;

      higher.tiebreakMath = buildMathData(
        higher,
        'Rule 6(a) • All Sets Ratio',
        'All Sets',
        `Higher set ratio (${formatRatio(higher.setRatio)} vs ${formatRatio(lower.setRatio)}).`
      );
      lower.tiebreakMath = buildMathData(
        lower,
        'Rule 6(a) • All Sets Ratio',
        'All Sets',
        `Lower set ratio (${formatRatio(lower.setRatio)} vs ${formatRatio(higher.setRatio)}).`
      );

      return [higher, lower];
    }

    // Check overall point ratio
    if (Math.abs(t1.pointRatio - t2.pointRatio) > EPSILON) {
      const higher = t1.pointRatio > t2.pointRatio ? t1 : t2;
      const lower = t1.pointRatio > t2.pointRatio ? t2 : t1;

      higher.tiebreakerReason = `${getOrdinal(startRank)} by Point Ratio`;
      lower.tiebreakerReason = `${getOrdinal(startRank + 1)} by Point Ratio`;

      higher.tiebreakMath = buildMathData(
        higher,
        'Rule 6(a) • Overall Point Ratio',
        'Point Ratio',
        `Higher point ratio (${formatRatio(higher.pointRatio)} vs ${formatRatio(lower.pointRatio)}).`
      );
      lower.tiebreakMath = buildMathData(
        lower,
        'Rule 6(a) • Overall Point Ratio',
        'Point Ratio',
        `Lower point ratio (${formatRatio(lower.pointRatio)} vs ${formatRatio(higher.pointRatio)}).`
      );

      return [higher, lower];
    }

    // Tie unbroken: order by tournament seed
    const higher = t1.team.seed < t2.team.seed ? t1 : t2;
    const lower = t1.team.seed < t2.team.seed ? t2 : t1;
    higher.tiebreakerReason = `${getOrdinal(startRank)} by Head-to-Head`;
    lower.tiebreakerReason = `${getOrdinal(startRank + 1)} by Head-to-Head`;
    return [higher, lower];
  }

  // Case: 3 or more teams tied -> Rule 6(b), 6(c), or 6(d)
  // Step 1: Ratio of won/lost matches among tied teams only
  // Step 2: Ratio of won/lost sets among tied teams only
  // Step 3: Ratio of won/lost sets in all pool matches
  // Step 4: Ratio of points for/against among tied teams only
  // Step 5: Ratio of points for/against in all pool matches

  const criteriaList = [
    {
      id: 'h2hMatch',
      name: 'Step (i) • Ratio of won/lost matches among tied teams only',
      statLabel: 'Head-to-Head',
      getValue: (id: string, st: TeamStanding) => h2hStats.get(id)?.matchRatio ?? 0,
      getRaw: (id: string, st: TeamStanding) => {
        const h = h2hStats.get(id);
        return `${h?.matchesWon ?? 0}-${h?.matchesLost ?? 0}`;
      },
    },
    {
      id: 'h2hSet',
      name: 'Step (ii) • Ratio of won/lost sets among tied teams only',
      statLabel: 'Head-to-Head Sets',
      getValue: (id: string, st: TeamStanding) => h2hStats.get(id)?.setRatio ?? 0,
      getRaw: (id: string, st: TeamStanding) => {
        const h = h2hStats.get(id);
        return `${h?.setsWon ?? 0}-${h?.setsLost ?? 0}`;
      },
    },
    {
      id: 'overallSet',
      name: 'Step (iii) • Ratio of won/lost sets in all pool matches',
      statLabel: 'All Sets',
      getValue: (id: string, st: TeamStanding) => st.setRatio,
      getRaw: (id: string, st: TeamStanding) => `${st.setsWon}-${st.setsLost}`,
    },
    {
      id: 'h2hPoint',
      name: 'Step (iv) • Ratio of points for/against among tied teams only',
      statLabel: 'Head-to-Head Points',
      getValue: (id: string, st: TeamStanding) => h2hStats.get(id)?.pointRatio ?? 0,
      getRaw: (id: string, st: TeamStanding) => {
        const h = h2hStats.get(id);
        return `${h?.pointsFor ?? 0}/${h?.pointsAgainst ?? 0}`;
      },
    },
    {
      id: 'overallPoint',
      name: 'Step (v) • Ratio of points for/against in all pool matches',
      statLabel: 'Point Ratio',
      getValue: (id: string, st: TeamStanding) => st.pointRatio,
      getRaw: (id: string, st: TeamStanding) => `${st.pointsFor}/${st.pointsAgainst}`,
    },
  ];

  // Evaluate which criterion differentiates the tied teams
  let resolvedList: TeamStanding[] | null = null;

  for (let cIdx = 0; cIdx < criteriaList.length; cIdx++) {
    const criterion = criteriaList[cIdx];
    const vals = tiedGroup.map((st) => ({
      st,
      val: criterion.getValue(st.teamId, st),
      raw: criterion.getRaw(st.teamId, st),
    }));

    // Check if there are differences among teams
    const minVal = Math.min(...vals.map((v) => v.val));
    const maxVal = Math.max(...vals.map((v) => v.val));

    if (maxVal - minVal > EPSILON) {
      // Sort highest to lowest on this criterion
      vals.sort((a, b) => b.val - a.val);

      // Check if all values are uniquely distinct
      const allDistinct = vals.every(
        (v, idx, arr) => idx === 0 || Math.abs(v.val - arr[idx - 1].val) > EPSILON
      );

      if (allDistinct) {
        // Complete separation! Each team is placed at their rank by this criterion
        for (let k = 0; k < vals.length; k++) {
          const item = vals[k];
          item.st.isTied = true;
          const assignedRank = startRank + k;
          item.st.tiebreakerReason = `${getOrdinal(assignedRank)} by ${criterion.statLabel}`;
          item.st.tiebreakMath = buildMathData(
            item.st,
            criterion.name,
            criterion.statLabel,
            `${criterion.name}: ratio ${formatRatio(item.val)} (${item.raw}).`
          );
        }
        resolvedList = vals.map((v) => v.st);
        break;
      }

      // Check if top team is uniquely separated (Rule 6b: determine highest ranked team)
      const topVal = vals[0].val;
      const topCount = vals.filter((v) => Math.abs(v.val - topVal) <= EPSILON).length;

      if (topCount === 1) {
        // Top team takes spot
        const topTeam = vals[0].st;
        topTeam.isTied = true;
        topTeam.tiebreakerReason = `${getOrdinal(startRank)} by ${criterion.statLabel}`;
        topTeam.tiebreakMath = buildMathData(
          topTeam,
          criterion.name,
          criterion.statLabel,
          `Highest ratio ${formatRatio(vals[0].val)} (${vals[0].raw}) in ${criterion.statLabel}.`
        );

        // Recursively resolve remaining teams
        const remaining = vals.slice(1).map((v) => v.st);
        const resolvedRemaining = resolveTiedGroup(remaining, startRank + 1, poolMatches);
        resolvedList = [topTeam, ...resolvedRemaining];
        break;
      }

      // If tied for 2nd (Rule 6c) and lowest team is uniquely separated
      const lowestVal = vals[vals.length - 1].val;
      const lowestCount = vals.filter((v) => Math.abs(v.val - lowestVal) <= EPSILON).length;

      if (lowestCount === 1 && startRank === 2 && tiedGroup.length === 3) {
        const lowestTeam = vals[vals.length - 1].st;
        lowestTeam.isTied = true;
        const lowestRank = startRank + vals.length - 1;
        lowestTeam.tiebreakerReason = `${getOrdinal(lowestRank)} by ${criterion.statLabel}`;
        lowestTeam.tiebreakMath = buildMathData(
          lowestTeam,
          criterion.name,
          criterion.statLabel,
          `Lowest ratio ${formatRatio(lowestVal)} in ${criterion.statLabel} (OFSAA Rule 6c).`
        );

        // Resolve top 2 teams
        const topTwo = vals.slice(0, vals.length - 1).map((v) => v.st);
        const resolvedTopTwo = resolveTiedGroup(topTwo, startRank, poolMatches);
        resolvedList = [...resolvedTopTwo, lowestTeam];
        break;
      }

      // Per Rule 6(b) Note: If two teams have same ratio higher than third, all progress to next step
      // Continue to next criterion in loop!
    }
  }

  if (resolvedList) {
    return resolvedList;
  }

  // Fallback: If still tied after all 5 criteria, sort by seed
  const fallback = [...tiedGroup].sort((a, b) => a.team.seed - b.team.seed);
  fallback.forEach((st, idx) => {
    st.isTied = true;
    const assignedRank = startRank + idx;
    st.tiebreakerReason = `${getOrdinal(assignedRank)} by Point Ratio`;
    st.tiebreakMath = buildMathData(
      st,
      'Rule 6(d) • Point Ratio / Seed Fallback',
      'Point Ratio',
      'All OFSAA mathematical criteria equal; ranked in sequence.'
    );
  });

  return fallback;
}

/**
 * OFSAA Rule 6 Tiebreaking implementation:
 * a. Two tied teams: Winner of match between them.
 * b. Three tied teams for 1st or 3rd:
 *    i. Ratio of won/lost matches among tied teams only.
 *    ii. Ratio of won/lost sets among tied teams only.
 *    iii. Ratio of won/lost sets overall in pool.
 *    iv. Ratio of points for/against among tied teams only.
 *    v. Ratio of points for/against overall.
 *    Top team takes spot; other 2 play 15pt set if deciding qualification.
 * c. Three tied teams for 2nd:
 *    Same criteria applied to determine lowest ranked team, other 2 play 15pt set.
 * d. 4+ teams tied: criteria applied in sequence.
 */
export function calculatePoolStandings(
  poolId: PoolId,
  allTeams: Team[],
  allMatches: Match[],
  format: '20-team' | '16-team' = '20-team'
): TeamStanding[] {
  const poolTeams = allTeams.filter((t) => t.pool === poolId);
  const poolMatches = allMatches.filter((m) => m.pool === poolId && m.stage === 'pool');

  const statsMap = computeRawPoolStats(poolTeams, poolMatches);
  const standings = Array.from(statsMap.values());

  // Initial group by matches won first, then overall set ratio, then point ratio
  standings.sort((a, b) => {
    if (b.matchesWon !== a.matchesWon) {
      return b.matchesWon - a.matchesWon;
    }
    if (Math.abs(b.setRatio - a.setRatio) > EPSILON) {
      return b.setRatio - a.setRatio;
    }
    return b.pointRatio - a.pointRatio;
  });

  // Resolve contiguous groups of tied teams using OFSAA Rule 6
  const finalOrdered: TeamStanding[] = [];
  let i = 0;

  while (i < standings.length) {
    let j = i;
    while (j < standings.length && standings[j].matchesWon === standings[i].matchesWon) {
      j++;
    }

    const tiedGroup = standings.slice(i, j);
    const resolvedGroup = resolveTiedGroup(tiedGroup, i + 1, poolMatches);
    finalOrdered.push(...resolvedGroup);

    i = j;
  }

  // Run statistical certainty clinching analysis
  const clinching = evaluateClinchingCertainty(
    finalOrdered.map((f) => f.team),
    poolMatches,
    format
  );

  // Assign final ranks & statistically certain advancement statuses
  finalOrdered.forEach((item, index) => {
    item.rank = index + 1;
    const cert = clinching.get(item.teamId);

    if (cert) {
      item.advancementStatus = cert.advancementStatus;
      item.clinchedRank = cert.clinchedExactRank;
      item.isClinched = !cert.isPending;
    } else {
      item.advancementStatus = 'pending';
      item.clinchedRank = null;
      item.isClinched = false;
    }
  });

  return finalOrdered;
}

/**
 * Computes a detailed mathematical tiebreaker report for convenors.
 * Provides the complete mathematical audit trail for any ties in the pool.
 */
export function computePoolTiebreakerReport(
  poolId: PoolId,
  allTeams: Team[],
  allMatches: Match[]
): PoolTiebreakerReport {
  const standings = calculatePoolStandings(poolId, allTeams, allMatches);
  const poolMatches = allMatches.filter((m) => m.pool === poolId && m.stage === 'pool');

  const tiedStandings = standings.filter((s) => s.isTied);
  if (tiedStandings.length === 0) {
    return {
      poolId,
      hasTie: false,
      reports: [],
    };
  }

  // Group by matches won
  const groupsByWins = new Map<number, TeamStanding[]>();
  for (const s of standings) {
    if (!s.isTied) continue;
    const list = groupsByWins.get(s.matchesWon) || [];
    list.push(s);
    groupsByWins.set(s.matchesWon, list);
  }

  const reports: PoolTiebreakerGroupReport[] = [];

  for (const [mw, group] of groupsByWins.entries()) {
    if (group.length < 2) continue;
    if (!group.some((g) => g.matchesPlayed > 0)) continue;

    const startRank = Math.min(...group.map((g) => g.rank));
    const count = group.length;
    const tiedIds = group.map((g) => g.teamId);
    const { stats: h2hStats } = computeHeadToHeadStats(tiedIds, poolMatches);

    let ruleCitation = 'OFSAA Section 6(a) • Two-Team Tie';
    let decidingCriterion = group[0].tiebreakMath?.decidingCriterion || 'Rule 6(a) • Head-to-Head Result';
    let decidingStatLabel = group[0].tiebreakMath?.decidingStatLabel || 'Head-to-Head';
    let playoffSetRequired = false;
    let playoffSetDetails: string | undefined;

    if (count === 2) {
      ruleCitation = 'OFSAA Section 6(a) • Two-Team Tie';
    } else if (count === 3) {
      if (startRank === 1) {
        ruleCitation = 'OFSAA Section 6(b) • Three-Way Tie for 1st Place';
        playoffSetRequired = true;
        playoffSetDetails = 'Top team determined by criteria; remaining 2 teams play 15-point set (2-point margin) to complete final pool rankings.';
      } else if (startRank === 2) {
        ruleCitation = 'OFSAA Section 6(c) • Three-Way Tie for 2nd Place';
        playoffSetRequired = true;
        playoffSetDetails = 'Criteria applied in sequence to determine lowest ranked team (4th); other 2 teams play 15-point set (2-point margin) for 2nd (Champ QF) and 3rd (Consol QF).';
      } else {
        ruleCitation = 'OFSAA Section 6(b) • Three-Way Tie for 3rd Place';
        playoffSetRequired = true;
        playoffSetDetails = 'Remaining 2 teams play 15-point set (2-point margin) if deciding Consolation QF vs Elimination.';
      }
    } else {
      ruleCitation = `OFSAA Section 6(d) • ${count}-Way Tie`;
      playoffSetRequired = true;
      playoffSetDetails = 'Criteria applied one after another to determine ranking. 2nd place and 4th place determined by additional set to 15 (2-point margin). No team eliminated from playoffs by math alone.';
    }

    const teamAudits = group.map((st) => {
      const h = h2hStats.get(st.teamId);
      const h2hMatchesWon = h?.matchesWon ?? 0;
      const h2hMatchesLost = h?.matchesLost ?? 0;
      const h2hSetsWon = h?.setsWon ?? 0;
      const h2hSetsLost = h?.setsLost ?? 0;
      const h2hPointsFor = h?.pointsFor ?? 0;
      const h2hPointsAgainst = h?.pointsAgainst ?? 0;

      const ptDiff = st.pointsFor - st.pointsAgainst;
      const ptDiffStr = ptDiff > 0 ? `+${ptDiff}` : `${ptDiff}`;

      return {
        teamId: st.teamId,
        schoolName: st.team.schoolName || st.team.name,
        seed: st.team.seed,
        rank: st.rank,
        reason: st.tiebreakerReason || `${getOrdinal(st.rank)} by ${decidingStatLabel}`,
        h2hMatchesRecord: `${h2hMatchesWon}-${h2hMatchesLost}`,
        h2hMatchRatioStr: formatRatio(h?.matchRatio ?? 0),
        h2hSetsRecord: `${h2hSetsWon}-${h2hSetsLost}`,
        h2hSetRatioStr: formatRatio(h?.setRatio ?? 0),
        allSetsRecord: `${st.setsWon}-${st.setsLost}`,
        allSetRatioStr: formatRatio(st.setRatio),
        h2hPointsRecord: `${h2hPointsFor}/${h2hPointsAgainst}`,
        h2hPointRatioStr: formatRatio(h?.pointRatio ?? 0),
        allPointsRecord: `${st.pointsFor}/${st.pointsAgainst}`,
        allPointRatioStr: formatRatio(st.pointRatio),
        pointDiffStr: ptDiffStr,
      };
    });

    reports.push({
      tiedTeamIds: tiedIds,
      startRank,
      ruleCitation,
      decidingCriterion,
      decidingStatLabel,
      explanation: `${count} teams tied with ${mw} match win${mw === 1 ? '' : 's'}. Resolved via ${ruleCitation}.`,
      playoffSetRequired,
      playoffSetDetails,
      teamAudits,
    });
  }

  return {
    poolId,
    hasTie: reports.length > 0,
    reports,
  };
}

/**
 * Evaluates whether any team in a pool has achieved mathematical certainty (clinching)
 * for Championship QF (top 2), Consolation QF (3rd/4th), or elimination.
 * Does NOT declare advancement until statistically guaranteed across all future outcomes.
 */
export function evaluateClinchingCertainty(
  poolTeams: Team[],
  poolMatches: Match[],
  format: '20-team' | '16-team' = '20-team'
): Map<string, {
  clinchedExactRank: number | null;
  clinchedChampQF: boolean;
  clinchedConsolQF: boolean;
  isEliminated: boolean;
  isPending: boolean;
  advancementStatus: 'championship_qf' | 'consolation_qf' | 'eliminated' | 'pending';
}> {
  const unplayedMatches = poolMatches.filter((m) => m.status !== 'final');
  const playedMatches = poolMatches.filter((m) => m.status === 'final');
  const U = unplayedMatches.length;

  const result = new Map();

  // If no matches have been completed yet: every team's fate is pending
  if (playedMatches.length === 0) {
    for (const t of poolTeams) {
      result.set(t.id, {
        clinchedExactRank: null,
        clinchedChampQF: false,
        clinchedConsolQF: false,
        isEliminated: false,
        isPending: true,
        advancementStatus: 'pending' as const,
      });
    }
    return result;
  }

  // If ALL pool matches are complete: 100% finished, every rank is certain
  if (U === 0) {
    poolTeams.forEach((t, idx) => {
      const rank = idx + 1;
      let status: 'championship_qf' | 'consolation_qf' | 'eliminated' = 'championship_qf';
      if (rank <= 2) {
        status = 'championship_qf';
      } else if (rank <= 4) {
        status = 'consolation_qf';
      } else {
        status = format === '20-team' ? 'eliminated' : 'consolation_qf';
      }

      result.set(t.id, {
        clinchedExactRank: rank,
        clinchedChampQF: rank <= 2,
        clinchedConsolQF: rank >= 3 && rank <= 4,
        isEliminated: rank === 5 && format === '20-team',
        isPending: false,
        advancementStatus: status,
      });
    });
    return result;
  }

  // Intermediate state with U unplayed matches
  const numScenarios = 1 << Math.min(U, 12);
  const teamIds = poolTeams.map((t) => t.id);
  const minRank: Record<string, number> = {};
  const maxRank: Record<string, number> = {};
  teamIds.forEach((id) => {
    minRank[id] = 5;
    maxRank[id] = 1;
  });

  for (let mask = 0; mask < numScenarios; mask++) {
    const wins: Record<string, number> = {};
    const h2h: Record<string, Record<string, string>> = {};
    teamIds.forEach((id) => {
      wins[id] = 0;
      h2h[id] = {};
    });

    for (const m of playedMatches) {
      if (m.winnerId) {
        wins[m.winnerId] = (wins[m.winnerId] || 0) + 1;
        h2h[m.team1Id] = h2h[m.team1Id] || {};
        h2h[m.team2Id] = h2h[m.team2Id] || {};
        h2h[m.team1Id][m.team2Id] = m.winnerId;
        h2h[m.team2Id][m.team1Id] = m.winnerId;
      }
    }

    for (let k = 0; k < U; k++) {
      const m = unplayedMatches[k];
      const winner = ((mask >> k) & 1) === 0 ? m.team1Id : m.team2Id;
      wins[winner] = (wins[winner] || 0) + 1;
      h2h[m.team1Id] = h2h[m.team1Id] || {};
      h2h[m.team2Id] = h2h[m.team2Id] || {};
      h2h[m.team1Id][m.team2Id] = winner;
      h2h[m.team2Id][m.team1Id] = winner;
    }

    for (const tid of teamIds) {
      let strictlyAhead = 0;
      let tiedCount = 0;
      for (const other of teamIds) {
        if (other === tid) continue;
        if (wins[other] > wins[tid]) {
          strictlyAhead++;
        } else if (wins[other] === wins[tid]) {
          tiedCount++;
        }
      }
      const bestInScenario = 1 + strictlyAhead;
      const worstInScenario = 1 + strictlyAhead + tiedCount;
      if (bestInScenario < minRank[tid]) minRank[tid] = bestInScenario;
      if (worstInScenario > maxRank[tid]) maxRank[tid] = worstInScenario;
    }
  }

  for (const tid of teamIds) {
    const best = minRank[tid];
    const worst = maxRank[tid];
    const clinchedExact = best === worst ? best : null;
    const clinchedChamp = worst <= 2;
    const clinchedConsol = best >= 3 && worst <= 4;
    const isElim = best === 5;
    const isPending = !clinchedChamp && !clinchedConsol && !isElim;

    let status: 'championship_qf' | 'consolation_qf' | 'eliminated' | 'pending' = 'pending';
    if (clinchedChamp) {
      status = 'championship_qf';
    } else if (clinchedConsol) {
      status = 'consolation_qf';
    } else if (isElim) {
      status = 'eliminated';
    }

    result.set(tid, {
      clinchedExactRank: clinchedExact,
      clinchedChampQF: clinchedChamp,
      clinchedConsolQF: clinchedConsol,
      isEliminated: isElim,
      isPending,
      advancementStatus: status,
    });
  }

  return result;
}

export const OFSAA_SEEDING_MAP_20: Record<PoolId, number[]> = {
  A: [1, 6, 11, 16, 20],
  B: [3, 8, 9, 14, 19],
  C: [2, 5, 12, 15, 18],
  D: [4, 7, 10, 13, 17],
};

export const OFSAA_SEEDING_MAP_16: Record<PoolId, number[]> = {
  A: [1, 6, 11, 16],
  B: [3, 8, 9, 14],
  C: [2, 5, 12, 15],
  D: [4, 7, 10, 13],
};

// Map seed number to pool and poolSlot
export function getPoolAndSlotForSeed(seed: number, format: '20-team' | '16-team' = '20-team'): { pool: PoolId; slot: string } {
  const map = format === '20-team' ? OFSAA_SEEDING_MAP_20 : OFSAA_SEEDING_MAP_16;
  for (const p of ['A', 'B', 'C', 'D'] as PoolId[]) {
    const idx = map[p].indexOf(seed);
    if (idx !== -1) {
      return { pool: p, slot: `${p}${idx + 1}` };
    }
  }
  return { pool: 'A', slot: 'A1' };
}
