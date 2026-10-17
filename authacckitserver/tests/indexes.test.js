import { describe, it, expect, vi } from 'vitest';
import { ensureIndexes } from '../db/indexes.js';

describe('ensureIndexes', () => {
  it('creates the indexes the project relies on', async () => {
    const createIndex = vi.fn().mockResolvedValue('ok');
    const db = { collection: vi.fn(() => ({ createIndex })) };

    await ensureIndexes(db);

    expect(db.collection).toHaveBeenCalledWith('session');
    expect(db.collection).toHaveBeenCalledWith('account');
    expect(db.collection).toHaveBeenCalledWith('profiles');
    expect(createIndex).toHaveBeenCalledWith({ userId: 1 }, { unique: true });
    expect(createIndex).toHaveBeenCalledWith({ token: 1 }, { unique: true });
    expect(createIndex).toHaveBeenCalledTimes(4);
  });
});