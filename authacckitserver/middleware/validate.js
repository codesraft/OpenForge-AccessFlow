import { AppError } from '../utils/app-error.js';

// This function converts Zod validation issues into a simple object mapping field names to error messages. It is used to provide detailed feedback to the client about which fields are invalid.
function toFieldMessages(issues) {
  const fields = {};

  for (const issue of issues) {
    const field = issue.path.join('.') || 'body';
    fields[field] ??= issue.message;
  }
  return fields;
}

// This middleware validates the request body against a Zod schema. If the body is invalid, it throws an AppError with a 400 status and a list of field errors. If the body is valid, it replaces req.body with the parsed data and calls next().
export function validateBody(schema) {
  return function validate(req, res, next) {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'Some of the information you sent is not valid.',
        toFieldMessages(result.error.issues),
      );
    }

    req.body = result.data;
    next();
  };
}