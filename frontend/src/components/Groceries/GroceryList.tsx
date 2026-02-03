import { useMemo, useState } from 'react';
import type { Grocery, UpdateGroceryData } from '../../services/groceryService';
import GroceryItem from './GroceryItem';

interface GroceryListProps {
  groceries: Grocery[];
  onConsume: (id: number) => void;
  onDelete: (id: number) => void;
  onUpdate: (id: number, data: UpdateGroceryData) => Promise<{ success: boolean; error?: string }>;
}

type SortOption = 'expiry' | 'category' | 'name';

const GroceryList: React.FC<GroceryListProps> = ({ groceries, onConsume, onDelete, onUpdate }) => {
  const [sortBy, setSortBy] = useState<SortOption>('expiry');
  const [showConsumed, setShowConsumed] = useState(false);

  const filteredGroceries = useMemo(() => {
    return showConsumed ? groceries : groceries.filter((g) => !g.isConsumed);
  }, [groceries, showConsumed]);

  const sortedGroceries = useMemo(() => {
    const sorted = [...filteredGroceries];

    switch (sortBy) {
      case 'expiry':
        return sorted.sort((a, b) => {
          if (a.isConsumed !== b.isConsumed) {
            return a.isConsumed ? 1 : -1;
          }
          return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
        });
      case 'category':
        return sorted.sort((a, b) => {
          if (a.isConsumed !== b.isConsumed) {
            return a.isConsumed ? 1 : -1;
          }
          return a.category.localeCompare(b.category);
        });
      case 'name':
        return sorted.sort((a, b) => {
          if (a.isConsumed !== b.isConsumed) {
            return a.isConsumed ? 1 : -1;
          }
          return a.name.localeCompare(b.name);
        });
      default:
        return sorted;
    }
  }, [filteredGroceries, sortBy]);

  const groupedGroceries = useMemo(() => {
    if (sortBy !== 'category') return null;

    const groups: Record<string, Grocery[]> = {};
    sortedGroceries.forEach((grocery) => {
      if (!groups[grocery.category]) {
        groups[grocery.category] = [];
      }
      groups[grocery.category].push(grocery);
    });

    return groups;
  }, [sortedGroceries, sortBy]);

  if (groceries.length === 0) {
    return (
      <div className="grocery-list__empty">
        <div className="grocery-list__empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
        </div>
        <h3 className="grocery-list__empty-title">Your pantry is empty</h3>
        <p className="grocery-list__empty-text">Add your first grocery item to start tracking expiration dates!</p>
      </div>
    );
  }

  return (
    <div className="grocery-list">
      <div className="grocery-list__controls">
        <div className="grocery-list__sort">
          <label htmlFor="sort-select">Sort by:</label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="grocery-list__sort-select"
          >
            <option value="expiry">Expiry Date</option>
            <option value="category">Category</option>
            <option value="name">Name</option>
          </select>
        </div>
        <label className="grocery-list__filter">
          <input
            type="checkbox"
            checked={showConsumed}
            onChange={(e) => setShowConsumed(e.target.checked)}
          />
          <span>Show consumed items</span>
        </label>
      </div>

      {sortBy === 'category' && groupedGroceries ? (
        <div className="grocery-list__grouped">
          {Object.entries(groupedGroceries).map(([category, items]) => (
            <div key={category} className="grocery-list__group">
              <h3 className="grocery-list__group-title">{category}</h3>
              <div className="grocery-list__items">
                {items.map((grocery) => (
                  <GroceryItem
                    key={grocery.id}
                    grocery={grocery}
                    onConsume={onConsume}
                    onDelete={onDelete}
                    onUpdate={onUpdate}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grocery-list__items">
          {sortedGroceries.map((grocery) => (
            <GroceryItem
              key={grocery.id}
              grocery={grocery}
              onConsume={onConsume}
              onDelete={onDelete}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default GroceryList;
