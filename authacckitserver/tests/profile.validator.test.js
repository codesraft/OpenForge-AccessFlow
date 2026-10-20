import { describe, it, expect } from 'vitest';
import { updateProfileSchema } from '../validators/profile.validator.js';

describe('updateProfileSchema avatarUrl', () => {
  it('accepts an https link and null', () => {
    expect(updateProfileSchema.safeParse({ avatarUrl: 'https://i.ibb.co/a.png' }).success).toBe(
      true,
    );
    expect(updateProfileSchema.safeParse({ avatarUrl: null }).success).toBe(true);
  });

  it.each(['http://i.ibb.co/a.png', 'javascript:alert(1)', 'data:text/html,hi', 'not a url'])(
    'rejects %s',
    (avatarUrl) => {
      expect(updateProfileSchema.safeParse({ avatarUrl }).success).toBe(false);
    },
  );
});
