import { useState } from 'react';
import type { Grocery, UpdateGroceryData, StorageLocation } from '../../services/groceryService';

interface EditGroceryModalProps {
  grocery: Grocery;
  onSave: (id: number, data: UpdateGroceryData) => Promise<{ success: boolean; error?: string }>;
  onClose: () => void;
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

const UNITS = ['pcs', 'kg', 'g', 'lb', 'oz', 'L', 'ml', 'cup', 'tbsp', 'tsp'];

const STORAGE_LOCATIONS: { value: StorageLocation; label: string; icon: string }[] = [
  { value: 'fridge', label: 'Fridge', icon: '❄️' },
  { value: 'freezer', label: 'Freezer', icon: '🧊' },
  { value: 'pantry', label: 'Pantry', icon: '🗄️' },
];

function formatDateForInput(dateString: string): string {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
}

const EditGroceryModal: React.FC<EditGroceryModalProps> = ({ grocery, onSave, onClose }) => {
  const [name, setName] = useState(grocery.name);
  const [category, setCategory] = useState(grocery.category);
  const [quantity, setQuantity] = useState(grocery.quantity.toString());
  const [unit, setUnit] = useState(grocery.unit);
  const [expiryDate, setExpiryDate] = useState(formatDateForInput(grocery.expiryDate));
  const [storageLocation, setStorageLocation] = useState<StorageLocation>(grocery.storageLocation);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    const result = await onSave(grocery.id, {
      name: name.trim(),
      category,
      quantity: parsedQuantity,
      unit,
      expiryDate,
      storageLocation,
    });

    setIsSubmitting(false);

    if (result.success) {
      onClose();
    } else {
      setError(result.error || 'Failed to update grocery');
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="edit-grocery-modal__backdrop" onClick={handleBackdropClick}>
      <div className="edit-grocery-modal">
        <div className="edit-grocery-modal__header">
          <h2 className="edit-grocery-modal__title">Edit Item</h2>
          <button
            type="button"
            className="edit-grocery-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="edit-grocery-modal__error">{error}</div>}

          <div className="edit-grocery-modal__field">
            <label htmlFor="edit-grocery-name">Name</label>
            <input
              type="text"
              id="edit-grocery-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="edit-grocery-modal__input"
            />
          </div>

          <div className="edit-grocery-modal__field">
            <label htmlFor="edit-grocery-category">Category</label>
            <select
              id="edit-grocery-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="edit-grocery-modal__select"
            >
              <option value="">Select category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="edit-grocery-modal__row">
            <div className="edit-grocery-modal__field">
              <label htmlFor="edit-grocery-quantity">Quantity</label>
              <input
                type="number"
                id="edit-grocery-quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="0.01"
                step="0.01"
                className="edit-grocery-modal__input"
              />
            </div>

            <div className="edit-grocery-modal__field">
              <label htmlFor="edit-grocery-unit">Unit</label>
              <select
                id="edit-grocery-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="edit-grocery-modal__select"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="edit-grocery-modal__field">
            <label htmlFor="edit-grocery-expiry">Expiry Date</label>
            <input
              type="date"
              id="edit-grocery-expiry"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="edit-grocery-modal__input"
            />
          </div>

          <div className="edit-grocery-modal__field">
            <label>Storage Location</label>
            <div className="edit-grocery-modal__storage-buttons">
              {STORAGE_LOCATIONS.map((loc) => (
                <button
                  key={loc.value}
                  type="button"
                  className={`edit-grocery-modal__storage-btn ${storageLocation === loc.value ? 'edit-grocery-modal__storage-btn--active' : ''}`}
                  onClick={() => setStorageLocation(loc.value)}
                >
                  <span className="edit-grocery-modal__storage-icon">{loc.icon}</span>
                  <span className="edit-grocery-modal__storage-label">{loc.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="edit-grocery-modal__actions">
            <button
              type="button"
              className="edit-grocery-modal__btn edit-grocery-modal__btn--cancel"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="edit-grocery-modal__btn edit-grocery-modal__btn--save"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditGroceryModal;
