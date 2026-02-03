import { useState, useMemo, useEffect } from 'react';
import type { CreateGroceryData, GrocerySuggestion, StorageLocation } from '../../services/groceryService';
import { getDefaultStorageLocation } from '../../services/groceryService';
import { usePreferences } from '../../context/PreferencesContext';
import GroceryAutocomplete from './GroceryAutocomplete';

interface AddGroceryFormProps {
  onSubmit: (data: CreateGroceryData) => Promise<{ success: boolean; error?: string }>;
}

const CATEGORIES = [
  'Fruits',
  'Vegetables',
  'Dairy',
  'Meat',
  'Seafood',
  'Bakery',
  'Frozen',
  'Canned Goods',
  'Beverages',
  'Snacks',
  'Condiments',
  'Other',
];

const METRIC_UNITS = ['pcs', 'kg', 'g', 'L', 'ml'];
const IMPERIAL_UNITS = ['pcs', 'lb', 'oz', 'cup', 'tbsp', 'tsp'];
const ALL_UNITS = ['pcs', 'kg', 'g', 'lb', 'oz', 'L', 'ml', 'cup', 'tbsp', 'tsp'];

const getUnitsForSystem = (unitSystem: 'metric' | 'imperial' | undefined): string[] => {
  if (unitSystem === 'metric') {
    // Metric units first, then imperial units (excluding duplicates)
    return [...METRIC_UNITS, ...IMPERIAL_UNITS.filter(u => !METRIC_UNITS.includes(u))];
  }
  if (unitSystem === 'imperial') {
    // Imperial units first, then metric units (excluding duplicates)
    return [...IMPERIAL_UNITS, ...METRIC_UNITS.filter(u => !IMPERIAL_UNITS.includes(u))];
  }
  return ALL_UNITS;
};

const STORAGE_LOCATIONS: { value: StorageLocation; label: string; icon: string }[] = [
  { value: 'fridge', label: 'Fridge', icon: '❄️' },
  { value: 'freezer', label: 'Freezer', icon: '🧊' },
  { value: 'pantry', label: 'Pantry', icon: '🗄️' },
];

function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

function addDaysToDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatDateForInput(date);
}

const AddGroceryForm: React.FC<AddGroceryFormProps> = ({ onSubmit }) => {
  const { preferences } = usePreferences();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('pcs');
  const [expiryDate, setExpiryDate] = useState(addDaysToDate(7));
  const [storageLocation, setStorageLocation] = useState<StorageLocation>('pantry');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get units ordered by user's preferred system
  const availableUnits = useMemo(
    () => getUnitsForSystem(preferences?.unitSystem),
    [preferences?.unitSystem]
  );

  // Sync unit selection when preferences load (only if still on default)
  useEffect(() => {
    if (availableUnits.length > 0 && unit === 'pcs') {
      setUnit(availableUnits[0]);
    }
  }, [availableUnits]);

  const handleSuggestionSelect = (suggestion: GrocerySuggestion) => {
    setCategory(suggestion.category);
    setExpiryDate(addDaysToDate(suggestion.defaultExpiryDays));
    setStorageLocation(suggestion.defaultStorageLocation || getDefaultStorageLocation(suggestion.category));
  };

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    setStorageLocation(getDefaultStorageLocation(newCategory));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (!category) {
      setError('Category is required');
      return;
    }

    const parsedQuantity = parseFloat(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      setError('Quantity must be a positive number');
      return;
    }

    if (!expiryDate) {
      setError('Expiry date is required');
      return;
    }

    setIsSubmitting(true);

    const result = await onSubmit({
      name: name.trim(),
      category,
      quantity: parsedQuantity,
      unit,
      expiryDate,
      storageLocation,
    });

    setIsSubmitting(false);

    if (result.success) {
      setName('');
      setCategory('');
      setQuantity('1');
      setUnit(availableUnits[0] || 'pcs');
      setExpiryDate(addDaysToDate(7));
      setStorageLocation('pantry');
    } else {
      setError(result.error || 'Failed to add grocery');
    }
  };

  return (
    <form className="add-grocery-form" onSubmit={handleSubmit}>
      <h2 className="add-grocery-form__title">Add New Item</h2>

      {error && <div className="add-grocery-form__error">{error}</div>}

      <div className="add-grocery-form__row">
        <div className="add-grocery-form__field add-grocery-form__field--name">
          <label htmlFor="grocery-name">Name</label>
          <GroceryAutocomplete
            value={name}
            onChange={setName}
            onSelect={handleSuggestionSelect}
            placeholder="Enter grocery name..."
          />
        </div>

        <div className="add-grocery-form__field add-grocery-form__field--category">
          <label htmlFor="grocery-category">Category</label>
          <select
            id="grocery-category"
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="add-grocery-form__select"
          >
            <option value="">Select category</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="add-grocery-form__row">
        <div className="add-grocery-form__field add-grocery-form__field--quantity">
          <label htmlFor="grocery-quantity">Quantity</label>
          <input
            type="number"
            id="grocery-quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min="0.01"
            step="0.01"
            className="add-grocery-form__input"
          />
        </div>

        <div className="add-grocery-form__field add-grocery-form__field--unit">
          <label htmlFor="grocery-unit">Unit</label>
          <select
            id="grocery-unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="add-grocery-form__select"
          >
            {availableUnits.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>

        <div className="add-grocery-form__field add-grocery-form__field--expiry">
          <label htmlFor="grocery-expiry">Expiry Date</label>
          <input
            type="date"
            id="grocery-expiry"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="add-grocery-form__input"
          />
        </div>
      </div>

      <div className="add-grocery-form__row">
        <div className="add-grocery-form__field add-grocery-form__field--storage">
          <label>Storage Location</label>
          <div className="add-grocery-form__storage-buttons">
            {STORAGE_LOCATIONS.map((loc) => (
              <button
                key={loc.value}
                type="button"
                className={`add-grocery-form__storage-btn ${storageLocation === loc.value ? 'add-grocery-form__storage-btn--active' : ''}`}
                onClick={() => setStorageLocation(loc.value)}
              >
                <span className="add-grocery-form__storage-icon">{loc.icon}</span>
                <span className="add-grocery-form__storage-label">{loc.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="add-grocery-form__submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Adding...' : 'Add Item'}
      </button>
    </form>
  );
};

export default AddGroceryForm;
