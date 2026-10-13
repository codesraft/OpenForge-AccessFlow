import { AppError } from '../utils/AppError.js';

// This module provides middleware functions for handling errors in the application. The `notFoundHandler` function handles requests to routes that do not exist, while the `errorHandler` function handles errors thrown in route handlers or other middleware. Both functions send structured error responses to the client, and the `errorHandler` function also logs unexpected errors for debugging purposes.
function sendError(res, status, code, message) {
  res.status(status).json({ error: { code, message } });
}

// Runs when no route matched the request.
export function notFoundHandler(req, res) {
  sendError(res, 404, 'NOT_FOUND', 'The requested resource was not found.');
}

// Runs when an error is thrown in a route handler or middleware. It checks if the error is an instance of AppError and sends the appropriate response. If the error is not an AppError, it logs the error and sends a generic 500 Internal Server Error response.
export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return sendError(res, err.status, err.code, err.message);
  }

  // This is a special case for body-parser errors when the request body is not valid JSON. We want to return a 400 Bad Request instead of a 500 Internal Server Error.
  if (err.type === 'entity.parse.failed') {
    return sendError(res, 400, 'INVALID_JSON', 'The request body is not valid JSON.');
  }

  // For any other error, we log it and send a generic message to the client.
  console.error(err);
  sendError(res, 500, 'INTERNAL_ERROR', 'Something went wrong. Please try again.');
}