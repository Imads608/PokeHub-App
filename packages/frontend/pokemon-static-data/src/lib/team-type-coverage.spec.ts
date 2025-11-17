import type { TypeName, MoveCategory } from '@pkmn/dex';
import {
  calculateTeamDefensiveCoverage,
  calculateTeamOffensiveCoverage,
  getTeamAnalysisSummary,
  type MoveForCoverage,
} from './team-type-coverage';

describe('Team Type Coverage Calculations', () => {
  describe('calculateTeamDefensiveCoverage', () => {
    it('should calculate weaknesses for a single-type Pokemon', () => {
      const team = [{ types: ['Electric' as TypeName] }];

      const result = calculateTeamDefensiveCoverage(team);

      // Electric is weak to Ground
      expect(result.teamWeaknesses).toContainEqual({ type: 'Ground', count: 1 });
    });

    it('should calculate resistances for a single-type Pokemon', () => {
      const team = [{ types: ['Electric' as TypeName] }];

      const result = calculateTeamDefensiveCoverage(team);

      // Electric resists Electric, Flying, Steel
      expect(result.teamResistances.length).toBeGreaterThan(0);
      expect(result.teamResistances).toContainEqual({ type: 'Electric', count: 1 });
      expect(result.teamResistances).toContainEqual({ type: 'Flying', count: 1 });
      expect(result.teamResistances).toContainEqual({ type: 'Steel', count: 1 });
    });

    it('should calculate immunities for Ghost-type Pokemon', () => {
      const team = [{ types: ['Ghost' as TypeName] }];

      const result = calculateTeamDefensiveCoverage(team);

      // Ghost is immune to Normal and Fighting
      expect(result.teamImmunities).toContainEqual({ type: 'Normal', count: 1 });
      expect(result.teamImmunities).toContainEqual({ type: 'Fighting', count: 1 });
    });

    it('should count shared weaknesses across multiple Pokemon', () => {
      const team = [
        { types: ['Fire' as TypeName] },
        { types: ['Grass' as TypeName] },
        { types: ['Bug' as TypeName] },
      ];

      const result = calculateTeamDefensiveCoverage(team);

      // All three are weak to Fire (wait, Fire isn't weak to Fire, but Grass and Bug are)
      // Let's check for Rock which hits Bug and Fire
      const rockWeakness = result.teamWeaknesses.find((w) => w.type === 'Rock');
      expect(rockWeakness).toBeDefined();
      expect(rockWeakness!.count).toBe(2); // Fire and Bug weak to Rock
    });

    it('should identify critical weaknesses (80%+ of team)', () => {
      const team = [
        { types: ['Fire' as TypeName] },
        { types: ['Fire' as TypeName] },
        { types: ['Fire' as TypeName] },
        { types: ['Fire' as TypeName] },
        { types: ['Fire' as TypeName] },
        { types: ['Fire' as TypeName] },
      ];

      const result = calculateTeamDefensiveCoverage(team);

      // All 6 Fire-types are weak to Water, Ground, Rock
      expect(result.criticalWeaknesses).toContain('Water');
      expect(result.criticalWeaknesses).toContain('Ground');
      expect(result.criticalWeaknesses).toContain('Rock');
    });

    it('should identify shared weaknesses (50-79% of team)', () => {
      const team = [
        { types: ['Fire' as TypeName] },
        { types: ['Fire' as TypeName] },
        { types: ['Fire' as TypeName] },
        { types: ['Electric' as TypeName] },
        { types: ['Electric' as TypeName] },
        { types: ['Electric' as TypeName] },
      ];

      const result = calculateTeamDefensiveCoverage(team);

      // 3/6 (50%) of team weak to Ground (all Fire types)
      // Actually Fire is weak to Ground, and Electric is also weak to Ground
      // So Ground should be critical (6/6 = 100%)
      expect(result.criticalWeaknesses).toContain('Ground');

      // Water hits 3/6 (Fire types only)
      expect(result.sharedWeaknesses).toContain('Water');
    });

    it('should sort weaknesses by count (descending)', () => {
      const team = [
        { types: ['Fire' as TypeName] },
        { types: ['Fire' as TypeName] },
        { types: ['Electric' as TypeName] },
      ];

      const result = calculateTeamDefensiveCoverage(team);

      // Ground hits all 3 (2 Fire + 1 Electric)
      // Water hits 2 (Fire types only)
      expect(result.teamWeaknesses[0].count).toBeGreaterThanOrEqual(result.teamWeaknesses[1].count);
    });

    it('should handle dual-type Pokemon', () => {
      const team = [{ types: ['Water' as TypeName, 'Ground' as TypeName] }];

      const result = calculateTeamDefensiveCoverage(team);

      // Water/Ground is 4x weak to Grass
      expect(result.teamWeaknesses).toContainEqual({ type: 'Grass', count: 1 });
    });

    it('should handle empty team', () => {
      const team: { types: TypeName[] }[] = [];

      const result = calculateTeamDefensiveCoverage(team);

      expect(result.teamWeaknesses).toEqual([]);
      expect(result.teamResistances).toEqual([]);
      expect(result.teamImmunities).toEqual([]);
      expect(result.criticalWeaknesses).toEqual([]);
      expect(result.sharedWeaknesses).toEqual([]);
    });
  });

  describe('calculateTeamOffensiveCoverage', () => {
    it('should count move types correctly', () => {
      const moves: MoveForCoverage[] = [
        { type: 'Fire' as TypeName, category: 'Special' as MoveCategory },
        { type: 'Fire' as TypeName, category: 'Physical' as MoveCategory },
        { type: 'Water' as TypeName, category: 'Special' as MoveCategory },
      ];

      const result = calculateTeamOffensiveCoverage(moves);

      expect(result.moveTypes).toContainEqual({
        type: 'Fire',
        count: 2,
        physicalCount: 1,
        specialCount: 1,
        statusCount: 0,
      });
      expect(result.moveTypes).toContainEqual({
        type: 'Water',
        count: 1,
        physicalCount: 0,
        specialCount: 1,
        statusCount: 0,
      });
    });

    it('should categorize moves by physical/special/status', () => {
      const moves: MoveForCoverage[] = [
        { type: 'Normal' as TypeName, category: 'Physical' as MoveCategory },
        { type: 'Normal' as TypeName, category: 'Special' as MoveCategory },
        { type: 'Normal' as TypeName, category: 'Status' as MoveCategory },
      ];

      const result = calculateTeamOffensiveCoverage(moves);

      expect(result.moveTypes).toContainEqual({
        type: 'Normal',
        count: 3,
        physicalCount: 1,
        specialCount: 1,
        statusCount: 1,
      });
    });

    it('should identify super-effective coverage', () => {
      const moves: MoveForCoverage[] = [
        { type: 'Fire' as TypeName, category: 'Special' as MoveCategory },
        { type: 'Water' as TypeName, category: 'Special' as MoveCategory },
      ];

      const result = calculateTeamOffensiveCoverage(moves);

      // Fire is super-effective against Grass, Ice, Bug, Steel
      expect(result.superEffectiveCoverage).toContain('Grass');
      expect(result.superEffectiveCoverage).toContain('Ice');
      expect(result.superEffectiveCoverage).toContain('Bug');
      expect(result.superEffectiveCoverage).toContain('Steel');

      // Water is super-effective against Fire, Ground, Rock
      expect(result.superEffectiveCoverage).toContain('Fire');
      expect(result.superEffectiveCoverage).toContain('Ground');
      expect(result.superEffectiveCoverage).toContain('Rock');
    });

    it('should identify coverage gaps (types not hit super-effectively)', () => {
      const moves: MoveForCoverage[] = [
        { type: 'Normal' as TypeName, category: 'Physical' as MoveCategory },
      ];

      const result = calculateTeamOffensiveCoverage(moves);

      // Normal is not super-effective against any type
      // So coverage gaps should include all types except ones Normal hits SE (none)
      expect(result.coverageGaps.length).toBe(18); // All 18 types
    });

    it('should identify types the team cannot hit (immunities)', () => {
      const moves: MoveForCoverage[] = [
        { type: 'Normal' as TypeName, category: 'Physical' as MoveCategory },
        { type: 'Fighting' as TypeName, category: 'Physical' as MoveCategory },
      ];

      const result = calculateTeamOffensiveCoverage(moves);

      // Normal can't hit Ghost, Fighting can't hit Ghost either
      expect(result.cannotHit).toContain('Ghost');
    });

    it('should identify types that resist the team\'s moves', () => {
      const moves: MoveForCoverage[] = [
        { type: 'Normal' as TypeName, category: 'Physical' as MoveCategory },
      ];

      const result = calculateTeamOffensiveCoverage(moves);

      // Types that resist Normal but aren't hit SE by anything
      expect(result.resistedBy).toContain('Rock');
      expect(result.resistedBy).toContain('Steel');
    });

    it('should not count status moves in offensive coverage', () => {
      const moves: MoveForCoverage[] = [
        { type: 'Normal' as TypeName, category: 'Status' as MoveCategory },
        { type: 'Electric' as TypeName, category: 'Status' as MoveCategory },
      ];

      const result = calculateTeamOffensiveCoverage(moves);

      // Status moves should be counted in moveTypes but not in coverage
      expect(result.moveTypes.length).toBe(2);
      expect(result.superEffectiveCoverage.length).toBe(0); // No attacking moves
    });

    it('should provide detailed super-effective coverage with move counts', () => {
      const moves: MoveForCoverage[] = [
        { type: 'Fire' as TypeName, category: 'Special' as MoveCategory },
        { type: 'Fire' as TypeName, category: 'Physical' as MoveCategory },
        { type: 'Fighting' as TypeName, category: 'Physical' as MoveCategory },
      ];

      const result = calculateTeamOffensiveCoverage(moves);

      // Both Fire and Fighting hit Steel super-effectively
      const steelCoverage = result.superEffectiveCoverageDetailed.find((c) => c.type === 'Steel');
      expect(steelCoverage).toBeDefined();
      expect(steelCoverage!.moveCount).toBe(3); // 2 Fire + 1 Fighting
    });

    it('should sort move types by count (descending)', () => {
      const moves: MoveForCoverage[] = [
        { type: 'Fire' as TypeName, category: 'Special' as MoveCategory },
        { type: 'Fire' as TypeName, category: 'Physical' as MoveCategory },
        { type: 'Fire' as TypeName, category: 'Physical' as MoveCategory },
        { type: 'Water' as TypeName, category: 'Special' as MoveCategory },
      ];

      const result = calculateTeamOffensiveCoverage(moves);

      // Fire (3) should come before Water (1)
      expect(result.moveTypes[0].type).toBe('Fire');
      expect(result.moveTypes[0].count).toBe(3);
    });

    it('should handle empty move list', () => {
      const moves: MoveForCoverage[] = [];

      const result = calculateTeamOffensiveCoverage(moves);

      expect(result.moveTypes).toEqual([]);
      expect(result.superEffectiveCoverage).toEqual([]);
      expect(result.coverageGaps.length).toBe(18); // All types
      expect(result.cannotHit).toEqual([]);
      expect(result.resistedBy).toEqual([]);
    });
  });

  describe('getTeamAnalysisSummary', () => {
    it('should calculate type diversity (0-1 scale)', () => {
      const defensiveCoverage = {
        teamWeaknesses: [],
        teamResistances: [],
        teamImmunities: [],
        criticalWeaknesses: [],
        sharedWeaknesses: [],
      };

      const offensiveCoverage = {
        moveTypes: [
          { type: 'Fire' as TypeName, count: 1, physicalCount: 1, specialCount: 0, statusCount: 0 },
          { type: 'Water' as TypeName, count: 1, physicalCount: 0, specialCount: 1, statusCount: 0 },
          { type: 'Grass' as TypeName, count: 1, physicalCount: 0, specialCount: 1, statusCount: 0 },
        ],
        superEffectiveCoverage: [],
        superEffectiveCoverageDetailed: [],
        coverageGaps: [],
        resistedBy: [],
        cannotHit: [],
      };

      const result = getTeamAnalysisSummary(defensiveCoverage, offensiveCoverage);

      // 3 unique move types / 18 total types = 0.1667
      expect(result.typeDiversity).toBeCloseTo(3 / 18, 4);
    });

    it('should calculate defensive balance (resistances/weaknesses ratio)', () => {
      const defensiveCoverage = {
        teamWeaknesses: [
          { type: 'Fire' as TypeName, count: 2 },
          { type: 'Water' as TypeName, count: 1 },
        ],
        teamResistances: [
          { type: 'Grass' as TypeName, count: 3 },
          { type: 'Electric' as TypeName, count: 3 },
        ],
        teamImmunities: [],
        criticalWeaknesses: [],
        sharedWeaknesses: [],
      };

      const offensiveCoverage = {
        moveTypes: [],
        superEffectiveCoverage: [],
        superEffectiveCoverageDetailed: [],
        coverageGaps: [],
        resistedBy: [],
        cannotHit: [],
      };

      const result = getTeamAnalysisSummary(defensiveCoverage, offensiveCoverage);

      // Total resistances: 3 + 3 = 6
      // Total weaknesses: 2 + 1 = 3
      // Balance: 6 / 3 = 2.0 (capped at 1.0 for scoring)
      expect(result.defensiveBalance).toBe(2.0);
    });

    it('should cap defensive balance at 1.0 for overall score calculation', () => {
      const defensiveCoverage = {
        teamWeaknesses: [{ type: 'Fire' as TypeName, count: 1 }],
        teamResistances: [
          { type: 'Grass' as TypeName, count: 5 },
          { type: 'Electric' as TypeName, count: 5 },
        ],
        teamImmunities: [],
        criticalWeaknesses: [],
        sharedWeaknesses: [],
      };

      const offensiveCoverage = {
        moveTypes: [],
        superEffectiveCoverage: [],
        superEffectiveCoverageDetailed: [],
        coverageGaps: [],
        resistedBy: [],
        cannotHit: [],
      };

      const result = getTeamAnalysisSummary(defensiveCoverage, offensiveCoverage);

      // Even though defensive balance is 10.0, the overall score should use min(10.0, 1.0) = 1.0
      expect(result.defensiveBalance).toBe(10.0); // Raw value
      // Overall score uses capped value
      expect(result.overallScore).toBeLessThanOrEqual(1.0);
    });

    it('should handle zero weaknesses (defensive balance = 1.0)', () => {
      const defensiveCoverage = {
        teamWeaknesses: [],
        teamResistances: [{ type: 'Grass' as TypeName, count: 3 }],
        teamImmunities: [],
        criticalWeaknesses: [],
        sharedWeaknesses: [],
      };

      const offensiveCoverage = {
        moveTypes: [],
        superEffectiveCoverage: [],
        superEffectiveCoverageDetailed: [],
        coverageGaps: [],
        resistedBy: [],
        cannotHit: [],
      };

      const result = getTeamAnalysisSummary(defensiveCoverage, offensiveCoverage);

      expect(result.defensiveBalance).toBe(1.0); // Default when no weaknesses
    });

    it('should calculate offensive balance (SE coverage / total types)', () => {
      const defensiveCoverage = {
        teamWeaknesses: [],
        teamResistances: [],
        teamImmunities: [],
        criticalWeaknesses: [],
        sharedWeaknesses: [],
      };

      const offensiveCoverage = {
        moveTypes: [],
        superEffectiveCoverage: [
          'Fire' as TypeName,
          'Water' as TypeName,
          'Grass' as TypeName,
          'Electric' as TypeName,
          'Ice' as TypeName,
          'Fighting' as TypeName,
          'Poison' as TypeName,
          'Ground' as TypeName,
          'Flying' as TypeName,
        ],
        superEffectiveCoverageDetailed: [],
        coverageGaps: [],
        resistedBy: [],
        cannotHit: [],
      };

      const result = getTeamAnalysisSummary(defensiveCoverage, offensiveCoverage);

      // 9 types covered / 18 total = 0.5
      expect(result.offensiveBalance).toBe(9 / 18);
    });

    it('should calculate overall score with correct weights', () => {
      const defensiveCoverage = {
        teamWeaknesses: [{ type: 'Fire' as TypeName, count: 1 }],
        teamResistances: [{ type: 'Water' as TypeName, count: 1 }],
        teamImmunities: [],
        criticalWeaknesses: [],
        sharedWeaknesses: [],
      };

      const offensiveCoverage = {
        moveTypes: [
          { type: 'Fire' as TypeName, count: 1, physicalCount: 1, specialCount: 0, statusCount: 0 },
        ],
        superEffectiveCoverage: ['Grass' as TypeName, 'Ice' as TypeName],
        superEffectiveCoverageDetailed: [],
        coverageGaps: [],
        resistedBy: [],
        cannotHit: [],
      };

      const result = getTeamAnalysisSummary(defensiveCoverage, offensiveCoverage);

      // Type diversity: 1/18 = 0.0556 (weight: 0.3)
      // Defensive balance: 1/1 = 1.0 (weight: 0.4)
      // Offensive balance: 2/18 = 0.1111 (weight: 0.3)
      // Overall: 0.0556*0.3 + 1.0*0.4 + 0.1111*0.3 = 0.01667 + 0.4 + 0.03333 = 0.45
      expect(result.overallScore).toBeCloseTo(0.45, 2);
    });

    it('should identify top 3 threats (most common weaknesses)', () => {
      const defensiveCoverage = {
        teamWeaknesses: [
          { type: 'Fire' as TypeName, count: 5 },
          { type: 'Water' as TypeName, count: 4 },
          { type: 'Grass' as TypeName, count: 3 },
          { type: 'Electric' as TypeName, count: 2 },
        ],
        teamResistances: [],
        teamImmunities: [],
        criticalWeaknesses: [],
        sharedWeaknesses: [],
      };

      const offensiveCoverage = {
        moveTypes: [],
        superEffectiveCoverage: [],
        superEffectiveCoverageDetailed: [],
        coverageGaps: [],
        resistedBy: [],
        cannotHit: [],
      };

      const result = getTeamAnalysisSummary(defensiveCoverage, offensiveCoverage);

      expect(result.topThreats).toEqual(['Fire', 'Water', 'Grass']);
    });

    it('should handle fewer than 3 weaknesses', () => {
      const defensiveCoverage = {
        teamWeaknesses: [{ type: 'Fire' as TypeName, count: 2 }],
        teamResistances: [],
        teamImmunities: [],
        criticalWeaknesses: [],
        sharedWeaknesses: [],
      };

      const offensiveCoverage = {
        moveTypes: [],
        superEffectiveCoverage: [],
        superEffectiveCoverageDetailed: [],
        coverageGaps: [],
        resistedBy: [],
        cannotHit: [],
      };

      const result = getTeamAnalysisSummary(defensiveCoverage, offensiveCoverage);

      expect(result.topThreats).toEqual(['Fire']);
    });

    it('should identify top 3 advantages (combining resistances and SE coverage)', () => {
      const defensiveCoverage = {
        teamWeaknesses: [],
        teamResistances: [
          { type: 'Fire' as TypeName, count: 3 },
          { type: 'Water' as TypeName, count: 2 },
        ],
        teamImmunities: [],
        criticalWeaknesses: [],
        sharedWeaknesses: [],
      };

      const offensiveCoverage = {
        moveTypes: [],
        superEffectiveCoverage: [],
        superEffectiveCoverageDetailed: [
          { type: 'Fire' as TypeName, moveCount: 4 },
          { type: 'Grass' as TypeName, moveCount: 3 },
        ],
        coverageGaps: [],
        resistedBy: [],
        cannotHit: [],
      };

      const result = getTeamAnalysisSummary(defensiveCoverage, offensiveCoverage);

      // Fire: 3 (resistance) + 4 (SE moves) = 7
      // Water: 2 (resistance) + 0 (SE moves) = 2
      // Grass: 0 (resistance) + 3 (SE moves) = 3
      // Top 3: Fire, Grass, Water
      expect(result.topAdvantages).toEqual(['Fire', 'Grass', 'Water']);
    });

    it('should return empty arrays for empty team', () => {
      const defensiveCoverage = {
        teamWeaknesses: [],
        teamResistances: [],
        teamImmunities: [],
        criticalWeaknesses: [],
        sharedWeaknesses: [],
      };

      const offensiveCoverage = {
        moveTypes: [],
        superEffectiveCoverage: [],
        superEffectiveCoverageDetailed: [],
        coverageGaps: [],
        resistedBy: [],
        cannotHit: [],
      };

      const result = getTeamAnalysisSummary(defensiveCoverage, offensiveCoverage);

      expect(result.topThreats).toEqual([]);
      expect(result.topAdvantages).toEqual([]);
      expect(result.typeDiversity).toBe(0);
      expect(result.defensiveBalance).toBe(1.0);
      expect(result.offensiveBalance).toBe(0);
    });
  });
});
