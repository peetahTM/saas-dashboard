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

      // Calculate processed dimensions
      let processedWidth = metadata.width;
      let processedHeight = metadata.height;

      // Resize if image is very large (max 2000px on longest side)
      const maxDimension = 2000;
      if (metadata.width > maxDimension || metadata.height > maxDimension) {
        processed = processed.resize(maxDimension, maxDimension, {
          fit: 'inside',
          withoutEnlargement: true,
        });

        // Calculate new dimensions after resize
        const scale = Math.min(maxDimension / metadata.width, maxDimension / metadata.height);
        processedWidth = Math.round(metadata.width * scale);
        processedHeight = Math.round(metadata.height * scale);
      }

      const buffer = await processed.png().toBuffer();

      return {
        buffer,
        dimensions: {
          width: processedWidth,
          height: processedHeight,
        },
      };
    } catch (error) {
      console.error('[OCR] Image preprocessing error:', error.message);
      throw new Error('Failed to preprocess image');
    }
  }

  /**
   * Extract text from an image using Tesseract OCR
   * @param {Buffer} imageBuffer - Image buffer to process
   * @returns {Promise<{text: string, confidence: number, lines: Array, processedDimensions: {width: number, height: number}}>} Extracted text, confidence score, line data with bounding boxes, and processed image dimensions
   */
  async extractText(imageBuffer) {
    try {
      // Preprocess the image
      const { buffer: processedImage, dimensions: processedDimensions } = await this.preprocessImage(imageBuffer);

      // Run OCR with English language
      const result = await Tesseract.recognize(processedImage, 'eng', {
        logger: (info) => {
          if (info.status === 'recognizing text') {
            console.log(`[OCR] Progress: ${Math.round(info.progress * 100)}%`);
          }
        },
      });

      // Extract line data with bounding boxes
      const lines = (result.data.lines || []).map((line, index) => ({
        index,
        text: line.text,
        confidence: line.confidence,
        bbox: line.bbox ? {
          x0: line.bbox.x0,
          y0: line.bbox.y0,
          x1: line.bbox.x1,
          y1: line.bbox.y1,
        } : null,
      }));

      return {
        text: result.data.text,
        confidence: result.data.confidence,
        lines,
        processedDimensions,
      };
    } catch (error) {
      console.error('[OCR] Text extraction error:', error.message);
      throw new Error('Failed to extract text from image');
    }
  }

  /**
   * Process a receipt image and extract structured data
   * @param {Buffer} imageBuffer - Receipt image buffer
   * @returns {Promise<{rawText: string, confidence: number, lines: Array, processedDimensions: {width: number, height: number}}>}
   */
  async processReceipt(imageBuffer) {
    const { text, confidence, lines, processedDimensions } = await this.extractText(imageBuffer);

    return {
      rawText: text,
      confidence,
      lines,
      processedDimensions,
    };
  }
}

export const ocrService = new OcrService();
export default ocrService;
