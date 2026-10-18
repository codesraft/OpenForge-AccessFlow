import multer from 'multer';
import { AppError } from '../utils/app-error.js';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const AVATAR_FIELD = 'avatar';

// Multer is used to handle file uploads. It stores the uploaded files in memory and enforces a limit on the file size and number of files. The configuration specifies that only one file can be uploaded in the "avatar" field, and the maximum file size is 2 MB. If the upload exceeds these limits, Multer will throw an error, which is then converted into a standard AppError for consistent error handling.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_AVATAR_BYTES, files: 1 },
});

// Multer reports problems in its own format, so they are turned into our standard errors.
function toAppError(error) {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return new AppError(400, 'FILE_TOO_LARGE', 'The image must be 2 MB or smaller.');
  }
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return new AppError(400, 'INVALID_UPLOAD', `Send the image in the "${AVATAR_FIELD}" field.`);
  }
  return new AppError(400, 'INVALID_UPLOAD', 'The upload could not be read.');
}

export function receiveAvatar(req, res, next) {
  upload.single(AVATAR_FIELD)(req, res, (error) => {
    if (!error) return next();
    next(error instanceof multer.MulterError ? toAppError(error) : error);
  });
}