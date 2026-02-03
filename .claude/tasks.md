# FreshTrack Tasks

## Task 5: Test and Fix Pantry and Recipes Pages

**Status:** completed

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

**Status:** completed

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

**Status:** completed

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

---

## Task 11: Add Unit Measurement Preference (Metric/Imperial)

**Status:** completed

### Description:
Add a global user preference for unit system (Metric vs Imperial). When adding items, default units will match the user's preference.

### Implementation:

#### Backend:
1. Add migration `005_add_user_preferences.js`:
   ```sql
   ALTER TABLE users ADD COLUMN unit_system VARCHAR(10) DEFAULT 'metric';
   ```

2. Update preferences routes to include `unitSystem`

#### Frontend:
1. Update `UserPreferences` interface in `preferencesService.ts`:
   ```typescript
   unitSystem: 'metric' | 'imperial';
   ```

2. Update `Preferences.tsx`:
   - Add toggle/radio buttons for Metric/Imperial

3. Update `AddGroceryForm.tsx`:
   - Filter/prioritize units based on preference:
     - Metric: kg, g, L, ml
     - Imperial: lb, oz, cup, tbsp, tsp

### Files to modify:
- `backend/src/db/migrations/005_add_user_preferences.js` (new)
- `backend/src/routes/preferences.js`
- `frontend/src/services/preferencesService.ts`
- `frontend/src/pages/Preferences.tsx`
- `frontend/src/components/Groceries/AddGroceryForm.tsx`

---

## Task 12: Generate Meal Plan with Groq AI

**Status:** pending

### Description:
Integrate Groq API (free tier) to generate meal plans based on user's pantry items, dietary restrictions, and preferences.

### Implementation:

#### Backend:
1. Install Groq SDK:
   ```bash
   npm install groq-sdk --workspace=backend
   ```

2. Create `aiService.js` in `backend/src/services/`:
   - Initialize Groq client with API key from env
   - Create `generateMealPlan(pantryItems, preferences)` function
   - Use Llama 3 or Mixtral model
   - Prompt template for meal suggestions

3. Create new route `backend/src/routes/ai.js`:
   - `POST /api/ai/generate-meal-plan`
   - Accept: date range, meal types, dietary preferences
   - Return: structured meal suggestions

#### Frontend:
1. Create `aiService.ts` in `frontend/src/services/`

2. Update `MealPlan.tsx`:
   - Add "Generate with AI" button
   - Show loading state during generation
   - Display suggestions with "Add to Plan" action

3. Create `MealSuggestionCard.tsx` component

### Files to modify:
- `backend/src/services/aiService.js` (new)
- `backend/src/routes/ai.js` (new)
- `backend/src/routes/index.js`
- `frontend/src/services/aiService.ts` (new)
- `frontend/src/pages/MealPlan.tsx`
- `frontend/src/components/MealPlan/MealSuggestionCard.tsx` (new)
- `.env.example` (add GROQ_API_KEY)

---

## Task 13: Fix Duplicate Profile Icon Bug

**Status:** completed

### Description:
Bug report: The profile icon appears twice in the header area (top right corner). Investigate and fix.

### Root Cause:
Page components (Dashboard, Pantry, Recipes, MealPlan, Preferences) were wrapping their content in `<Layout>` internally, while App.tsx also wrapped them in `<Layout>`. This caused double-nesting of Layout, resulting in two headers with two profile icons.

### Solution:
Removed the internal `<Layout>` wrappers from all page components since App.tsx already provides the Layout wrapper:
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/pages/Pantry.tsx`
- `frontend/src/pages/Recipes.tsx`
- `frontend/src/pages/MealPlan.tsx`
- `frontend/src/pages/Preferences.tsx`

### Files modified:
- `frontend/src/pages/Dashboard.tsx` - removed Layout import and wrapper
- `frontend/src/pages/Pantry.tsx` - removed Layout import and wrapper
- `frontend/src/pages/Recipes.tsx` - removed Layout import and wrapper
- `frontend/src/pages/MealPlan.tsx` - removed Layout import and wrapper
- `frontend/src/pages/Preferences.tsx` - removed Layout import and wrapper

---

## Task 14: Add Currency Preference for Potential Savings

**Status:** completed

### Description:
Allow users to set their preferred currency for displaying potential savings and cost-related features.

### Implementation:

#### Backend:
1. Update migration (combine with Task 11):
   ```sql
   ALTER TABLE users ADD COLUMN currency VARCHAR(3) DEFAULT 'USD';
   ```

#### Frontend:
1. Update `UserPreferences` interface:
   ```typescript
   currency: string; // ISO 4217 code (USD, EUR, SEK, GBP, etc.)
   ```

2. Update `Preferences.tsx`:
   - Add currency dropdown with common options:
     - USD ($), EUR (€), GBP (£), SEK (kr), etc.

3. Update Dashboard/savings displays to use user's currency symbol

### Currency mapping:
```typescript
const CURRENCIES = {
  USD: { symbol: '$', name: 'US Dollar' },
  EUR: { symbol: '€', name: 'Euro' },
  GBP: { symbol: '£', name: 'British Pound' },
  SEK: { symbol: 'kr', name: 'Swedish Krona' },
};
```

### Files to modify:
- `backend/src/db/migrations/005_add_user_preferences.js` (combine with Task 11)
- `backend/src/routes/preferences.js`
- `frontend/src/services/preferencesService.ts`
- `frontend/src/pages/Preferences.tsx`
- `frontend/src/pages/Dashboard.tsx` (if savings displayed)

---

## Task 15: Add Edit Functionality for Grocery Items

**Status:** completed

### Description:
Allow users to edit grocery items after they've been added. Currently only consume/delete actions exist.

### Implementation:

#### Frontend:
1. Create `EditGroceryModal.tsx` component:
   - Reuse form fields from `AddGroceryForm`
   - Pre-populate with existing item data
   - Cancel and Save buttons
   - Call update API on save

2. Update `GroceryItem.tsx`:
   - Add edit button (pencil icon)
   - Manage modal open/close state
   - Pass item data to modal

3. Update `groceryService.ts`:
   - Ensure `updateGrocery` method exists and works

4. Update `GroceryContext.tsx`:
   - Add `updateGrocery` action if missing

#### Backend:
- Verify `PUT /api/groceries/:id` route works correctly

### Files to modify:
- `frontend/src/components/Groceries/EditGroceryModal.tsx` (new)
- `frontend/src/components/Groceries/GroceryItem.tsx`
- `frontend/src/services/groceryService.ts`
- `frontend/src/context/GroceryContext.tsx`
- `frontend/src/pages/Pantry.css` (modal styles)

---

## Task 16: Improve Storage Location Button Styling

**Status:** pending

### Description:
The storage location buttons in `AddGroceryForm` are missing CSS styling. The component uses these classes but they have NO CSS defined:
- `.add-grocery-form__storage-buttons`
- `.add-grocery-form__storage-btn`
- `.add-grocery-form__storage-btn--active`
- `.add-grocery-form__storage-icon`
- `.add-grocery-form__storage-label`

### Implementation:
Add the following CSS to `Pantry.css`:

```css
/* Storage Location Buttons */
.add-grocery-form__storage-buttons {
  display: flex;
  gap: 12px;
}

.add-grocery-form__storage-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  background: white;
  cursor: pointer;
  transition: all 150ms ease;
  flex: 1;
}

.add-grocery-form__storage-btn:hover {
  border-color: #d1d5db;
  background: #f9fafb;
}

.add-grocery-form__storage-btn--active {
  border-color: #3b82f6;
  background: #eff6ff;
}

.add-grocery-form__storage-icon {
  font-size: 20px;
}

.add-grocery-form__storage-label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.add-grocery-form__storage-btn--active .add-grocery-form__storage-label {
  color: #1d4ed8;
}
```

### Files to modify:
- `frontend/src/pages/Pantry.css`

---

## Task 17: Fix Currency Preference Not Saving

**Status:** pending

### Description:
Bug report: The currency preference cannot be saved. When users try to change their currency setting in the Preferences page, the change does not persist.

### Investigation:
1. Check if the backend `PUT /api/preferences` route accepts and saves the `currency` field
2. Check if the frontend is sending the currency value correctly
3. Verify database column exists and migration was run
4. Check for any validation errors in the API response

### Files to investigate:
- `backend/src/routes/preferences.js`
- `frontend/src/pages/Preferences.tsx`
- `frontend/src/services/preferencesService.ts`
- `backend/src/db/migrations/005_add_user_preferences.js`

---

## Task 18: Fix Receipt Crop Highlighting Out-of-Bounds Areas

**Status:** pending

### Description:
Bug report: When cropping a receipt image, the highlight boxes still show areas that are outside the cropped region. The bounding box coordinates from OCR are relative to the cropped image, but the highlighting may be using wrong reference dimensions.

### Root Cause Analysis:
- When user crops the image, the cropped blob is sent to OCR
- OCR returns bounding boxes relative to the cropped image dimensions
- However, the preview URL shown might still reference the original image
- Or the processed dimensions don't account for the crop transformation

### Fix:
1. Ensure the cropped image (not original) is displayed during review step
2. Verify `processedDimensions` from backend matches the cropped image that was sent
3. The `previewUrl` in review step should point to the cropped image blob URL

### Files to investigate:
- `frontend/src/components/Receipt/ReceiptScanner.tsx`
- `frontend/src/components/Receipt/HighlightedReceipt.tsx`
- `backend/src/services/ocrService.js`

---

## Task 19: Configure Groq API Key for Meal Plan Generation

**Status:** pending

### Description:
The AI meal plan generation feature requires a Groq API key to function. Need to add the API key to the environment configuration.

### Implementation:
1. Get a Groq API key from https://console.groq.com/
2. Add `GROQ_API_KEY` to `.env` file in the backend directory
3. Verify the AI service initializes correctly with the key
4. Test meal plan generation functionality

### Files to modify:
- `backend/.env` (add GROQ_API_KEY=your_key_here)
- `backend/.env.example` (document the required variable)
