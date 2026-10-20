import { describe, it, expect } from 'vitest';
import { findMissingVars } from '../utils/env.js';

describe('findMissingVars', () => {
  it('lists the variables that are not set', () => {
    const source = { DATABASE_URL: 'mongodb://x', SMTP_URL: '' };

    expect(findMissingVars(['DATABASE_URL', 'SMTP_URL', 'EMAIL_FROM'], source)).toEqual([
      'SMTP_URL',
      'EMAIL_FROM',
    ]);
  });

  it('returns nothing when every variable is set', () => {
    expect(findMissingVars(['DATABASE_URL'], { DATABASE_URL: 'mongodb://x' })).toEqual([]);
  });
});
