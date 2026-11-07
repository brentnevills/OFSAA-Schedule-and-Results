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

  // Run statistical certainty clinching analysis
  const clinching = evaluateClinchingCertainty(
    finalOrdered.map((f) => f.team),
    poolMatches,
    format
  );

  // Assign ranks & statistically certain advancement status ONLY
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

  // Intermediate state with U unplayed matches (U <= 10)
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
