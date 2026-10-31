import { pixelsFromRgba } from './pixels';

export interface LoadedImage {
  name: string;
  previewUrl: string;
  width: number;
  height: number;
  pixels: Uint8Array;
}

const MAX_DIMENSION = 800;

function imageDataToBytes(data: Uint8ClampedArray): Uint8Array {
  const pixels = pixelsFromRgba(data);
  const bytes = new Uint8Array(pixels.length * 3);
  pixels.forEach((pixel, index) => {
    const offset = index * 3;
    bytes[offset] = pixel.r;
    bytes[offset + 1] = pixel.g;
    bytes[offset + 2] = pixel.b;
  });
  return bytes;
}

async function bitmapToLoadedImage(bitmap: ImageBitmap, name: string): Promise<LoadedImage> {
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Your browser could not prepare the image canvas.');
  context.clearRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  const imageData = context.getImageData(0, 0, width, height);
  bitmap.close();
  return {
    name,
    previewUrl: canvas.toDataURL('image/webp', 0.88),
    width,
    height,
    pixels: imageDataToBytes(imageData.data),
  };
}

export async function loadImage(file: File): Promise<LoadedImage> {
  if (!file.type.startsWith('image/')) throw new Error('Choose a PNG, JPEG, WebP, GIF, BMP, or other browser-supported image.');
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  return bitmapToLoadedImage(bitmap, file.name);
}

export async function createSampleImage(): Promise<LoadedImage> {
  const canvas = document.createElement('canvas');
  canvas.width = 960;
  canvas.height = 600;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Your browser could not create the sample image.');
  const gradient = context.createLinearGradient(0, 0, 960, 600);
  gradient.addColorStop(0, '#ffcb45');
  gradient.addColorStop(0.46, '#ff5c35');
  gradient.addColorStop(1, '#6d4aff');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 960, 600);
  context.fillStyle = '#173f35';
  context.beginPath();
  context.arc(720, 185, 150, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#f8eee2';
  context.fillRect(90, 360, 400, 125);
  context.fillStyle = '#219c76';
  context.beginPath();
  context.moveTo(170, 110);
  context.lineTo(390, 260);
  context.lineTo(110, 290);
  context.closePath();
  context.fill();
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error('Could not create sample image.')), 'image/png'));
  return loadImage(new File([blob], 'sample-artwork.png', { type: 'image/png' }));
}
