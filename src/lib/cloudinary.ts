const CLOUD_NAME = 'dtzaatlkt';
const UPLOAD_PRESET = 'Schoolreserve';

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const MAX_FILE_SIZE_MB = 5;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export interface CloudinaryResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
}

/** Returns an error string if invalid, null if valid. */
export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return 'Only JPG, JPEG, PNG, and WEBP images are accepted.';
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `Image must be smaller than ${MAX_FILE_SIZE_MB}MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB.`;
  }
  return null;
}

/** Uploads a file to Cloudinary using the unsigned preset and returns the result. */
export async function uploadToCloudinary(file: File): Promise<CloudinaryResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData },
  );

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json?.error?.message ?? `Upload failed (HTTP ${res.status}).`);
  }

  return res.json() as Promise<CloudinaryResult>;
}

/**
 * Returns an optimized Cloudinary URL with width, quality, and auto format.
 * Falls back to the original URL if it's not a Cloudinary URL.
 */
export function optimizeImageUrl(url: string, width = 400, quality = 80): string {
  if (!url || !url.includes('cloudinary.com')) return url;
  return url.replace('/upload/', `/upload/w_${width},q_${quality},f_auto/`);
}
