/**
 * Receipt Parser - Extracts grocery items from OCR text
 */

// Common receipt patterns (supports Swedish price format with comma)
const PRICE_PATTERN = /\$?\d+[.,]\d{2}/;
const QUANTITY_PATTERN = /^(\d+(?:[.,]\d+)?)\s*(x|@|\*|st)?/i;
const WEIGHT_PATTERN = /(\d+(?:[.,]\d+)?)\s*(lb|lbs|oz|kg|g|dl|l|cl|ml|st)\b/i;

// Common words to filter out (not grocery items)
const FILTER_WORDS = new Set([
  // English
  'total', 'subtotal', 'tax', 'change', 'cash', 'credit', 'debit',
  'card', 'visa', 'mastercard', 'amex', 'thank', 'thanks', 'welcome',
  'receipt', 'store', 'address', 'phone', 'tel', 'date', 'time',
  'cashier', 'register', 'transaction', 'balance', 'savings', 'discount',
  'coupon', 'member', 'points', 'rewards', 'loyalty', 'approved',
  // Swedish
  'totalt', 'summa', 'moms', 'kontant', 'kort', 'kvitto', 'butik',
  'tack', 'välkommen', 'datum', 'tid', 'kassör', 'rabatt', 'bonus',
  'medlem', 'poäng', 'ändring', 'saldo', 'besparing', 'kupong',
  'godkänd', 'adress', 'telefon', 'transaktion', 'register',
]);

// Category mappings based on keywords (English and Swedish)
const CATEGORY_KEYWORDS = {
  produce: [
    // English
    'apple', 'banana', 'orange', 'tomato', 'lettuce', 'carrot', 'onion',
    'potato', 'broccoli', 'spinach', 'pepper', 'cucumber', 'avocado',
    'grape', 'strawberry', 'blueberry', 'lemon', 'lime', 'celery', 'garlic',
    // Swedish
    'äpple', 'banan', 'apelsin', 'tomat', 'sallad', 'morot', 'lök',
    'potatis', 'broccoli', 'spenat', 'paprika', 'gurka', 'avokado',
    'druva', 'jordgubbe', 'blåbär', 'citron', 'lime', 'selleri', 'vitlök',
  ],
  dairy: [
    // English
    'milk', 'cheese', 'yogurt', 'butter', 'cream', 'egg', 'eggs',
    // Swedish
    'mjölk', 'ost', 'yoghurt', 'smör', 'grädde', 'ägg', 'fil', 'kvarg',
  ],
  meat: [
    // English
    'chicken', 'beef', 'pork', 'turkey', 'bacon', 'sausage', 'ham',
    'steak', 'ground', 'fish', 'salmon', 'tuna', 'shrimp',
    // Swedish
    'kyckling', 'nötkött', 'fläsk', 'kalkon', 'bacon', 'korv', 'skinka',
    'biff', 'färs', 'fisk', 'lax', 'tonfisk', 'räkor', 'köttfärs',
  ],
  bakery: [
    // English
    'bread', 'bagel', 'muffin', 'croissant', 'roll', 'bun', 'cake', 'donut',
    // Swedish
    'bröd', 'bulle', 'muffins', 'croissant', 'fralla', 'tårta', 'kaka', 'munk',
  ],
  pantry: [
    // English
    'rice', 'pasta', 'cereal', 'flour', 'sugar', 'oil', 'salt', 'pepper',
    'sauce', 'soup', 'can', 'beans', 'coffee', 'tea',
    // Swedish
    'ris', 'pasta', 'flingor', 'mjöl', 'socker', 'olja', 'salt', 'peppar',
    'sås', 'soppa', 'konserv', 'bönor', 'kaffe', 'te',
  ],
  frozen: [
    // English
    'frozen', 'ice cream', 'pizza', 'fries',
    // Swedish
    'fryst', 'frysta', 'glass', 'pizza', 'pommes',
  ],
  beverages: [
    // English
    'water', 'juice', 'soda', 'cola', 'beer', 'wine', 'drink',
    // Swedish
    'vatten', 'juice', 'läsk', 'cola', 'öl', 'vin', 'dryck', 'must',
  ],
  snacks: [
    // English
    'chips', 'crackers', 'cookies', 'candy', 'chocolate', 'nuts',
    // Swedish
    'chips', 'kex', 'kakor', 'godis', 'choklad', 'nötter',
  ],
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
 * Clean and normalize text (supports Swedish characters å, ä, ö)
 */
function cleanText(text) {
  return text
    .replace(/[^\w\s\$\.\-åäöÅÄÖ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Check if a line looks like a grocery item (supports Swedish characters)
 */
function isLikelyGroceryItem(line) {
  const cleaned = cleanText(line);

  // Skip very short lines
  if (cleaned.length < 3) return false;

  // Skip lines that are mostly numbers (include Swedish letters å, ä, ö)
  const letterCount = (cleaned.match(/[a-zåäö]/g) || []).length;
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
 * Clean up item name (supports Swedish characters å, ä, ö)
 */
function cleanItemName(text) {
  return text
    .replace(PRICE_PATTERN, '')
    .replace(QUANTITY_PATTERN, '')
    .replace(WEIGHT_PATTERN, '')
    .replace(/[^\w\s\-åäöÅÄÖ]/g, ' ')
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
 * @returns {Array<{name: string, category: string, quantity: number, unit: string, expiryDate: string}>}
 */
export function parseReceiptText(ocrText) {
  const lines = ocrText.split('\n');
  const items = [];
  const seenNames = new Set();

  for (const line of lines) {
    if (!isLikelyGroceryItem(line)) continue;

    const name = cleanItemName(line);

    // Skip if name is too short or already seen
    if (name.length < 2 || seenNames.has(name.toLowerCase())) continue;
    seenNames.add(name.toLowerCase());

    const { quantity, unit } = extractQuantity(line);
    const category = determineCategory(name);
    const expiryDate = calculateExpiryDate(category);

    items.push({
      name,
      category,
      quantity,
      unit,
      expiryDate,
      confidence: 0.8, // Default confidence for parsed items
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
      };
    }

    return item;
  });
}

export default {
  parseReceiptText,
  matchWithSuggestions,
};
