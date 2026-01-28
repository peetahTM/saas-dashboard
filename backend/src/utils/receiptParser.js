/**
 * Receipt Parser - Extracts grocery items from OCR text
 */

// Common receipt patterns
const PRICE_PATTERN = /\$?\d+\.\d{2}/;
const QUANTITY_PATTERN = /^(\d+(?:\.\d+)?)\s*(x|@|\*)?/i;
const WEIGHT_PATTERN = /(\d+(?:\.\d+)?)\s*(lb|lbs|oz|kg|g)\b/i;

// Common words to filter out (not grocery items)
const FILTER_WORDS = new Set([
  'total', 'subtotal', 'tax', 'change', 'cash', 'credit', 'debit',
  'card', 'visa', 'mastercard', 'amex', 'thank', 'thanks', 'welcome',
  'receipt', 'store', 'address', 'phone', 'tel', 'date', 'time',
  'cashier', 'register', 'transaction', 'balance', 'savings', 'discount',
  'coupon', 'member', 'points', 'rewards', 'loyalty', 'approved',
]);

// Category mappings based on keywords
const CATEGORY_KEYWORDS = {
  produce: ['apple', 'banana', 'orange', 'tomato', 'lettuce', 'carrot', 'onion',
            'potato', 'broccoli', 'spinach', 'pepper', 'cucumber', 'avocado',
            'grape', 'strawberry', 'blueberry', 'lemon', 'lime', 'celery', 'garlic'],
  dairy: ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'egg', 'eggs'],
  meat: ['chicken', 'beef', 'pork', 'turkey', 'bacon', 'sausage', 'ham',
         'steak', 'ground', 'fish', 'salmon', 'tuna', 'shrimp'],
  bakery: ['bread', 'bagel', 'muffin', 'croissant', 'roll', 'bun', 'cake', 'donut'],
  pantry: ['rice', 'pasta', 'cereal', 'flour', 'sugar', 'oil', 'salt', 'pepper',
           'sauce', 'soup', 'can', 'beans', 'coffee', 'tea'],
  frozen: ['frozen', 'ice cream', 'pizza', 'fries'],
  beverages: ['water', 'juice', 'soda', 'cola', 'beer', 'wine', 'drink'],
  snacks: ['chips', 'crackers', 'cookies', 'candy', 'chocolate', 'nuts'],
};

// Default expiry days by category
const DEFAULT_EXPIRY_DAYS = {
  produce: 7,
  dairy: 14,
  meat: 5,
  bakery: 5,
  pantry: 180,
  frozen: 90,
  beverages: 30,
  snacks: 60,
  other: 14,
};

/**
 * Clean and normalize text
 */
function cleanText(text) {
  return text
    .replace(/[^\w\s\$\.\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Check if a line looks like a grocery item
 */
function isLikelyGroceryItem(line) {
  const cleaned = cleanText(line);

  // Skip very short lines
  if (cleaned.length < 3) return false;

  // Skip lines that are mostly numbers
  const letterCount = (cleaned.match(/[a-z]/g) || []).length;
  if (letterCount < 2) return false;

  // Skip lines with filter words
  for (const word of FILTER_WORDS) {
    if (cleaned.includes(word)) return false;
  }

  return true;
}

/**
 * Determine category based on item name
 */
function determineCategory(itemName) {
  const lower = itemName.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        return category;
      }
    }
  }

  return 'other';
}

/**
 * Extract quantity and unit from text
 */
function extractQuantity(text) {
  const weightMatch = text.match(WEIGHT_PATTERN);
  if (weightMatch) {
    return {
      quantity: parseFloat(weightMatch[1]),
      unit: weightMatch[2].toLowerCase(),
    };
  }

  const qtyMatch = text.match(QUANTITY_PATTERN);
  if (qtyMatch) {
    return {
      quantity: parseFloat(qtyMatch[1]),
      unit: 'each',
    };
  }

  return { quantity: 1, unit: 'each' };
}

/**
 * Clean up item name
 */
function cleanItemName(text) {
  return text
    .replace(PRICE_PATTERN, '')
    .replace(QUANTITY_PATTERN, '')
    .replace(WEIGHT_PATTERN, '')
    .replace(/[^\w\s\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Calculate expiry date based on category
 */
function calculateExpiryDate(category) {
  const days = DEFAULT_EXPIRY_DAYS[category] || DEFAULT_EXPIRY_DAYS.other;
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

/**
 * Parse OCR text and extract grocery items
 * @param {string} ocrText - Raw text from OCR
 * @param {Array} ocrLines - Optional array of line objects with bounding boxes from OCR
 * @returns {Array<{name: string, category: string, quantity: number, unit: string, expiryDate: string, lineIndex?: number, bbox?: object}>}
 */
export function parseReceiptText(ocrText, ocrLines = null) {
  const textLines = ocrText.split('\n');
  const items = [];
  const seenNames = new Set();

  for (let i = 0; i < textLines.length; i++) {
    const line = textLines[i];
    if (!isLikelyGroceryItem(line)) continue;

    const name = cleanItemName(line);

    // Skip if name is too short or already seen
    if (name.length < 2 || seenNames.has(name.toLowerCase())) continue;
    seenNames.add(name.toLowerCase());

    const { quantity, unit } = extractQuantity(line);
    const category = determineCategory(name);
    const expiryDate = calculateExpiryDate(category);

    // Find matching OCR line by index to get bounding box
    const ocrLine = ocrLines ? ocrLines[i] : null;
    const lineConfidence = ocrLine?.confidence ?? 80;

    items.push({
      name,
      category,
      quantity,
      unit,
      expiryDate,
      confidence: lineConfidence / 100, // Normalize to 0-1 range
      lineIndex: i,
      bbox: ocrLine?.bbox || null,
    });
  }

  return items;
}

/**
 * Match parsed items against grocery suggestions for better names/categories
 * @param {Array} parsedItems - Items from parseReceiptText
 * @param {Array} suggestions - Grocery suggestions from database
 * @returns {Array} Enhanced items with matched suggestions
 */
export function matchWithSuggestions(parsedItems, suggestions) {
  return parsedItems.map(item => {
    const itemLower = item.name.toLowerCase();

    // Find best matching suggestion
    const match = suggestions.find(s => {
      const suggestionLower = s.name.toLowerCase();
      return itemLower.includes(suggestionLower) || suggestionLower.includes(itemLower);
    });

    if (match) {
      // Calculate expiry date from suggestion
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + (match.default_expiry_days || 14));

      return {
        ...item,
        name: match.name,
        category: match.category || item.category,
        expiryDate: expiryDate.toISOString().split('T')[0],
        matchedSuggestionId: match.id,
        confidence: 0.95,
        // Preserve bbox and lineIndex from original item
        lineIndex: item.lineIndex,
        bbox: item.bbox,
      };
    }

    return item;
  });
}

export default {
  parseReceiptText,
  matchWithSuggestions,
};
