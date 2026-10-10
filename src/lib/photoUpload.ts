// Vercel rejects function request bodies over 4.5 MB; keep files under 4 MB to leave room for multipart overhead.
export const MAX_PHOTO_UPLOAD_BYTES = 4 * 1024 * 1024;
export const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const MAX_DIMENSION = 3000;
const JPEG_QUALITY = 0.9;

/**
 * Browser-only. Downscales a photo that's too large to upload and re-encodes it as JPEG.
 * Files already under the limit are returned unchanged, as are GIFs (re-encoding would drop animation).
 */
export async function shrinkPhotoForUpload(file: File): Promise<File> {
  if (file.size <= MAX_PHOTO_UPLOAD_BYTES || file.type === "image/gif" || !file.type.startsWith("image/")) {
    return file;
  }

  const img = await loadImage(file);
  let maxDim = MAX_DIMENSION;
  for (let attempt = 0; attempt < 5; attempt++) {
    const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.round(img.naturalWidth * scale);
    const height = Math.round(img.naturalHeight * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not resize photo");
    // JPEG has no alpha channel; fill white so transparent PNG areas don't turn black.
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
    if (blob && blob.size <= MAX_PHOTO_UPLOAD_BYTES) {
      return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
    }
    maxDim = Math.round(maxDim * 0.75);
  }
  throw new Error("Photo is too large even after resizing");
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not read this image format")); };
    img.src = url;
  });
}
