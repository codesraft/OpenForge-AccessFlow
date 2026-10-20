const MAX_SIDE_PX = 512;
const OUTPUT_TYPE = 'image/jpeg';
const OUTPUT_QUALITY = 0.85;
const BACKGROUND_COLOR = '#ffffff';

// Keeps the image within a square of MAX_SIDE_PX, preserving its aspect ratio. Returns the new width and height.
export function fitWithin(width, height, maxSide = MAX_SIDE_PX) {
  const scale = Math.min(1, maxSide / Math.max(width, height));

  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

// Shrinks the image before upload to save bandwidth. The server still checks type and size.
export async function resizeImage(file) {
  const bitmap = await createImageBitmap(file);
  const { width, height } = fitWithin(bitmap.width, bitmap.height);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  // JPEG has no transparency, so a transparent PNG would turn black without a background.
  const context = canvas.getContext('2d');
  context.fillStyle = BACKGROUND_COLOR;
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('The image could not be processed.'))),
      OUTPUT_TYPE,
      OUTPUT_QUALITY,
    );
  });
}