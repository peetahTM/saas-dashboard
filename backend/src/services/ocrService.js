import Tesseract from 'tesseract.js';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

/**
 * OCR Service for processing receipt images using Tesseract.js
 */
class OcrService {
  constructor() {
    this.worker = null;
  }

  /**
   * Preprocess image for better OCR accuracy
   * - Convert to grayscale
   * - Increase contrast
   * - Resize if too large
   * @param {Buffer} imageBuffer - Raw image buffer
   * @returns {Promise<{buffer: Buffer, dimensions: {width: number, height: number}}>} Processed image buffer and dimensions
   */
  async preprocessImage(imageBuffer) {
    try {
      const image = sharp(imageBuffer);
      const metadata = await image.metadata();

      let processed = image
        .grayscale()
        .normalize()
        .sharpen();

      // Resize if image is very large (max 2000px on longest side)
      const maxDimension = 2000;
      let finalWidth = metadata.width;
      let finalHeight = metadata.height;

      if (metadata.width > maxDimension || metadata.height > maxDimension) {
        processed = processed.resize(maxDimension, maxDimension, {
          fit: 'inside',
          withoutEnlargement: true,
        });

        // Calculate the actual dimensions after resize
        const scale = Math.min(maxDimension / metadata.width, maxDimension / metadata.height);
        finalWidth = Math.round(metadata.width * scale);
        finalHeight = Math.round(metadata.height * scale);
      }

      const buffer = await processed.png().toBuffer();

      return {
        buffer,
        dimensions: {
          width: finalWidth,
          height: finalHeight,
        },
      };
    } catch (error) {
      console.error('[OCR] Image preprocessing error:', error.message);
      throw new Error('Failed to preprocess image');
    }
  }

  /**
   * Validate bounding box coordinates
   * @param {Object} bbox - Bounding box object
   * @param {number} maxWidth - Maximum valid width
   * @param {number} maxHeight - Maximum valid height
   * @returns {Object|null} Validated bbox or null if invalid
   */
  validateBbox(bbox, maxWidth, maxHeight) {
    if (!bbox || typeof bbox.x0 !== 'number' || typeof bbox.y0 !== 'number' ||
        typeof bbox.x1 !== 'number' || typeof bbox.y1 !== 'number') {
      return null;
    }

    // Ensure coordinates are within bounds
    const x0 = Math.max(0, Math.min(bbox.x0, maxWidth));
    const y0 = Math.max(0, Math.min(bbox.y0, maxHeight));
    const x1 = Math.max(0, Math.min(bbox.x1, maxWidth));
    const y1 = Math.max(0, Math.min(bbox.y1, maxHeight));

    // Ensure x1 > x0 and y1 > y0
    if (x1 <= x0 || y1 <= y0) {
      return null;
    }

    return { x0, y0, x1, y1 };
  }

  /**
   * Extract text from an image using Tesseract OCR
   * @param {Buffer} imageBuffer - Image buffer to process
   * @returns {Promise<{text: string, confidence: number, lines: Array, dimensions: {width: number, height: number}}>} Extracted text, confidence, line data with bboxes, and processed image dimensions
   */
  async extractText(imageBuffer) {
    try {
      // Preprocess the image
      const { buffer: processedImage, dimensions } = await this.preprocessImage(imageBuffer);

      // Run OCR with English and Swedish language support
      const result = await Tesseract.recognize(processedImage, 'eng+swe', {
        logger: (info) => {
          if (info.status === 'recognizing text') {
            console.log(`[OCR] Progress: ${Math.round(info.progress * 100)}%`);
          }
        },
      });

      // Extract line-level data with bounding boxes (validated)
      const lines = result.data.lines?.map((line) => ({
        text: line.text,
        confidence: line.confidence,
        bbox: this.validateBbox(line.bbox, dimensions.width, dimensions.height),
      })) || [];

      return {
        text: result.data.text,
        confidence: result.data.confidence,
        lines,
        dimensions,
      };
    } catch (error) {
      console.error('[OCR] Text extraction error:', error.message);
      throw new Error('Failed to extract text from image');
    }
  }

  /**
   * Process a receipt image and extract structured data
   * @param {Buffer} imageBuffer - Receipt image buffer
   * @returns {Promise<{rawText: string, confidence: number, lines: Array, imageDimensions: {width: number, height: number}}>}
   */
  async processReceipt(imageBuffer) {
    const { text, confidence, lines, dimensions } = await this.extractText(imageBuffer);

    return {
      rawText: text,
      confidence,
      lines,
      imageDimensions: dimensions,
    };
  }
}

export const ocrService = new OcrService();
export default ocrService;
