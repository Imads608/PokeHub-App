import {
  getTypeEffectivenessForTypes,
  getCombinedOffensiveCoverage,
  getAllTypes,
} from './type-effectiveness';
import type { TypeName, MoveCategory } from '@pkmn/dex';

/**
 * Team defensive coverage result
 */
export interface TeamDefensiveCoverage {
  /** Types that hit multiple Pokemon on the team, with count */
  teamWeaknesses: { type: TypeName; count: number }[];
  /** Types that multiple Pokemon resist, with count */
  teamResistances: { type: TypeName; count: number }[];
  /** Types that any Pokemon is immune to, with count */
  teamImmunities: { type: TypeName; count: number }[];
  /** Types that hit all/most Pokemon (5+ out of 6) - critical threats */
  criticalWeaknesses: TypeName[];
  /** Types that hit 3-4 Pokemon - shared weaknesses */
  sharedWeaknesses: TypeName[];
}

/**
 * Move data for coverage analysis
 */
export interface MoveForCoverage {
  type: TypeName;
  category: MoveCategory;
}

/**
 * Team offensive coverage result
 */
export interface TeamOffensiveCoverage {
  /** Move types available on the team with counts and categories */
  moveTypes: {
    type: TypeName;
    count: number;
    physicalCount: number;
    specialCount: number;
    statusCount: number;
  }[];
  /** Types the team can hit super-effectively */
  superEffectiveCoverage: TypeName[];
  /** Detailed super-effective coverage with move counts per type */
  superEffectiveCoverageDetailed: { type: TypeName; moveCount: number }[];
  /** Types the team cannot hit super-effectively (gaps) */
  coverageGaps: TypeName[];
  /** Types that resist most/all of the team's moves */
  resistedBy: TypeName[];
  /** Types the team has no way to hit (immunities) */
  cannotHit: TypeName[];
}

/**
 * Calculate team-wide defensive coverage
 * Analyzes which types the team is collectively weak/resistant/immune to
 */
export function calculateTeamDefensiveCoverage(
  teamPokemon: { types: TypeName[] }[]
): TeamDefensiveCoverage {
  // Track weakness/resistance/immunity counts for each type
  const weaknessCounts: Map<TypeName, number> = new Map();
  const resistanceCounts: Map<TypeName, number> = new Map();
  const immunityCounts: Map<TypeName, number> = new Map();

  // Analyze each Pokemon's type effectiveness
  teamPokemon.forEach((pokemon) => {
    const { weakTo, resistantTo, immuneTo } = getTypeEffectivenessForTypes(
      pokemon.types
    );

    // Count weaknesses
    weakTo.forEach(({ type }) => {
      weaknessCounts.set(type, (weaknessCounts.get(type) || 0) + 1);
    });

    // Count resistances
    resistantTo.forEach(({ type }) => {
      resistanceCounts.set(type, (resistanceCounts.get(type) || 0) + 1);
    });

    // Count immunities
    immuneTo.forEach((type) => {
      immunityCounts.set(type, (immunityCounts.get(type) || 0) + 1);
    });
  });

  // Convert to sorted arrays
  const teamWeaknesses = Array.from(weaknessCounts.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count); // Sort by count descending

  const teamResistances = Array.from(resistanceCounts.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  const teamImmunities = Array.from(immunityCounts.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  // Identify critical weaknesses (affects most of the team)
  const teamSize = teamPokemon.length;
  const criticalThreshold = Math.max(1, Math.floor(teamSize * 0.8)); // 80% or more
  const sharedThreshold = Math.max(1, Math.floor(teamSize * 0.5)); // 50% or more

  const criticalWeaknesses = teamWeaknesses
    .filter(({ count }) => count >= criticalThreshold)
    .map(({ type }) => type);

  const sharedWeaknesses = teamWeaknesses
    .filter(
      ({ count }) => count >= sharedThreshold && count < criticalThreshold
    )
    .map(({ type }) => type);

  return {
    teamWeaknesses,
    teamResistances,
    teamImmunities,
    criticalWeaknesses,
    sharedWeaknesses,
  };
}

/**
 * Calculate team-wide offensive coverage
 * Analyzes which types the team can hit super-effectively based on moves
 */
export function calculateTeamOffensiveCoverage(
  teamMoves: MoveForCoverage[]
): TeamOffensiveCoverage {
  // Count move types and categorize by physical/special/status
  const moveTypeCounts: Map<
    TypeName,
    { total: number; physical: number; special: number; status: number }
  > = new Map();

  teamMoves.forEach(({ type, category }) => {
    const current = moveTypeCounts.get(type) || {
      total: 0,
      physical: 0,
      special: 0,
      status: 0,
    };

    current.total++;
    if (category === 'Physical') current.physical++;
    else if (category === 'Special') current.special++;
    else if (category === 'Status') current.status++;

    moveTypeCounts.set(type, current);
  });

  // Convert to array format
  const moveTypes = Array.from(moveTypeCounts.entries())
    .map(([type, counts]) => ({
      type,
      count: counts.total,
      physicalCount: counts.physical,
      specialCount: counts.special,
      statusCount: counts.status,
    }))
    .sort((a, b) => b.count - a.count);

  // Get all attacking move types (excluding status moves, includes duplicates for counting)
  const attackingMoveTypes = teamMoves
    .filter((move) => move.category !== 'Status')
    .map((move) => move.type);

  // Calculate offensive coverage - returns both sets and detailed counts
  // Pass full list with duplicates to track move counts
  const {
    superEffectiveCoverage,
    superEffectiveCoverageCounts,
    notVeryEffectiveCoverage,
    noEffectCoverage,
  } = getCombinedOffensiveCoverage(attackingMoveTypes);

  const superEffectiveTypes = Array.from(superEffectiveCoverage);
  const cannotHitTypes = Array.from(noEffectCoverage);

  // Build detailed coverage from the counts returned by getCombinedOffensiveCoverage
  const superEffectiveCoverageDetailed = Array.from(
    superEffectiveCoverageCounts.entries()
  )
    .map(([type, moveCount]) => ({ type, moveCount }))
    .sort((a, b) => b.moveCount - a.moveCount); // Sort by move count descending

  // Calculate coverage gaps directly from superEffectiveCoverage (avoid duplicate calculation)
  const coverageGaps = getAllTypes().filter(
    (type) => !superEffectiveCoverage.has(type)
  );

  // Calculate types that actually RESIST the team's moves (take 0.5x or 0.25x damage)
  // These are types where none of your moves hit super-effectively AND at least one resists
  const resistedBy = Array.from(notVeryEffectiveCoverage).filter(
    (type) => !superEffectiveCoverage.has(type)
  );

  return {
    moveTypes,
    superEffectiveCoverage: superEffectiveTypes,
    superEffectiveCoverageDetailed,
    coverageGaps,
    resistedBy,
    cannotHit: cannotHitTypes,
  };
}

// Overall score weighting constants
// These determine the relative importance of each metric in the team's overall rating
const WEIGHT_TYPE_DIVERSITY = 0.3; // 30% - Prevents predictability and limited options
const WEIGHT_DEFENSIVE_BALANCE = 0.4; // 40% - Most critical for team survival
const WEIGHT_OFFENSIVE_BALANCE = 0.3; // 30% - Important for hitting threats super-effectively

const TOTAL_POKEMON_TYPES = 18; // Total number of Pokemon types (excluding special types)

/**
 * Get summary statistics for team analysis
 *
 * Calculates an overall team rating based on three key metrics:
 * - Type Diversity: Variety of move types (prevents predictability)
 * - Defensive Balance: Ratio of resistances to weaknesses (team survivability)
 * - Offensive Balance: Super-effective coverage (ability to hit threats)
 */
export function getTeamAnalysisSummary(
  defensiveCoverage: TeamDefensiveCoverage,
  offensiveCoverage: TeamOffensiveCoverage
): {
  typeDiversity: number;
  defensiveBalance: number;
  offensiveBalance: number;
  overallScore: number;
  topThreats: TypeName[];
  topAdvantages: TypeName[];
} {
  // Type diversity: unique move types / total types (0-1 scale)
  // Higher is better - more type variety means more options and less predictability
  const typeDiversity = offensiveCoverage.moveTypes.length / TOTAL_POKEMON_TYPES;

  // Defensive balance: ratio of resistances to weaknesses (0-∞ scale, capped at 1)
  // Higher is better - more resistances than weaknesses means better survivability
  // Equal resistances/weaknesses = 1.0 (perfectly balanced)
  const totalResistances = defensiveCoverage.teamResistances.reduce(
    (sum, { count }) => sum + count,
    0
  );
  const totalWeaknesses = defensiveCoverage.teamWeaknesses.reduce(
    (sum, { count }) => sum + count,
    0
  );
  const defensiveBalance =
    totalWeaknesses > 0 ? totalResistances / totalWeaknesses : 1;

  // Offensive balance: super-effective coverage / total types (0-1 scale)
  // Higher is better - can hit more types for super-effective damage
  const offensiveBalance = offensiveCoverage.superEffectiveCoverage.length / TOTAL_POKEMON_TYPES;

  // Overall score (0-1 scale, converted to 0-100% for display)
  // Weighted average prioritizing defensive balance (40%), with type diversity
  // and offensive balance each contributing 30%
  const overallScore =
    typeDiversity * WEIGHT_TYPE_DIVERSITY +
    Math.min(defensiveBalance, 1) * WEIGHT_DEFENSIVE_BALANCE +
    offensiveBalance * WEIGHT_OFFENSIVE_BALANCE;

  // Top 3 threats (most common weaknesses)
  const topThreats = defensiveCoverage.teamWeaknesses
    .slice(0, 3)
    .map(({ type }) => type);

  // Top 3 advantages (types with both resistance and SE coverage)
  // Combines defensive resistances with offensive SE move counts
  const advantageScores = new Map<TypeName, number>();

  // Add resistance counts (number of Pokemon that resist each type)
  defensiveCoverage.teamResistances.forEach(({ type, count }) => {
    advantageScores.set(type, count);
  });

  // Add SE move counts (number of moves that hit each type super-effectively)
  offensiveCoverage.superEffectiveCoverageDetailed.forEach(({ type, moveCount }) => {
    const current = advantageScores.get(type) || 0;
    advantageScores.set(type, current + moveCount);
  });

  const topAdvantages = Array.from(advantageScores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type]) => type);

  return {
    typeDiversity,
    defensiveBalance,
    offensiveBalance,
    overallScore,
    topThreats,
    topAdvantages,
  };
}
