# FreshTrack Tasks

## Task 5: Test and Fix Pantry and Recipes Pages

**Status:** in_progress

### Tasks:
1. Test Pantry page (`frontend/src/pages/Pantry.tsx`):
   - Add a grocery item using the form
   - Verify autocomplete suggestions work
   - Check expiry badge colors (add items with different expiry dates)
   - Test consume button
   - Test delete button
   - Fix any bugs found

2. Test Recipes page (`frontend/src/pages/Recipes.tsx`):
   - Verify recipes load from backend
   - Test clicking a recipe card navigates to detail page
   - Test recipe detail page shows ingredients and instructions
   - Fix any bugs found

3. Fix ExpiryBadge if needed (`frontend/src/components/Groceries/ExpiryBadge.tsx`):
   - Verify color logic:
     - expired (red): days < 0
     - critical (orange): days <= 2
     - warning (yellow): days <= 5
     - fresh (green): days > 5

4. Fix any type errors encountered in the console

---

## Task 7: Add Image Cropping to Receipt Scanner

**Status:** completed

### Description:
Allow users to optionally crop receipt images before OCR processing to improve accuracy by focusing on the items section.

### Requirements:
- Cropping should be **optional** (user can skip)
- Add a new step between image selection and preview: `capture → crop → preview → process`
- Use `react-image-crop` or `react-cropper` library

### Implementation:
1. Install cropping library:
   ```bash
   npm install react-image-crop --workspace=frontend
   ```

2. Create `ImageCropper.tsx` component in `frontend/src/components/Receipt/`:
   - Display selected image with crop overlay
   - Allow user to drag/resize crop area
   - Buttons: "Skip" (use full image) and "Crop" (apply crop)

3. Update `ReceiptScanner.tsx`:
   - Add 'crop' step to `ScannerStep` type
   - After file selection, go to crop step instead of preview
   - Pass cropped image (or original if skipped) to preview step

4. Update `receiptService.ts`:
   - Handle cropped image blob for upload

### Files to modify:
- `frontend/src/components/Receipt/ReceiptScanner.tsx`
- `frontend/src/components/Receipt/ImageCropper.tsx` (new)
- `frontend/src/components/Receipt/Receipt.css`
- `frontend/package.json`

---

## Task 8: Highlight Detected Areas on Receipt Image

**Status:** pending

### Description:
Show users which areas of the receipt were detected by OCR, with clickable regions that scroll to corresponding items in the review list.

### Requirements:
- Show highlights only during the **review step**
- Color-code by confidence: green (high), yellow (medium), red (low)
- Clicking a highlighted area scrolls to that item in the list
- Hovering an item in the list highlights corresponding area on image

### Implementation:

#### Backend changes:
1. Update `ocrService.js` to return bounding box data:
   ```javascript
   // Tesseract provides: result.data.lines[].bbox = { x0, y0, x1, y1 }
   // Return this data alongside parsed items
   ```

2. Update `receipts.js` route to include bbox in response

3. Update `receiptParser.js` to preserve line-to-item mapping

#### Frontend changes:
1. Create `HighlightedReceipt.tsx` component:
   - Canvas overlay on receipt image
   - Draw rectangles for each detected item
   - Handle click events on rectangles
   - Scale coordinates based on displayed image size

2. Update `ReceiptScanner.tsx` review step:
   - Show `HighlightedReceipt` alongside `ParsedItemsList`
   - Sync hover/selection state between components

3. Update `ParsedItemsList.tsx`:
   - Add refs for scrolling to items
   - Handle highlight state from parent

### Files to modify:
- `backend/src/services/ocrService.js`
- `backend/src/routes/receipts.js`
- `backend/src/utils/receiptParser.js`
- `frontend/src/components/Receipt/HighlightedReceipt.tsx` (new)
- `frontend/src/components/Receipt/ReceiptScanner.tsx`
- `frontend/src/components/Receipt/ParsedItemsList.tsx`
- `frontend/src/services/receiptService.ts`

---

## Task 9: Add Storage Location for Groceries

**Status:** pending

### Description:
Allow users to organize groceries by storage location (fridge, freezer, pantry) with auto-suggestion based on category.

### Requirements:
- Three locations only: `fridge`, `freezer`, `pantry`
- Display as a **badge** on grocery items
- Auto-suggest location based on category when adding items
- User can override the suggestion

### Storage Location Mapping:
| Category   | Default Location |
|------------|------------------|
| dairy      | fridge           |
| meat       | fridge           |
| produce    | fridge           |
| frozen     | freezer          |
| bakery     | pantry           |
| pantry     | pantry           |
| beverages  | fridge           |
| snacks     | pantry           |
| other      | pantry           |

### Implementation:

#### Database:
1. Create migration `004_add_storage_location.js`:
   ```sql
   ALTER TABLE groceries ADD COLUMN storage_location VARCHAR(20) DEFAULT 'pantry';
   ALTER TABLE grocery_suggestions ADD COLUMN default_storage_location VARCHAR(20);
   ```

2. Update seed data with default storage locations

#### Backend:
1. Update `groceries.js` routes to accept/return `storageLocation`
2. Update `receiptParser.js` to include storage location suggestion
3. Add `getStorageLocation(category)` helper function

#### Frontend:
1. Create `StorageLocationBadge.tsx` component:
   - Icons: fridge (snowflake), freezer (ice), pantry (cabinet)
   - Colors: fridge (blue), freezer (light blue), pantry (brown)

2. Update `AddGroceryForm.tsx`:
   - Add storage location selector (3 buttons or dropdown)
   - Auto-select based on category change

3. Update `GroceryItem.tsx`:
   - Display `StorageLocationBadge`

4. Update `ParsedItemsList.tsx`:
   - Show storage location for receipt-scanned items
   - Allow editing before confirm

### Files to modify:
- `backend/src/db/migrations/004_add_storage_location.js` (new)
- `backend/src/routes/groceries.js`
- `backend/src/utils/receiptParser.js`
- `frontend/src/components/Groceries/StorageLocationBadge.tsx` (new)
- `frontend/src/components/Groceries/AddGroceryForm.tsx`
- `frontend/src/components/Groceries/GroceryItem.tsx`
- `frontend/src/components/Receipt/ParsedItemsList.tsx`
- `frontend/src/services/groceryService.ts`

---

## Task 10: Add Swedish Language Support for Receipt Scanner

**Status:** completed

### Description:
Enable OCR and categorization to work with Swedish receipts.

### Requirements:
- Support Swedish text recognition in Tesseract
- Add Swedish keywords for category detection
- Consider auto-detecting language or using multi-language mode

### Implementation:

#### Backend:
1. Update `ocrService.js`:
   - Use multi-language mode: `eng+swe`
   - Or add language detection

2. Update `receiptParser.js` - add Swedish keywords:
   ```javascript
   const CATEGORY_KEYWORDS = {
     produce: ['apple', 'banana', ..., 'äpple', 'banan', 'tomat', 'gurka', 'lök', 'potatis', 'morot', 'sallad'],
     dairy: ['milk', 'cheese', ..., 'mjölk', 'ost', 'ägg', 'smör', 'grädde', 'yoghurt'],
     meat: ['chicken', 'beef', ..., 'kyckling', 'nötkött', 'fläsk', 'korv', 'bacon', 'skinka', 'fisk', 'lax'],
     bakery: ['bread', ..., 'bröd', 'bulle', 'kaka', 'croissant'],
     pantry: ['rice', 'pasta', ..., 'ris', 'pasta', 'mjöl', 'socker', 'salt', 'olja', 'kaffe', 'te'],
     frozen: ['frozen', ..., 'fryst', 'glass', 'frysta'],
     beverages: ['water', 'juice', ..., 'vatten', 'juice', 'läsk', 'öl', 'vin'],
     snacks: ['chips', ..., 'chips', 'godis', 'choklad', 'nötter', 'kex'],
   };

   const FILTER_WORDS = new Set([
     // English
     'total', 'subtotal', 'tax', ...
     // Swedish
     'totalt', 'summa', 'moms', 'kontant', 'kort', 'kvitto', 'butik', 'tack', 'välkommen',
     'datum', 'tid', 'kassör', 'rabatt', 'bonus', 'medlem',
   ]);
   ```

3. Optionally: Add Swedish grocery suggestions to seed data

### Files to modify:
- `backend/src/services/ocrService.js`
- `backend/src/utils/receiptParser.js`
- `backend/src/db/seed.js` (optional - Swedish suggestions)
