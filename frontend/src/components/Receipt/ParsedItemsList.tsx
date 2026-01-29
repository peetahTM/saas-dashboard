import { useState } from 'react';
import type { ParsedItem } from '../../services/receiptService';
import type { StorageLocation } from '../../services/groceryService';
import { getDefaultStorageLocation } from '../../services/groceryService';
import StorageLocationBadge from '../Groceries/StorageLocationBadge';

interface ParsedItemsListProps {
  items: ParsedItem[];
  onChange: (items: ParsedItem[]) => void;
  highlightedIndex?: number | null;
  onItemHover?: (index: number | null) => void;
  onItemClick?: (index: number) => void;
}

const CATEGORIES = [
  'produce',
  'dairy',
  'meat',
  'bakery',
  'pantry',
  'frozen',
  'beverages',
  'snacks',
  'other',
];

const STORAGE_LOCATIONS: { value: StorageLocation; label: string }[] = [
  { value: 'fridge', label: 'Fridge' },
  { value: 'freezer', label: 'Freezer' },
  { value: 'pantry', label: 'Pantry' },
];

const ParsedItemsList: React.FC<ParsedItemsListProps> = ({
  items,
  onChange,
  highlightedIndex,
  onItemHover,
  onItemClick,
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleItemChange = (index: number, field: keyof ParsedItem, value: string | number) => {
    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };
    // Auto-update storage location when category changes
    if (field === 'category') {
      updatedItems[index].storageLocation = getDefaultStorageLocation(value as string);
    }
    onChange(updatedItems);
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    onChange(updatedItems);
  };

  const handleAddItem = () => {
    const today = new Date();
    today.setDate(today.getDate() + 7);

    const newItem: ParsedItem = {
      name: '',
      category: 'other',
      quantity: 1,
      unit: 'each',
      expiryDate: today.toISOString().split('T')[0],
      storageLocation: 'pantry',
    };

    onChange([...items, newItem]);
    setEditingIndex(items.length);
  };

  if (items.length === 0) {
    return (
      <div className="parsed-items-list parsed-items-list--empty">
        <p>No items were detected in the receipt.</p>
        <button className="parsed-items-list__add-btn" onClick={handleAddItem}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Item Manually
        </button>
      </div>
    );
  }

  return (
    <div className="parsed-items-list">
      <div className="parsed-items-list__items">
        {items.map((item, index) => (
          <div
            key={index}
            className={`parsed-items-list__item ${highlightedIndex === index ? 'parsed-items-list__item--highlighted' : ''}`}
            onMouseEnter={() => onItemHover?.(index)}
            onMouseLeave={() => onItemHover?.(null)}
          >
            {editingIndex === index ? (
              <div className="parsed-items-list__item-edit">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                  placeholder="Item name"
                  className="parsed-items-list__input"
                  autoFocus
                />
                <div className="parsed-items-list__item-row">
                  <select
                    value={item.category}
                    onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                    className="parsed-items-list__select"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 1)}
                    min="0.1"
                    step="0.1"
                    className="parsed-items-list__input parsed-items-list__input--small"
                  />
                  <input
                    type="text"
                    value={item.unit}
                    onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                    placeholder="unit"
                    className="parsed-items-list__input parsed-items-list__input--small"
                  />
                </div>
                <div className="parsed-items-list__item-row">
                  <label className="parsed-items-list__label">Expires:</label>
                  <input
                    type="date"
                    value={item.expiryDate}
                    onChange={(e) => handleItemChange(index, 'expiryDate', e.target.value)}
                    className="parsed-items-list__input"
                  />
                </div>
                <div className="parsed-items-list__item-row">
                  <label className="parsed-items-list__label">Storage:</label>
                  <select
                    value={item.storageLocation || 'pantry'}
                    onChange={(e) => handleItemChange(index, 'storageLocation', e.target.value)}
                    className="parsed-items-list__select"
                  >
                    {STORAGE_LOCATIONS.map((loc) => (
                      <option key={loc.value} value={loc.value}>
                        {loc.label}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  className="parsed-items-list__done-btn"
                  onClick={() => setEditingIndex(null)}
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="parsed-items-list__item-view">
                <div
                  className="parsed-items-list__item-info"
                  onClick={() => onItemClick?.(index)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      onItemClick?.(index);
                    }
                  }}
                >
                  <span className="parsed-items-list__item-name">{item.name || '(unnamed)'}</span>
                  <span className="parsed-items-list__item-details">
                    {item.quantity} {item.unit} &middot; {item.category} &middot; Exp: {item.expiryDate}
                  </span>
                  <StorageLocationBadge location={item.storageLocation || 'pantry'} size="small" />
                </div>
                <div className="parsed-items-list__item-actions">
                  <button
                    className="parsed-items-list__edit-btn"
                    onClick={() => setEditingIndex(index)}
                    title="Edit item"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    className="parsed-items-list__remove-btn"
                    onClick={() => handleRemoveItem(index)}
                    title="Remove item"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <button className="parsed-items-list__add-btn" onClick={handleAddItem}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add Item
      </button>
    </div>
  );
};

export default ParsedItemsList;
