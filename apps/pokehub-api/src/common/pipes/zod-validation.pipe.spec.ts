import { ZodValidationPipe } from './zod-validation.pipe';
import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

describe('ZodValidationPipe', () => {
  describe('with simple string schema', () => {
    const stringSchema = z.string().min(1, 'String is required');
    let pipe: ZodValidationPipe<string>;

    beforeEach(() => {
      pipe = new ZodValidationPipe(stringSchema);
    });

    it('should pass valid string through unchanged', () => {
      const result = pipe.transform('hello');
      expect(result).toBe('hello');
    });

    it('should throw BadRequestException for invalid input', () => {
      expect(() => pipe.transform('')).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for wrong type', () => {
      expect(() => pipe.transform(123)).toThrow(BadRequestException);
    });
  });

  describe('with object schema', () => {
    const userSchema = z.object({
      name: z.string().min(1, 'Name is required'),
      email: z.string().email('Invalid email format'),
      age: z.number().min(0, 'Age must be positive').optional(),
    });

    type User = z.infer<typeof userSchema>;
    let pipe: ZodValidationPipe<User>;

    beforeEach(() => {
      pipe = new ZodValidationPipe(userSchema);
    });

    it('should pass valid object through unchanged', () => {
      const validUser = { name: 'John', email: 'john@example.com' };
      const result = pipe.transform(validUser);
      expect(result).toEqual(validUser);
    });

    it('should pass valid object with optional field', () => {
      const validUser = { name: 'John', email: 'john@example.com', age: 25 };
      const result = pipe.transform(validUser);
      expect(result).toEqual(validUser);
    });

    it('should throw BadRequestException for missing required field', () => {
      const invalidUser = { email: 'john@example.com' };
      expect(() => pipe.transform(invalidUser)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid email', () => {
      const invalidUser = { name: 'John', email: 'not-an-email' };
      expect(() => pipe.transform(invalidUser)).toThrow(BadRequestException);
    });
  });

  describe('error formatting', () => {
    const schema = z.object({
      name: z.string().min(1, 'Name is required'),
      email: z.string().email('Invalid email'),
      nested: z.object({
        field: z.string().min(1, 'Nested field required'),
      }),
    });

    let pipe: ZodValidationPipe<z.infer<typeof schema>>;

    beforeEach(() => {
      pipe = new ZodValidationPipe(schema);
    });

    it('should format error messages with field path', () => {
      const invalidData = {
        name: '',
        email: 'invalid',
        nested: { field: '' },
      };

      try {
        pipe.transform(invalidData);
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const response = (error as BadRequestException).getResponse() as Record<
          string,
          unknown
        >;

        expect(response.message).toBe('Validation failed');
        expect(response.errors).toBeDefined();

        const errors = response.errors as Record<string, string[]>;
        expect(errors['name']).toContain('Name is required');
        expect(errors['email']).toContain('Invalid email');
        expect(errors['nested.field']).toContain('Nested field required');
      }
    });

    it('should group multiple errors for same field', () => {
      const strictSchema = z.object({
        password: z
          .string()
          .min(8, 'Password must be at least 8 characters')
          .regex(/[A-Z]/, 'Password must contain uppercase letter'),
      });

      const strictPipe = new ZodValidationPipe(strictSchema);

      try {
        strictPipe.transform({ password: 'short' });
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const response = (error as BadRequestException).getResponse() as Record<
          string,
          unknown
        >;

        const errors = response.errors as Record<string, string[]>;
        expect(errors['password']).toHaveLength(2);
        expect(errors['password']).toContain(
          'Password must be at least 8 characters'
        );
        expect(errors['password']).toContain(
          'Password must contain uppercase letter'
        );
      }
    });

    it('should use _root for root-level errors', () => {
      const rootSchema = z.string().min(5, 'Too short');
      const rootPipe = new ZodValidationPipe(rootSchema);

      try {
        rootPipe.transform('ab');
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const response = (error as BadRequestException).getResponse() as Record<
          string,
          unknown
        >;

        const errors = response.errors as Record<string, string[]>;
        expect(errors['_root']).toContain('Too short');
      }
    });
  });

  describe('with array schema', () => {
    const arraySchema = z.array(z.string().min(1)).min(1, 'At least one item');
    let pipe: ZodValidationPipe<string[]>;

    beforeEach(() => {
      pipe = new ZodValidationPipe(arraySchema);
    });

    it('should pass valid array through', () => {
      const result = pipe.transform(['a', 'b', 'c']);
      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('should throw for empty array', () => {
      expect(() => pipe.transform([])).toThrow(BadRequestException);
    });

    it('should throw for array with invalid items', () => {
      expect(() => pipe.transform(['valid', ''])).toThrow(BadRequestException);
    });

    it('should include array index in error path', () => {
      try {
        pipe.transform(['valid', '', 'also valid']);
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const response = (error as BadRequestException).getResponse() as Record<
          string,
          unknown
        >;

        const errors = response.errors as Record<string, string[]>;
        expect(errors['1']).toBeDefined();
      }
    });
  });

  describe('with team-like schema', () => {
    const pokemonSchema = z.object({
      species: z.string().min(1, 'Species required'),
      level: z.number().min(1).max(100, 'Level must be 1-100'),
      moves: z.array(z.string()).min(1, 'At least one move required'),
    });

    const teamSchema = z.object({
      name: z.string().min(1, 'Team name required').max(100),
      generation: z.number().min(1).max(9),
      format: z.string().min(1),
      pokemon: z.array(pokemonSchema).min(1).max(6),
    });

    type Team = z.infer<typeof teamSchema>;
    let pipe: ZodValidationPipe<Team>;

    beforeEach(() => {
      pipe = new ZodValidationPipe(teamSchema);
    });

    it('should pass valid team through', () => {
      const validTeam = {
        name: 'My Team',
        generation: 9,
        format: 'ou',
        pokemon: [
          { species: 'Pikachu', level: 50, moves: ['Thunderbolt'] },
        ],
      };

      const result = pipe.transform(validTeam);
      expect(result).toEqual(validTeam);
    });

    it('should reject team with empty name', () => {
      const invalidTeam = {
        name: '',
        generation: 9,
        format: 'ou',
        pokemon: [{ species: 'Pikachu', level: 50, moves: ['Thunderbolt'] }],
      };

      try {
        pipe.transform(invalidTeam);
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const response = (error as BadRequestException).getResponse() as Record<
          string,
          unknown
        >;
        const errors = response.errors as Record<string, string[]>;
        expect(errors['name']).toContain('Team name required');
      }
    });

    it('should reject team with invalid pokemon', () => {
      const invalidTeam = {
        name: 'My Team',
        generation: 9,
        format: 'ou',
        pokemon: [{ species: '', level: 150, moves: [] }],
      };

      try {
        pipe.transform(invalidTeam);
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const response = (error as BadRequestException).getResponse() as Record<
          string,
          unknown
        >;
        const errors = response.errors as Record<string, string[]>;

        expect(errors['pokemon.0.species']).toContain('Species required');
        expect(errors['pokemon.0.level']).toBeDefined();
        expect(errors['pokemon.0.moves']).toContain('At least one move required');
      }
    });

    it('should reject team with no pokemon', () => {
      const invalidTeam = {
        name: 'My Team',
        generation: 9,
        format: 'ou',
        pokemon: [],
      };

      expect(() => pipe.transform(invalidTeam)).toThrow(BadRequestException);
    });
  });

  describe('type safety', () => {
    it('should return correctly typed data', () => {
      const schema = z.object({
        id: z.number(),
        name: z.string(),
      });

      const pipe = new ZodValidationPipe(schema);
      const result = pipe.transform({ id: 1, name: 'test' });

      // TypeScript should infer these types correctly
      expect(typeof result.id).toBe('number');
      expect(typeof result.name).toBe('string');
    });

    it('should transform coercible values', () => {
      const schema = z.object({
        count: z.coerce.number(),
      });

      const pipe = new ZodValidationPipe(schema);
      const result = pipe.transform({ count: '42' });

      expect(result.count).toBe(42);
    });
  });
});
