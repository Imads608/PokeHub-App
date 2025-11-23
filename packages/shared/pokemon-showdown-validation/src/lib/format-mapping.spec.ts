import {
  getShowdownFormatId,
  isValidShowdownFormatId,
  parseShowdownFormatId,
} from './format-mapping';

describe('Format Mapping', () => {
  describe('getShowdownFormatId', () => {
    it('should map Gen 9 Singles OU to gen9ou', () => {
      expect(getShowdownFormatId(9, 'Singles', 'OU')).toBe('gen9ou');
    });

    it('should map Gen 9 Singles Ubers to gen9ubers', () => {
      expect(getShowdownFormatId(9, 'Singles', 'Uber')).toBe('gen9ubers');
    });

    it('should map Gen 9 Doubles OU to gen9doublesou', () => {
      expect(getShowdownFormatId(9, 'Doubles', 'DOU')).toBe('gen9doublesou');
    });

    it('should map Gen 9 Doubles Ubers to gen9doublesubers', () => {
      expect(getShowdownFormatId(9, 'Doubles', 'DUber')).toBe(
        'gen9doublesubers'
      );
    });

    it('should map Gen 8 Singles OU to gen8ou', () => {
      expect(getShowdownFormatId(8, 'Singles', 'OU')).toBe('gen8ou');
    });

    it('should map Gen 9 Singles UU to gen9uu', () => {
      expect(getShowdownFormatId(9, 'Singles', 'UU')).toBe('gen9uu');
    });

    it('should map Gen 9 Singles RU to gen9ru', () => {
      expect(getShowdownFormatId(9, 'Singles', 'RU')).toBe('gen9ru');
    });

    it('should map Gen 9 Singles Little Cup to gen9lc', () => {
      expect(getShowdownFormatId(9, 'Singles', 'LC')).toBe('gen9lc');
    });

    it('should handle unranked tiers by mapping to base tier', () => {
      expect(getShowdownFormatId(9, 'Singles', '(OU)')).toBe('gen9ou');
      expect(getShowdownFormatId(9, 'Doubles', '(DOU)')).toBe('gen9doublesou');
    });
  });

  describe('isValidShowdownFormatId', () => {
    it('should return true for valid format IDs', () => {
      expect(isValidShowdownFormatId('gen9ou')).toBe(true);
      expect(isValidShowdownFormatId('gen8ubers')).toBe(true);
      expect(isValidShowdownFormatId('gen9doublesou')).toBe(true);
      expect(isValidShowdownFormatId('gen9vgc2024')).toBe(true);
      expect(isValidShowdownFormatId('gen1ou')).toBe(true);
    });

    it('should return false for invalid format IDs', () => {
      expect(isValidShowdownFormatId('ou')).toBe(false);
      expect(isValidShowdownFormatId('gen0ou')).toBe(false);
      expect(isValidShowdownFormatId('gen10ou')).toBe(false);
      expect(isValidShowdownFormatId('invalid')).toBe(false);
      expect(isValidShowdownFormatId('')).toBe(false);
    });
  });

  describe('parseShowdownFormatId', () => {
    it('should parse gen9ou correctly', () => {
      const result = parseShowdownFormatId('gen9ou');
      expect(result).toEqual({ generation: 9, format: 'ou' });
    });

    it('should parse gen8vgc2022 correctly', () => {
      const result = parseShowdownFormatId('gen8vgc2022');
      expect(result).toEqual({ generation: 8, format: 'vgc2022' });
    });

    it('should parse gen9doublesou correctly', () => {
      const result = parseShowdownFormatId('gen9doublesou');
      expect(result).toEqual({ generation: 9, format: 'doublesou' });
    });

    it('should parse gen1ou correctly', () => {
      const result = parseShowdownFormatId('gen1ou');
      expect(result).toEqual({ generation: 1, format: 'ou' });
    });

    it('should return null for invalid format IDs', () => {
      expect(parseShowdownFormatId('ou')).toBeNull();
      expect(parseShowdownFormatId('gen0ou')).toBeNull();
      expect(parseShowdownFormatId('invalid')).toBeNull();
      expect(parseShowdownFormatId('')).toBeNull();
    });

    it('should handle formats with numbers', () => {
      const result = parseShowdownFormatId('gen9vgc2024');
      expect(result).toEqual({ generation: 9, format: 'vgc2024' });
    });
  });
});
