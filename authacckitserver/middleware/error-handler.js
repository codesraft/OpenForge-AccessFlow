import { AppError } from '../utils/app-error.js';
import { logger } from '../utils/logger.js';

// Every error leaves the API in the same shape, so the client only has one format to handle.
function sendError(res, status, code, message, details) {
  res.status(status).json({ error: { code, message, ...(details && { details }) } });
}

export function notFoundHandler(req, res) {
  sendError(res, 404, 'NOT_FOUND', 'The requested resource was not found.');
}

// The error handler is the last middleware, so it only sees errors that were not handled by the routes above. It logs unexpected errors and sends a generic message to the client, so internal details are never exposed.
export function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    return sendError(res, err.status, err.code, err.message, err.details);
  }

  // express.json() throws this for a broken body, which is the client's mistake, not ours.
  if (err.type === 'entity.parse.failed') {
    return sendError(res, 400, 'INVALID_JSON', 'The request body is not valid JSON.');
  }

  // Unexpected errors may contain internal details, so they go to the log, never to the client.
  logger.error('Unhandled error:', err);
  sendError(res, 500, 'INTERNAL_ERROR', 'Something went wrong. Please try again.');
}