import { env } from '../utils/env.js';
import { AppError } from '../utils/app-error.js';
import { logger } from '../utils/logger.js';

const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';
const UPLOAD_TIMEOUT_MS = 10_000;
const FRIENDLY_ERROR = 'We could not upload your image. Please try again.';

// Uploads the avatar image to imgBB and returns the URL of the uploaded image. It takes a buffer containing the image data, converts it to a base64 string, and sends it to the imgBB API using a POST request. The function handles errors by logging them and throwing an AppError with a user-friendly message. If the upload is successful, it returns the URL of the uploaded image.
export async function uploadAvatarImage(imageBuffer) {
  try {
    if (!env.imgbbApiKey) {
      throw new Error('IMGBB_API_KEY is not set');
    }

    const form = new FormData();
    form.append('image', imageBuffer.toString('base64'));

    const response = await fetch(`${IMGBB_UPLOAD_URL}?key=${encodeURIComponent(env.imgbbApiKey)}`, {
      method: 'POST',
      body: form,
      // Without a limit, a slow imgBB would keep the user waiting indefinitely.
      signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(`imgBB answered with status ${response.status}`);
    }
    return result.data.url;
  } catch (error) {
    // Only the message is logged: the request URL contains the API key.
    logger.error('Could not upload the avatar to imgBB:', error.message);
    throw new AppError(500, 'AVATAR_UPLOAD_FAILED', FRIENDLY_ERROR);
  }
}