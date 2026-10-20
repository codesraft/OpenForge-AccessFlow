import { AppError } from '../utils/app-error.js';

// Keeps one message per field, so a form can show each error next to its input.
function toFieldMessages(issues) {
  const fields = {};

  for (const issue of issues) {
    const field = issue.path.join('.') || 'body';
    fields[field] ??= issue.message;
  }
  return fields;
}

// Replaces req.body with the parsed result, so handlers only see fields the schema allows.
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