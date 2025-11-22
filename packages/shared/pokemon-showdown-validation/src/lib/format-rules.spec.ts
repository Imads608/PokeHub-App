import {
  getFormatRules,
  isRuleActive,
  getRuleDescription,
  getFormatClauses,
} from './format-rules';

describe('Format Rules', () => {
  describe('getFormatRules', () => {
    it('should return rules for gen9ou', () => {
      const rules = getFormatRules('gen9ou');

      expect(rules).not.toBeNull();
      expect(rules?.formatId).toBe('gen9ou');
      expect(rules?.formatName).toBe('[Gen 9] OU');
      expect(rules?.rules).toBeDefined();
      expect(rules?.banlist).toBeDefined();
      expect(rules?.teamSize).toBeDefined();
      expect(rules?.level).toBeDefined();
    });

    it('should return rules for gen9doublesou', () => {
      const rules = getFormatRules('gen9doublesou');

      expect(rules).not.toBeNull();
      expect(rules?.formatId).toBe('gen9doublesou');
      expect(rules?.teamSize).toBeDefined();
      expect(rules?.level).toBe(100);
    });

    it('should return null for invalid format', () => {
      const rules = getFormatRules('invalidformat');
      expect(rules).toBeNull();
    });

    it('should include team size limits', () => {
      const rules = getFormatRules('gen9ou');

      expect(rules?.teamSize.min).toBeGreaterThan(0);
      expect(rules?.teamSize.max).toBeGreaterThanOrEqual(rules?.teamSize.min || 0);
    });
  });

  describe('isRuleActive', () => {
    it('should return true for active rules', () => {
      // Standard ruleset is active in OU
      expect(isRuleActive('gen9ou', 'Standard')).toBe(true);
    });

    it('should return false for inactive rules', () => {
      expect(isRuleActive('gen9ou', 'Nonexistent Rule')).toBe(false);
    });

    it('should return false for invalid format', () => {
      expect(isRuleActive('invalidformat', 'Standard')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(isRuleActive('gen9ou', 'standard')).toBe(true);
      expect(isRuleActive('gen9ou', 'STANDARD')).toBe(true);
    });

    it('should detect specific clauses', () => {
      expect(isRuleActive('gen9ou', 'Evasion Abilities Clause')).toBe(true);
      expect(isRuleActive('gen9ou', 'Sleep Moves Clause')).toBe(true);
    });
  });

  describe('getRuleDescription', () => {
    it('should return descriptions for known rules', () => {
      const desc = getRuleDescription('Species Clause');
      expect(desc).toContain('Pokemon');
      expect(desc).not.toBe('Species Clause');
    });

    it('should return the rule name for unknown rules', () => {
      const desc = getRuleDescription('Unknown Rule');
      expect(desc).toBe('Unknown Rule');
    });

    it('should describe Sleep Clause', () => {
      const desc = getRuleDescription('Sleep Clause Mod');
      expect(desc).toContain('sleep');
    });

    it('should describe OHKO Clause', () => {
      const desc = getRuleDescription('OHKO Clause');
      expect(desc).toContain('One-hit KO');
    });
  });

  describe('getFormatClauses', () => {
    it('should return clauses for gen9ou', () => {
      const clauses = getFormatClauses('gen9ou');

      expect(clauses).toBeDefined();
      expect(Array.isArray(clauses)).toBe(true);
      expect(clauses.length).toBeGreaterThan(0);
    });

    it('should return empty array for invalid format', () => {
      const clauses = getFormatClauses('invalidformat');
      expect(clauses).toEqual([]);
    });

    it('should include clause names and descriptions', () => {
      const clauses = getFormatClauses('gen9ou');

      clauses.forEach((clause) => {
        expect(clause).toHaveProperty('name');
        expect(clause).toHaveProperty('description');
        expect(typeof clause.name).toBe('string');
        expect(typeof clause.description).toBe('string');
      });
    });

    it('should filter only clauses and mods', () => {
      const clauses = getFormatClauses('gen9ou');

      clauses.forEach((clause) => {
        const hasClauseOrMod =
          clause.name.includes('Clause') || clause.name.includes('Mod');
        expect(hasClauseOrMod).toBe(true);
      });
    });
  });
});
