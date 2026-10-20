const BROWSERS = [
  ['Edg/', 'Edge'],
  ['OPR/', 'Opera'],
  ['Firefox/', 'Firefox'],
  ['Chrome/', 'Chrome'],
  ['Safari/', 'Safari'],
];

const SYSTEMS = [
  ['Windows', 'Windows'],
  ['Android', 'Android'],
  ['iPhone', 'iOS'],
  ['iPad', 'iPadOS'],
  ['Mac OS X', 'macOS'],
  ['Linux', 'Linux'],
];

function findName(userAgent, candidates, fallback) {
  const match = candidates.find(([marker]) => userAgent.includes(marker));

  return match ? match[1] : fallback;
}

// Turns a User-Agent into something a person recognises, such as "Chrome on Windows".
export function describeDevice(userAgent) {
  if (!userAgent) return 'Unknown device';

  const browser = findName(userAgent, BROWSERS, 'Unknown browser');
  const system = findName(userAgent, SYSTEMS, 'unknown system');

  return `${browser} on ${system}`;
}