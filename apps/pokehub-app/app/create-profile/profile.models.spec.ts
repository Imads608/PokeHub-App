import type { ProfileFormData } from './profile.models';
import { profileSchema } from './profile.models';

describe('profileSchema', () => {
  describe('username validation', () => {
    it('should pass with valid username', () => {
      const data = { username: 'validuser' };
      const result = profileSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should pass with username at minimum length (3 chars)', () => {
      const data = { username: 'abc' };
      const result = profileSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should pass with username at maximum length (20 chars)', () => {
      const data = { username: 'a'.repeat(20) };
      const result = profileSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should fail with username too short (less than 3 chars)', () => {
      const data = { username: 'ab' };
      const result = profileSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Username must be at least 3 characters'
        );
      }
    });

    it('should fail with username too long (more than 20 chars)', () => {
      const data = { username: 'a'.repeat(21) };
      const result = profileSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Username must be at most 20 characters'
        );
      }
    });

    it('should pass with alphanumeric username', () => {
      const data = { username: 'user123' };
      const result = profileSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should pass with underscores in username', () => {
      const data = { username: 'user_name' };
      const result = profileSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should fail with spaces in username', () => {
      const data = { username: 'user name' };
      const result = profileSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Username can only contain letters, numbers, and underscores'
        );
      }
    });

    it('should fail with special characters in username', () => {
      const data = { username: 'user@name' };
      const result = profileSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should fail with hyphens in username', () => {
      const data = { username: 'user-name' };
      const result = profileSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should fail with empty username', () => {
      const data = { username: '' };
      const result = profileSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should fail when username is missing', () => {
      const data = {};
      const result = profileSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('avatar validation', () => {
    it('should pass without avatar (optional field)', () => {
      const data = { username: 'testuser' };
      const result = profileSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.avatar).toBeUndefined();
      }
    });

    it('should pass with valid avatar string', () => {
      const data = { username: 'testuser', avatar: 'avatar.png' };
      const result = profileSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should pass with empty avatar string', () => {
      const data = { username: 'testuser', avatar: '' };
      const result = profileSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('ProfileFormData type', () => {
    it('should correctly infer types from schema', () => {
      const validData: ProfileFormData = {
        username: 'testuser',
        avatar: 'optional-avatar.png',
      };

      const result = profileSchema.parse(validData);
      expect(result.username).toBe('testuser');
      expect(result.avatar).toBe('optional-avatar.png');
    });

    it('should allow avatar to be undefined', () => {
      const validData: ProfileFormData = {
        username: 'testuser',
      };

      const result = profileSchema.parse(validData);
      expect(result.username).toBe('testuser');
      expect(result.avatar).toBeUndefined();
    });
  });
});
