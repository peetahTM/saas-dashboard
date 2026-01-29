import { jest } from '@jest/globals';

// Create mock functions
const mockRecognize = jest.fn();
const mockMetadata = jest.fn();
const mockGrayscale = jest.fn();
const mockNormalize = jest.fn();
const mockSharpen = jest.fn();
const mockResize = jest.fn();
const mockPng = jest.fn();
const mockToBuffer = jest.fn();

// Mock sharp module before importing ocrService
jest.unstable_mockModule('sharp', () => {
  return {
    default: jest.fn((buffer) => {
      return {
        metadata: mockMetadata,
        grayscale: () => {
          mockGrayscale();
          return {
            normalize: () => {
              mockNormalize();
              return {
                sharpen: () => {
                  mockSharpen();
                  return {
                    resize: (...args) => {
                      mockResize(...args);
                      return {
                        png: () => {
                          mockPng();
                          return {
                            toBuffer: mockToBuffer,
                          };
                        },
                      };
                    },
                    png: () => {
                      mockPng();
                      return {
                        toBuffer: mockToBuffer,
                      };
                    },
                  };
                },
              };
            },
          };
        },
      };
    }),
  };
});

// Mock Tesseract module
jest.unstable_mockModule('tesseract.js', () => {
  return {
    default: {
      recognize: mockRecognize,
    },
  };
});

// Import after mocking
const { ocrService } = await import('../../services/ocrService.js');

describe('OcrService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock responses
    mockMetadata.mockResolvedValue({ width: 1000, height: 1500 });
    mockToBuffer.mockResolvedValue(Buffer.from('processed-image'));
    mockRecognize.mockResolvedValue({
      data: {
        text: 'Test text',
        confidence: 90,
        lines: [],
      },
    });
  });

  describe('preprocessImage', () => {
    test('should preprocess image with grayscale, normalize, and sharpen', async () => {
      const imageBuffer = Buffer.from('test-image');

      const result = await ocrService.preprocessImage(imageBuffer);

      expect(mockMetadata).toHaveBeenCalled();
      expect(mockGrayscale).toHaveBeenCalled();
      expect(mockNormalize).toHaveBeenCalled();
      expect(mockSharpen).toHaveBeenCalled();
      expect(mockPng).toHaveBeenCalled();
      expect(mockToBuffer).toHaveBeenCalled();
      expect(result).toEqual(Buffer.from('processed-image'));
    });

    test('should resize large images (width > 2000px)', async () => {
      mockMetadata.mockResolvedValue({ width: 3000, height: 1500 });
      const imageBuffer = Buffer.from('large-image');

      await ocrService.preprocessImage(imageBuffer);

      expect(mockResize).toHaveBeenCalledWith(2000, 2000, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    });

    test('should resize large images (height > 2000px)', async () => {
      mockMetadata.mockResolvedValue({ width: 1000, height: 2500 });
      const imageBuffer = Buffer.from('tall-image');

      await ocrService.preprocessImage(imageBuffer);

      expect(mockResize).toHaveBeenCalledWith(2000, 2000, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    });

    test('should not resize images smaller than max dimension', async () => {
      mockMetadata.mockResolvedValue({ width: 1000, height: 1500 });
      const imageBuffer = Buffer.from('normal-image');

      await ocrService.preprocessImage(imageBuffer);

      expect(mockResize).not.toHaveBeenCalled();
    });

    test('should handle preprocessing errors from metadata', async () => {
      mockMetadata.mockRejectedValue(new Error('Invalid image'));
      const imageBuffer = Buffer.from('bad-image');

      await expect(ocrService.preprocessImage(imageBuffer)).rejects.toThrow(
        'Failed to preprocess image'
      );
    });

    test('should handle sharp processing errors', async () => {
      mockToBuffer.mockRejectedValue(new Error('Processing failed'));
      const imageBuffer = Buffer.from('test-image');

      // Note: Due to async processing in the chain, the actual error message propagates
      await expect(ocrService.preprocessImage(imageBuffer)).rejects.toThrow(
        'Processing failed'
      );
    });
  });

  describe('extractText', () => {
    test('should extract text with bounding boxes from OCR', async () => {
      const mockOcrResult = {
        data: {
          text: 'Item 1\nItem 2\nItem 3',
          confidence: 95.5,
          lines: [
            {
              text: 'Item 1',
              confidence: 98,
              bbox: { x0: 10, y0: 20, x1: 100, y1: 40 },
            },
            {
              text: 'Item 2',
              confidence: 94,
              bbox: { x0: 10, y0: 50, x1: 100, y1: 70 },
            },
            {
              text: 'Item 3',
              confidence: 93,
              bbox: { x0: 10, y0: 80, x1: 100, y1: 100 },
            },
          ],
        },
      };

      mockRecognize.mockResolvedValue(mockOcrResult);
      const imageBuffer = Buffer.from('test-image');

      const result = await ocrService.extractText(imageBuffer);

      expect(result.text).toBe('Item 1\nItem 2\nItem 3');
      expect(result.confidence).toBe(95.5);
      expect(result.lines).toHaveLength(3);
      expect(result.lines[0]).toEqual({
        index: 0,
        text: 'Item 1',
        confidence: 98,
        bbox: { x0: 10, y0: 20, x1: 100, y1: 40 },
      });
    });

    test('should handle lines without bounding boxes', async () => {
      const mockOcrResult = {
        data: {
          text: 'Item without bbox',
          confidence: 90,
          lines: [
            {
              text: 'Item without bbox',
              confidence: 90,
              bbox: null,
            },
          ],
        },
      };

      mockRecognize.mockResolvedValue(mockOcrResult);
      const imageBuffer = Buffer.from('test-image');

      const result = await ocrService.extractText(imageBuffer);

      expect(result.lines[0].bbox).toBeNull();
    });

    test('should handle missing lines array', async () => {
      const mockOcrResult = {
        data: {
          text: 'Some text',
          confidence: 85,
          lines: undefined,
        },
      };

      mockRecognize.mockResolvedValue(mockOcrResult);
      const imageBuffer = Buffer.from('test-image');

      const result = await ocrService.extractText(imageBuffer);

      expect(result.lines).toEqual([]);
    });

    test('should handle empty lines array', async () => {
      const mockOcrResult = {
        data: {
          text: '',
          confidence: 0,
          lines: [],
        },
      };

      mockRecognize.mockResolvedValue(mockOcrResult);
      const imageBuffer = Buffer.from('empty-image');

      const result = await ocrService.extractText(imageBuffer);

      expect(result.lines).toEqual([]);
    });

    test('should call Tesseract with English language', async () => {
      const imageBuffer = Buffer.from('test-image');

      await ocrService.extractText(imageBuffer);

      expect(mockRecognize).toHaveBeenCalledWith(
        expect.any(Buffer),
        'eng',
        expect.objectContaining({
          logger: expect.any(Function),
        })
      );
    });

    test('should handle OCR extraction errors', async () => {
      mockRecognize.mockRejectedValue(new Error('OCR failed'));
      const imageBuffer = Buffer.from('bad-image');

      await expect(ocrService.extractText(imageBuffer)).rejects.toThrow(
        'Failed to extract text from image'
      );
    });
  });

  describe('processReceipt', () => {
    test('should process receipt and return structured data', async () => {
      const mockOcrResult = {
        data: {
          text: 'Store Name\nApple $2.99\nBanana $1.50',
          confidence: 92,
          lines: [
            {
              text: 'Store Name',
              confidence: 95,
              bbox: { x0: 50, y0: 10, x1: 200, y1: 30 },
            },
            {
              text: 'Apple $2.99',
              confidence: 93,
              bbox: { x0: 20, y0: 50, x1: 150, y1: 70 },
            },
            {
              text: 'Banana $1.50',
              confidence: 89,
              bbox: { x0: 20, y0: 80, x1: 150, y1: 100 },
            },
          ],
        },
      };

      mockRecognize.mockResolvedValue(mockOcrResult);
      const imageBuffer = Buffer.from('receipt-image');

      const result = await ocrService.processReceipt(imageBuffer);

      expect(result.rawText).toBe('Store Name\nApple $2.99\nBanana $1.50');
      expect(result.confidence).toBe(92);
      expect(result.lines).toHaveLength(3);
      expect(result.lines[1]).toMatchObject({
        index: 1,
        text: 'Apple $2.99',
        confidence: 93,
        bbox: { x0: 20, y0: 50, x1: 150, y1: 70 },
      });
    });

    test('should handle empty receipt', async () => {
      const mockOcrResult = {
        data: {
          text: '',
          confidence: 0,
          lines: [],
        },
      };

      mockRecognize.mockResolvedValue(mockOcrResult);
      const imageBuffer = Buffer.from('empty-receipt');

      const result = await ocrService.processReceipt(imageBuffer);

      expect(result.rawText).toBe('');
      expect(result.confidence).toBe(0);
      expect(result.lines).toEqual([]);
    });

    test('should handle receipt processing errors', async () => {
      mockRecognize.mockRejectedValue(new Error('Processing failed'));
      const imageBuffer = Buffer.from('bad-receipt');

      await expect(ocrService.processReceipt(imageBuffer)).rejects.toThrow(
        'Failed to extract text from image'
      );
    });
  });

  describe('Edge cases and boundary conditions', () => {
    test('should handle lines with partial bbox data', async () => {
      const mockOcrResult = {
        data: {
          text: 'Partial bbox',
          confidence: 80,
          lines: [
            {
              text: 'Partial bbox',
              confidence: 80,
              bbox: { x0: 10, y0: 20 }, // Missing x1, y1
            },
          ],
        },
      };

      mockRecognize.mockResolvedValue(mockOcrResult);
      const imageBuffer = Buffer.from('test-image');

      const result = await ocrService.extractText(imageBuffer);

      // Should handle partial bbox gracefully
      expect(result.lines[0].bbox).toBeDefined();
      expect(result.lines[0].bbox.x0).toBe(10);
      expect(result.lines[0].bbox.y0).toBe(20);
    });

    test('should handle very high confidence scores', async () => {
      const mockOcrResult = {
        data: {
          text: 'Perfect text',
          confidence: 100,
          lines: [
            {
              text: 'Perfect text',
              confidence: 100,
              bbox: { x0: 0, y0: 0, x1: 100, y1: 20 },
            },
          ],
        },
      };

      mockRecognize.mockResolvedValue(mockOcrResult);
      const imageBuffer = Buffer.from('perfect-image');

      const result = await ocrService.extractText(imageBuffer);

      expect(result.confidence).toBe(100);
      expect(result.lines[0].confidence).toBe(100);
    });

    test('should handle very low confidence scores', async () => {
      const mockOcrResult = {
        data: {
          text: 'Unclear text',
          confidence: 10,
          lines: [
            {
              text: 'Unclear text',
              confidence: 10,
              bbox: { x0: 0, y0: 0, x1: 100, y1: 20 },
            },
          ],
        },
      };

      mockRecognize.mockResolvedValue(mockOcrResult);
      const imageBuffer = Buffer.from('unclear-image');

      const result = await ocrService.extractText(imageBuffer);

      expect(result.confidence).toBe(10);
      expect(result.lines[0].confidence).toBe(10);
    });

    test('should handle lines with zero-width bounding boxes', async () => {
      const mockOcrResult = {
        data: {
          text: 'Zero width',
          confidence: 75,
          lines: [
            {
              text: 'Zero width',
              confidence: 75,
              bbox: { x0: 10, y0: 20, x1: 10, y1: 40 },
            },
          ],
        },
      };

      mockRecognize.mockResolvedValue(mockOcrResult);
      const imageBuffer = Buffer.from('test-image');

      const result = await ocrService.extractText(imageBuffer);

      expect(result.lines[0].bbox).toEqual({ x0: 10, y0: 20, x1: 10, y1: 40 });
    });

    test('should handle negative bounding box coordinates', async () => {
      const mockOcrResult = {
        data: {
          text: 'Negative coords',
          confidence: 70,
          lines: [
            {
              text: 'Negative coords',
              confidence: 70,
              bbox: { x0: -5, y0: -10, x1: 100, y1: 20 },
            },
          ],
        },
      };

      mockRecognize.mockResolvedValue(mockOcrResult);
      const imageBuffer = Buffer.from('test-image');

      const result = await ocrService.extractText(imageBuffer);

      expect(result.lines[0].bbox).toEqual({ x0: -5, y0: -10, x1: 100, y1: 20 });
    });
  });
});
