// Sibling downscalers -- ported as-is from the old app's js/app.js.
// downscaleImage keeps aspect ratio (recipe photos, Stage 3); downscaleImageSquare
// center-crops to a square first (avatars), so an off-center or non-square
// source photo doesn't distort into an oval.
export function downscaleImage(file, maxDim) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#17161c'; // transparent PNGs land on the app background, not black
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => resolve(null);
      img.src = reader.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

// focalX/focalY (0-1, default 0.5/0.5 = center) let the crop window follow
// wherever the subject actually is instead of always taking the dead
// center -- centers the square crop on that point, clamped so it never
// runs past the image's edges. focalX/focalY=0.5 reduces to exactly the
// old always-center behavior.
export function downscaleImageSquare(file, size, focalX = 0.5, focalY = 0.5) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const sx = Math.max(0, Math.min(img.width - side, focalX * img.width - side / 2));
        const sy = Math.max(0, Math.min(img.height - side, focalY * img.height - side / 2));
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => resolve(null);
      img.src = reader.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}
