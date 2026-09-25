import { FooterTemplate, ImageOverride, ProcessingSettings } from "./types";

export async function renderImageWithFooter(
  sourceImage: HTMLImageElement | ImageBitmap,
  footerImage: HTMLImageElement | ImageBitmap,
  templateSettings: FooterTemplate,
  overrideSettings?: ImageOverride,
  settings: ProcessingSettings = { outputFormat: "image/jpeg", quality: 0.9, filenameSuffix: "_footer" }
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2d context");

  const sWidth = sourceImage.width;
  const sHeight = sourceImage.height;

  // Calculate footer dimensions
  // Default: width matches image width
  let fWidth = sWidth;
  let fHeight = fWidth / templateSettings.aspectRatio;

  if (templateSettings.defaultHeightMode === "percentage") {
    fHeight = sHeight * (templateSettings.defaultHeightValue / 100);
    fWidth = fHeight * templateSettings.aspectRatio;
  } else if (templateSettings.defaultHeightMode === "fixed") {
    fHeight = templateSettings.defaultHeightValue;
    fWidth = fHeight * templateSettings.aspectRatio;
  }

  // Apply Overrides
  if (overrideSettings?.footerScale) {
    fWidth *= overrideSettings.footerScale;
    fHeight *= overrideSettings.footerScale;
  }
  if (overrideSettings?.footerHeight) {
    fHeight = overrideSettings.footerHeight;
    fWidth = fHeight * templateSettings.aspectRatio;
  }

  const isOverlay = templateSettings.position.startsWith("overlay");
  const isTop = templateSettings.position.includes("top");

  // Final canvas size
  canvas.width = sWidth;
  canvas.height = isOverlay ? sHeight : sHeight + fHeight;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Only draw white background for JPEG to avoid black transparent areas
  if (settings.outputFormat === "image/jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Draw Source Image
  const imgY = isTop && !isOverlay ? fHeight : 0;
  ctx.drawImage(sourceImage, 0, imgY, sWidth, sHeight);

  // Draw Footer
  let footerX = (sWidth - fWidth) / 2; // Center horizontally
  let footerY = isTop ? 0 : sHeight;
  
  if (isOverlay && !isTop) {
    footerY = sHeight - fHeight;
  }

  if (overrideSettings?.footerX !== undefined) footerX += overrideSettings.footerX;
  if (overrideSettings?.footerY !== undefined) footerY += overrideSettings.footerY;

  ctx.globalAlpha = overrideSettings?.footerOpacity ?? templateSettings.opacity ?? 1;
  ctx.drawImage(footerImage, footerX, footerY, fWidth, fHeight);
  ctx.globalAlpha = 1.0; // Reset

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to create blob"));
      },
      settings.outputFormat,
      settings.quality
    );
  });
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (src.startsWith("http://") || src.startsWith("https://")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error("Failed to load image"));
    img.src = src;
  });
}
