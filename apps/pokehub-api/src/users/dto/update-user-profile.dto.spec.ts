import { validate } from 'class-validator';
import { UpdateUserProfileDTO } from './update-user-profile.dto';

describe('UpdateUserProfileDTO', () => {
  const createDTO = (data: Partial<UpdateUserProfileDTO>): UpdateUserProfileDTO => {
    const dto = new UpdateUserProfileDTO();
    Object.assign(dto, data);
    return dto;
  };

  describe('username validation', () => {
    it('should pass with valid username', async () => {
      const dto = createDTO({ username: 'validuser' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass with username at minimum length (3 chars)', async () => {
      const dto = createDTO({ username: 'abc' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass with username at maximum length (20 chars)', async () => {
      const dto = createDTO({ username: 'a'.repeat(20) });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail with username too short (less than 3 chars)', async () => {
      const dto = createDTO({ username: 'ab' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('username');
      expect(errors[0].constraints).toHaveProperty('isLength');
    });

    it('should fail with username too long (more than 20 chars)', async () => {
      const dto = createDTO({ username: 'a'.repeat(21) });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('username');
      expect(errors[0].constraints).toHaveProperty('isLength');
    });

    it('should fail when username is not a string', async () => {
      const dto = createDTO({ username: 123 as unknown as string });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('username');
    });

    it('should fail when username is missing', async () => {
      const dto = createDTO({});
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('username');
    });
  });

  describe('avatar validation', () => {
    it('should pass without avatar (optional field)', async () => {
      const dto = createDTO({ username: 'testuser' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass with valid png avatar filename', async () => {
      const dto = createDTO({ username: 'testuser', avatar: 'avatar.png' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass with valid jpg avatar filename', async () => {
      const dto = createDTO({ username: 'testuser', avatar: 'photo.jpg' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass with valid jpeg avatar filename', async () => {
      const dto = createDTO({ username: 'testuser', avatar: 'image.jpeg' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass with valid gif avatar filename', async () => {
      const dto = createDTO({ username: 'testuser', avatar: 'animated.gif' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass with underscores, dots, and hyphens in filename', async () => {
      const dto = createDTO({ username: 'testuser', avatar: 'my_avatar-v2.0.png' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail with invalid extension', async () => {
      const dto = createDTO({ username: 'testuser', avatar: 'avatar.bmp' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('avatar');
      expect(errors[0].constraints).toHaveProperty('matches');
    });

    it('should fail with no extension', async () => {
      const dto = createDTO({ username: 'testuser', avatar: 'avatar' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('avatar');
    });

    it('should fail with invalid characters in filename', async () => {
      const dto = createDTO({ username: 'testuser', avatar: 'avatar@#$.png' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('avatar');
    });

    it('should fail with filename too long (more than 255 chars)', async () => {
      const dto = createDTO({
        username: 'testuser',
        avatar: 'a'.repeat(252) + '.png',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('avatar');
      expect(errors[0].constraints).toHaveProperty('isLength');
    });
  });

  describe('combined validation', () => {
    it('should pass with valid username and avatar', async () => {
      const dto = createDTO({
        username: 'validuser123',
        avatar: 'profile-pic.jpg',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail with both invalid username and avatar', async () => {
      const dto = createDTO({
        username: 'ab',
        avatar: 'invalid.bmp',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(2);
      const propertyNames = errors.map((e) => e.property);
      expect(propertyNames).toContain('username');
      expect(propertyNames).toContain('avatar');
    });
  });
});
