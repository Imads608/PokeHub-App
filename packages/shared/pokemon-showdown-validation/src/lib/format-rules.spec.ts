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

    describe('completeBanlist', () => {
      it('should include completeBanlist field', () => {
        const rules = getFormatRules('gen9ou');

        expect(rules?.completeBanlist).toBeDefined();
        expect(Array.isArray(rules?.completeBanlist)).toBe(true);
      });

      it('should recursively resolve bans for UU format', () => {
        const rules = getFormatRules('gen9uu');

        expect(rules).not.toBeNull();
        expect(rules?.completeBanlist).toBeDefined();

        // UU should have more bans in completeBanlist than direct banlist
        // because it inherits from OU
        expect(rules!.completeBanlist.length).toBeGreaterThan(rules!.banlist.length);

        // UU's completeBanlist should include bans from OU like "Uber" and "AG"
        expect(rules!.completeBanlist).toContain('Uber');
        expect(rules!.completeBanlist).toContain('AG');
      });

      it('should handle deep hierarchy (RU format)', () => {
        const rules = getFormatRules('gen9ru');

        expect(rules).not.toBeNull();

        // RU inherits from UU which inherits from OU
        // So it should have bans from all three levels
        expect(rules!.completeBanlist.length).toBeGreaterThan(0);
        expect(rules!.completeBanlist).toContain('Uber'); // From OU
        expect(rules!.completeBanlist).toContain('OU'); // From UU
        expect(rules!.completeBanlist).toContain('UU'); // From RU direct
      });

      it('should handle very deep hierarchy (PU format)', () => {
        const rules = getFormatRules('gen9pu');

        expect(rules).not.toBeNull();

        // PU: PU → NU → RU → UU → OU
        expect(rules!.completeBanlist).toContain('Uber'); // From OU
        expect(rules!.completeBanlist).toContain('OU'); // From UU
        expect(rules!.completeBanlist).toContain('UU'); // From RU
        expect(rules!.completeBanlist).toContain('RU'); // From NU
        expect(rules!.completeBanlist).toContain('NU'); // From PU
      });

      it('should handle formats with no parent (AG)', () => {
        const rules = getFormatRules('gen9anythinggoes');

        expect(rules).not.toBeNull();
        // AG has no bans and no parent
        expect(rules!.completeBanlist).toEqual([]);
      });

      it('should handle formats with no parent (OU)', () => {
        const rules = getFormatRules('gen9ou');

        expect(rules).not.toBeNull();
        // OU's completeBanlist should equal its direct banlist
        // (no parent format references)
        expect(rules!.completeBanlist.length).toBe(rules!.banlist.length);
      });

      it('should deduplicate bans across hierarchy', () => {
        const rules = getFormatRules('gen9uu');

        expect(rules).not.toBeNull();

        // Check for no duplicates
        const uniqueBans = new Set(rules!.completeBanlist);
        expect(uniqueBans.size).toBe(rules!.completeBanlist.length);
      });

      it('should preserve order (parent bans first)', () => {
        const rules = getFormatRules('gen9uu');

        expect(rules).not.toBeNull();

        // UU direct ban list includes "OU" and "UUBL"
        // These should come after parent OU's bans
        const ouIndex = rules!.completeBanlist.indexOf('OU');
        const uberIndex = rules!.completeBanlist.indexOf('Uber');

        // "Uber" is from OU (parent), "OU" is from UU (child)
        // Parent bans should come before child bans
        expect(uberIndex).toBeLessThan(ouIndex);
      });
    });
  });
});
