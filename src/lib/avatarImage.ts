// Avatar uploads get stored as a data URL directly in localStorage (same
// key as the rest of the user profile), which has a ~5-10MB per-origin
// quota shared with every other piece of app data. An unresized phone
// photo (often 5-15MB) blown up to base64 can blow through that quota -
// the write then fails silently (writeJSON only logs and swallows the
// error), so the avatar appears to change for the session but reverts on
// next launch, or worse, starves quota needed for tasks/notes/habits.
// Downscaling through a canvas keeps every avatar small regardless of
// what was uploaded.
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // sanity cap on the raw file before decoding
const MAX_DIMENSION = 256;
const JPEG_QUALITY = 0.85;

export class AvatarImageError extends Error {}

export function resizeImageToDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    return Promise.reject(new AvatarImageError("not_an_image"));
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return Promise.reject(new AvatarImageError("too_large"));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new AvatarImageError("read_failed"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new AvatarImageError("decode_failed"));
      img.onload = () => {
        const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new AvatarImageError("canvas_unsupported"));

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
