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
   * @returns {Promise<Buffer>} Processed image buffer
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
      if (metadata.width > maxDimension || metadata.height > maxDimension) {
        processed = processed.resize(maxDimension, maxDimension, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      return processed.png().toBuffer();
    } catch (error) {
      console.error('[OCR] Image preprocessing error:', error.message);
      throw new Error('Failed to preprocess image');
    }
  }

  /**
   * Extract text from an image using Tesseract OCR
   * @param {Buffer} imageBuffer - Image buffer to process
   * @returns {Promise<{text: string, confidence: number}>} Extracted text and confidence score
   */
  async extractText(imageBuffer) {
    try {
      // Preprocess the image
      const processedImage = await this.preprocessImage(imageBuffer);

      // Run OCR with English language
      const result = await Tesseract.recognize(processedImage, 'eng', {
        logger: (info) => {
          if (info.status === 'recognizing text') {
            console.log(`[OCR] Progress: ${Math.round(info.progress * 100)}%`);
          }
        },
      });

      return {
        text: result.data.text,
        confidence: result.data.confidence,
      };
    } catch (error) {
      console.error('[OCR] Text extraction error:', error.message);
      throw new Error('Failed to extract text from image');
    }
  }

  /**
   * Process a receipt image and extract structured data
   * @param {Buffer} imageBuffer - Receipt image buffer
   * @returns {Promise<{rawText: string, confidence: number}>}
   */
  async processReceipt(imageBuffer) {
    const { text, confidence } = await this.extractText(imageBuffer);

    return {
      rawText: text,
      confidence,
    };
  }
}

export const ocrService = new OcrService();
export default ocrService;
