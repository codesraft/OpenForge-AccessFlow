// All server logging goes through here, so output stays intentional
// and is easy to silence or swap for a real logger later.
export const logger = {
  info: (message) => console.log(message),
  error: (message, error) => console.error(message, error),
};
