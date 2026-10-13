// an error class that we can throw in our code to represent application-specific errors. It extends the built-in Error class and adds a status code and an error code for more structured error handling.
export class AppError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
  }
}