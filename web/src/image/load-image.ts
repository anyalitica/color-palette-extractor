import { pixelsFromRgba } from './pixels';

export interface LoadedImage {
  name: string;
  previewUrl: string;
  width: number;
  height: number;
  pixels: Uint8Array;
}

const MAX_DIMENSION = 800;
const MAX_FILE_SIZE = 25 * 1024 * 1024;

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
  if (file.size > MAX_FILE_SIZE) throw new Error('Choose an image smaller than 25 MB.');
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  return bitmapToLoadedImage(bitmap, file.name);
}

export async function loadImageFromUrl(value: string): Promise<LoadedImage> {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('Enter a complete image link beginning with http:// or https://.');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Enter a complete image link beginning with http:// or https://.');
  }

  try {
    const response = await fetch(url, { mode: 'cors', credentials: 'omit', referrerPolicy: 'no-referrer' });
    if (!response.ok) throw new Error(`The image host returned ${response.status}.`);
    const declaredSize = Number(response.headers.get('content-length'));
    if (declaredSize > MAX_FILE_SIZE) throw new Error('Choose an image smaller than 25 MB.');
    const blob = await response.blob();
    if (blob.size > MAX_FILE_SIZE) throw new Error('Choose an image smaller than 25 MB.');
    if (blob.type && !blob.type.startsWith('image/')) throw new Error('That link did not return an image.');
    const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });
    const pathName = decodeURIComponent(url.pathname.split('/').filter(Boolean).at(-1) ?? '');
    return bitmapToLoadedImage(bitmap, pathName || `Image from ${url.hostname}`);
  } catch (error) {
    if (error instanceof Error && (
      error.message.includes('smaller than') || error.message.includes('did not return') || error.message.includes('returned')
    )) throw error;
    throw new Error('This image host does not allow browser access. Download the image and choose the file instead.');
  }
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
