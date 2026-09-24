// @ts-nocheck
/* global cv */

/**
 * Ensures OpenCV is loaded.
 */
export const checkOpenCV = (): boolean => {
  return typeof window !== 'undefined' && typeof window.cv !== 'undefined';
};

/**
 * Loads a File into an HTMLImageElement.
 */
export const loadImage = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
};

/**
 * Finds the largest contour that looks like a document.
 * Returns { points: Array<{x, y}>, width, height } or null if not found.
 */
export const detectDocumentEdges = (imgElement: HTMLImageElement) => {
  if (!checkOpenCV()) throw new Error('OpenCV is not loaded');

  const src = window.cv.imread(imgElement);
  
  // Create copies for processing
  const gray = new window.cv.Mat();
  const blur = new window.cv.Mat();
  const edges = new window.cv.Mat();
  
  // Convert to grayscale, blur, and find edges
  window.cv.cvtColor(src, gray, window.cv.COLOR_RGBA2GRAY);
  window.cv.GaussianBlur(gray, blur, new window.cv.Size(5, 5), 0, 0, window.cv.BORDER_DEFAULT);
  window.cv.Canny(blur, edges, 75, 200);
  
  // Find contours
  const contours = new window.cv.MatVector();
  const hierarchy = new window.cv.Mat();
  window.cv.findContours(edges, contours, hierarchy, window.cv.RETR_EXTERNAL, window.cv.CHAIN_APPROX_SIMPLE);
  
  let maxArea = 0;
  let maxContourIndex = -1;
  let documentPoints = null;

  // Search for the largest quadrilateral contour
  for (let i = 0; i < contours.size(); ++i) {
    const contour = contours.get(i);
    const area = window.cv.contourArea(contour);
    
    // Minimum area threshold (e.g. 10% of image size) to avoid noise
    if (area > (imgElement.width * imgElement.height * 0.1)) {
      const perimeter = window.cv.arcLength(contour, true);
      const approx = new window.cv.Mat();
      window.cv.approxPolyDP(contour, approx, 0.02 * perimeter, true);
      
      if (approx.rows === 4 && area > maxArea) {
        maxArea = area;
        maxContourIndex = i;
        
        // Extract the 4 points
        const points = [];
        for (let j = 0; j < 4; j++) {
          points.push({
            x: approx.data32S[j * 2],
            y: approx.data32S[j * 2 + 1]
          });
        }
        
        // Sort points: top-left, top-right, bottom-right, bottom-left
        // First sort by Y to separate top and bottom
        points.sort((a, b) => a.y - b.y);
        
        const top = points.slice(0, 2).sort((a, b) => a.x - b.x);
        const bottom = points.slice(2, 4).sort((a, b) => b.x - a.x);
        
        documentPoints = [top[0], top[1], bottom[0], bottom[1]]; // TL, TR, BR, BL
      }
      approx.delete();
    }
  }

  // Cleanup
  src.delete(); gray.delete(); blur.delete(); edges.delete();
  contours.delete(); hierarchy.delete();

  if (documentPoints) {
    return {
      points: documentPoints,
      width: imgElement.width,
      height: imgElement.height
    };
  }
  return null;
};

/**
 * Given an image and 4 corners, warps it to a flattened rectangle.
 */
export const warpPerspective = (imgElement: HTMLImageElement, points: Array<{x: number, y: number}>): HTMLCanvasElement => {
  if (!checkOpenCV()) throw new Error('OpenCV is not loaded');

  const src = window.cv.imread(imgElement);
  
  // Calculate width and height of the new image
  const tl = points[0];
  const tr = points[1];
  const br = points[2];
  const bl = points[3];
  
  const widthA = Math.sqrt(Math.pow(br.x - bl.x, 2) + Math.pow(br.y - bl.y, 2));
  const widthB = Math.sqrt(Math.pow(tr.x - tl.x, 2) + Math.pow(tr.y - tl.y, 2));
  const maxWidth = Math.max(Math.round(widthA), Math.round(widthB));
  
  const heightA = Math.sqrt(Math.pow(tr.x - br.x, 2) + Math.pow(tr.y - br.y, 2));
  const heightB = Math.sqrt(Math.pow(tl.x - bl.x, 2) + Math.pow(tl.y - bl.y, 2));
  const maxHeight = Math.max(Math.round(heightA), Math.round(heightB));

  const dst = new window.cv.Mat();
  const dsize = new window.cv.Size(maxWidth, maxHeight);
  
  // Source points
  const srcTri = window.cv.matFromArray(4, 1, window.cv.CV_32FC2, [
    tl.x, tl.y,
    tr.x, tr.y,
    br.x, br.y,
    bl.x, bl.y
  ]);
  
  // Destination points
  const dstTri = window.cv.matFromArray(4, 1, window.cv.CV_32FC2, [
    0, 0,
    maxWidth - 1, 0,
    maxWidth - 1, maxHeight - 1,
    0, maxHeight - 1
  ]);
  
  // Warp
  const M = window.cv.getPerspectiveTransform(srcTri, dstTri);
  window.cv.warpPerspective(src, dst, M, dsize, window.cv.INTER_LINEAR, window.cv.BORDER_CONSTANT, new window.cv.Scalar());
  
  // Draw to canvas
  const canvas = document.createElement('canvas');
  window.cv.imshow(canvas, dst);
  
  // Cleanup
  src.delete(); dst.delete(); M.delete(); srcTri.delete(); dstTri.delete();
  
  return canvas;
};

/**
 * Resizes canvas to A4 dimensions at 300 DPI (2480 x 3508)
 * and applies basic auto-contrast.
 */
export const processToA4 = (sourceCanvas: HTMLCanvasElement | HTMLImageElement): HTMLCanvasElement => {
  const A4_WIDTH = 2480;
  const A4_HEIGHT = 3508;
  
  const outCanvas = document.createElement('canvas');
  outCanvas.width = A4_WIDTH;
  outCanvas.height = A4_HEIGHT;
  const ctx = outCanvas.getContext('2d');
  
  if (!ctx) return sourceCanvas as HTMLCanvasElement;
  
  // Draw scaled
  ctx.drawImage(sourceCanvas, 0, 0, A4_WIDTH, A4_HEIGHT);
  
  // Apply auto-contrast filter (simple normalization)
  const imageData = ctx.getImageData(0, 0, A4_WIDTH, A4_HEIGHT);
  const data = imageData.data;
  
  let min = 255;
  let max = 0;
  
  // Find min/max luminance
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
    if (lum < min) min = lum;
    if (lum > max) max = lum;
  }
  
  // Normalize
  if (max > min) {
    const scale = 255 / (max - min);
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, (data[i] - min) * scale));
      data[i+1] = Math.min(255, Math.max(0, (data[i+1] - min) * scale));
      data[i+2] = Math.min(255, Math.max(0, (data[i+2] - min) * scale));
    }
    ctx.putImageData(imageData, 0, 0);
  }
  
  return outCanvas;
};

/**
 * Converts canvas to Blob
 */
export const canvasToBlob = (canvas: HTMLCanvasElement, mimeType = 'image/jpeg', quality = 0.9): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas to Blob failed'));
    }, mimeType, quality);
  });
};

/**
 * Full automatic pipeline
 */
export const autoProcessDocument = async (file: File): Promise<{ blob: Blob, wasAutoCropped: boolean }> => {
  const img = await loadImage(file);
  let processedCanvas: HTMLCanvasElement;
  let wasAutoCropped = false;
  
  if (checkOpenCV()) {
    try {
      const edges = detectDocumentEdges(img);
      if (edges) {
        processedCanvas = warpPerspective(img, edges.points);
        wasAutoCropped = true;
      } else {
        // Fallback: draw original to canvas
        processedCanvas = document.createElement('canvas');
        processedCanvas.width = img.width;
        processedCanvas.height = img.height;
        const ctx = processedCanvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
      }
    } catch (err) {
      console.warn("OpenCV processing failed, falling back to original", err);
      processedCanvas = document.createElement('canvas');
      processedCanvas.width = img.width;
      processedCanvas.height = img.height;
      const ctx = processedCanvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
    }
  } else {
    processedCanvas = document.createElement('canvas');
    processedCanvas.width = img.width;
    processedCanvas.height = img.height;
    const ctx = processedCanvas.getContext('2d');
    ctx?.drawImage(img, 0, 0);
  }

  const finalCanvas = processToA4(processedCanvas);
  const blob = await canvasToBlob(finalCanvas);
  
  return { blob, wasAutoCropped };
};
