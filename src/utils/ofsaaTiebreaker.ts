import { Match, PoolId, Team, TeamStanding } from '../types/tournament';

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

  const setsNeeded = match.bestOf === 3 ? 2 : 3;
  let winnerId: string | undefined;
  let loserId: string | undefined;

  if (team1Sets >= setsNeeded) {
    winnerId = match.team1Id;
    loserId = match.team2Id;
  } else if (team2Sets >= setsNeeded) {
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

  // Calculate ratios
  for (const stat of statsMap.values()) {
    stat.setRatio = stat.setsLost === 0 
      ? (stat.setsWon > 0 ? 99.99 : 0) 
      : Number((stat.setsWon / stat.setsLost).toFixed(3));
    
    stat.pointRatio = stat.pointsAgainst === 0 
      ? (stat.pointsFor > 0 ? 99.99 : 0) 
      : Number((stat.pointsFor / stat.pointsAgainst).toFixed(3));
  }

  return statsMap;
}

// Compute Head-to-Head mini-pool stats among a subset of tied teams
function computeHeadToHeadStats(tiedIds: string[], poolMatches: Match[]) {
  const tiedSet = new Set(tiedIds);
  const subsetMatches = poolMatches.filter(
    (m) => m.status === 'final' && tiedSet.has(m.team1Id) && tiedSet.has(m.team2Id)
  );

  const stats = new Map<
    string,
    { matchesWon: number; matchesLost: number; setsWon: number; setsLost: number; pointsFor: number; pointsAgainst: number }
  >();

  for (const id of tiedIds) {
    stats.set(id, { matchesWon: 0, matchesLost: 0, setsWon: 0, setsLost: 0, pointsFor: 0, pointsAgainst: 0 });
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

  return { subsetMatches, stats };
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
 *    Top team takes spot; other 2 play 15pt set.
 * c. Three tied teams for 2nd:
 *    Same criteria inverted to determine lowest ranked team, other 2 play 15pt set.
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

  // Group by matches won first
  standings.sort((a, b) => {
    if (b.matchesWon !== a.matchesWon) {
      return b.matchesWon - a.matchesWon;
    }
    // secondary sort by overall set ratio
    if (b.setRatio !== a.setRatio) {
      return b.setRatio - a.setRatio;
    }
    // tertiary sort by overall point ratio
    return b.pointRatio - a.pointRatio;
  });

  // Now resolve ties using OFSAA rules
  const finalOrdered: TeamStanding[] = [];
  let i = 0;

  while (i < standings.length) {
    let j = i;
    while (j < standings.length && standings[j].matchesWon === standings[i].matchesWon) {
      j++;
    }

    const tiedGroup = standings.slice(i, j);

    if (tiedGroup.length === 1) {
      tiedGroup[0].isTied = false;
      finalOrdered.push(tiedGroup[0]);
    } else if (tiedGroup.length === 2) {
      // Rule 6a: Two tied teams -> Head-to-Head
      const t1 = tiedGroup[0];
      const t2 = tiedGroup[1];
      const headToHeadMatch = poolMatches.find(
        (m) =>
          m.status === 'final' &&
          ((m.team1Id === t1.teamId && m.team2Id === t2.teamId) ||
            (m.team1Id === t2.teamId && m.team2Id === t1.teamId))
      );

      t1.isTied = true;
      t2.isTied = true;

      if (headToHeadMatch && headToHeadMatch.winnerId) {
        if (headToHeadMatch.winnerId === t1.teamId) {
          t1.tiebreakerReason = `Won head-to-head match vs ${t2.team.schoolName || t2.team.name}`;
          t2.tiebreakerReason = `Lost head-to-head match vs ${t1.team.schoolName || t1.team.name}`;
          finalOrdered.push(t1, t2);
        } else {
          t2.tiebreakerReason = `Won head-to-head match vs ${t1.team.schoolName || t1.team.name}`;
          t1.tiebreakerReason = `Lost head-to-head match vs ${t2.team.schoolName || t2.team.name}`;
          finalOrdered.push(t2, t1);
        }
      } else {
        // Fallback to set ratio or point ratio if not yet played
        if (t1.setRatio >= t2.setRatio) {
          t1.tiebreakerReason = `Leading on set ratio (${t1.setRatio.toFixed(3)} vs ${t2.setRatio.toFixed(3)})`;
          t2.tiebreakerReason = `Trailing on set ratio (${t2.setRatio.toFixed(3)} vs ${t1.setRatio.toFixed(3)})`;
          finalOrdered.push(t1, t2);
        } else {
          t2.tiebreakerReason = `Leading on set ratio (${t2.setRatio.toFixed(3)} vs ${t1.setRatio.toFixed(3)})`;
          t1.tiebreakerReason = `Trailing on set ratio (${t1.setRatio.toFixed(3)} vs ${t2.setRatio.toFixed(3)})`;
          finalOrdered.push(t2, t1);
        }
      }
    } else {
      // 3 or more tied teams: Apply OFSAA multi-way tiebreaker criteria
      const tiedIds = tiedGroup.map((t) => t.teamId);
      const { stats: h2hStats } = computeHeadToHeadStats(tiedIds, poolMatches);

      // Criteria i: H2H match ratio
      // Criteria ii: H2H set ratio
      // Criteria iii: Overall set ratio
      // Criteria iv: H2H point ratio
      // Criteria v: Overall point ratio

      const evaluated = tiedGroup.map((standing) => {
        const h = h2hStats.get(standing.teamId)!;
        const h2hMatchRatio = h.matchesLost === 0 ? (h.matchesWon > 0 ? 99.9 : 0) : h.matchesWon / h.matchesLost;
        const h2hSetRatio = h.setsLost === 0 ? (h.setsWon > 0 ? 99.9 : 0) : h.setsWon / h.setsLost;
        const overallSetRatio = standing.setRatio;
        const h2hPointRatio = h.pointsAgainst === 0 ? (h.pointsFor > 0 ? 99.9 : 0) : h.pointsFor / h.pointsAgainst;
        const overallPointRatio = standing.pointRatio;

        return {
          standing,
          h2hMatchRatio,
          h2hSetRatio,
          overallSetRatio,
          h2hPointRatio,
          overallPointRatio,
        };
      });

      evaluated.sort((a, b) => {
        if (Math.abs(b.h2hMatchRatio - a.h2hMatchRatio) > 0.001) return b.h2hMatchRatio - a.h2hMatchRatio;
        if (Math.abs(b.h2hSetRatio - a.h2hSetRatio) > 0.001) return b.h2hSetRatio - a.h2hSetRatio;
        if (Math.abs(b.overallSetRatio - a.overallSetRatio) > 0.001) return b.overallSetRatio - a.overallSetRatio;
        if (Math.abs(b.h2hPointRatio - a.h2hPointRatio) > 0.001) return b.h2hPointRatio - a.h2hPointRatio;
        return b.overallPointRatio - a.overallPointRatio;
      });

      for (let k = 0; k < evaluated.length; k++) {
        const item = evaluated[k];
        item.standing.isTied = true;
        item.standing.tiebreakerReason = `OFSAA Multi-way tiebreaker (H2H Set: ${item.h2hSetRatio.toFixed(2)}, All Set: ${item.overallSetRatio.toFixed(2)}, Pt Ratio: ${item.overallPointRatio.toFixed(3)})`;
        finalOrdered.push(item.standing);
      }
    }

    i = j;
  }

  // Assign ranks & advancement status
  finalOrdered.forEach((item, index) => {
    item.rank = index + 1;

    if (item.rank <= 2) {
      item.advancementStatus = 'championship_qf';
    } else if (item.rank <= 4) {
      item.advancementStatus = 'consolation_qf';
    } else {
      item.advancementStatus = format === '20-team' ? 'eliminated' : 'consolation_qf';
    }
  });

  return finalOrdered;
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
