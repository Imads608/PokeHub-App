import { getFormatRules } from './format-rules';

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
});
