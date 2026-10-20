// The type is read from the file's first bytes because the filename and Content-Type are chosen by the client.
const SIGNATURES = [
  {
    type: 'image/jpeg',
    matches: (bytes) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  },
  {
    type: 'image/png',
    matches: (bytes) =>
      [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every(
        (byte, index) => bytes[index] === byte,
      ),
  },
  {
    type: 'image/webp',
    matches: (bytes) =>
      bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP',
  },
];

// Returns "image/jpeg", "image/png" or "image/webp", or null for anything else.
export function detectImageType(buffer) {
  return SIGNATURES.find(({ matches }) => matches(buffer))?.type ?? null;
}