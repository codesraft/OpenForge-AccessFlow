import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { uploadAvatarImage } from '../services/avatar.service.js';
import { AppError } from '../utils/app-error.js';
import { logger } from '../utils/logger.js';
import { env } from '../utils/env.js';

vi.mock('../utils/env.js', () => import('./helpers/test-env.js'));

const image = Buffer.from('fake image bytes');

function stubImgbb(body, { ok = true, status = 200 } = {}) {
  const fetchMock = vi.fn().mockResolvedValue({ ok, status, json: async () => body });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

beforeEach(() => {
  vi.spyOn(logger, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('uploadAvatarImage', () => {
  it('sends the image to imgBB and returns its link', async () => {
    const fetchMock = stubImgbb({
      success: true,
      data: { url: 'https://i.ibb.co/abc/avatar.png' },
    });

    const url = await uploadAvatarImage(image);

    const [requestUrl, options] = fetchMock.mock.calls[0];
    expect(url).toBe('https://i.ibb.co/abc/avatar.png');
    expect(requestUrl).toContain('https://api.imgbb.com/1/upload');
    expect(requestUrl).toContain('key=test-imgbb-key');
    expect(options.body.get('image')).toBe(image.toString('base64'));
  });

  it('returns a friendly error when imgBB fails, and keeps the API key out of the logs', async () => {
    stubImgbb({ success: false }, { ok: false, status: 400 });

    const attempt = uploadAvatarImage(image);

    await expect(attempt).rejects.toBeInstanceOf(AppError);
    await expect(attempt).rejects.toThrow('We could not upload your image. Please try again.');
    expect(JSON.stringify(logger.error.mock.calls)).not.toContain('test-imgbb-key');
  });

  it('returns the same friendly error when the network fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('connect ETIMEDOUT')));

    await expect(uploadAvatarImage(image)).rejects.toThrow('We could not upload your image');
  });

  it('fails safely when no API key is configured', async () => {
    const fetchMock = stubImgbb({});
    const originalKey = env.imgbbApiKey;
    env.imgbbApiKey = undefined;

    await expect(uploadAvatarImage(image)).rejects.toThrow('We could not upload your image');
    expect(fetchMock).not.toHaveBeenCalled();

    env.imgbbApiKey = originalKey;
  });
});
