import { useState } from 'react';
import type { Grocery, UpdateGroceryData } from '../../services/groceryService';
import ExpiryBadge from './ExpiryBadge';
import StorageLocationBadge from './StorageLocationBadge';
import EditGroceryModal from './EditGroceryModal';

interface GroceryItemProps {
  grocery: Grocery;
  onConsume: (id: number) => void;
  onDelete: (id: number) => void;
  onUpdate: (id: number, data: UpdateGroceryData) => Promise<{ success: boolean; error?: string }>;
}

const GroceryItem: React.FC<GroceryItemProps> = ({ grocery, onConsume, onDelete, onUpdate }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { id, name, category, quantity, unit, expiryDate, isConsumed, storageLocation } = grocery;

  return (
    <>
      <div className={`grocery-item ${isConsumed ? 'grocery-item--consumed' : ''}`}>
        <div className="grocery-item__info">
          <div className="grocery-item__header">
            <h3 className="grocery-item__name">{name}</h3>
            <span className="grocery-item__category">{category}</span>
          </div>
          <div className="grocery-item__details">
            <span className="grocery-item__quantity">
              {quantity} {unit}
            </span>
            <StorageLocationBadge location={storageLocation} size="small" />
            {!isConsumed && <ExpiryBadge expiryDate={expiryDate} />}
            {isConsumed && <span className="grocery-item__consumed-badge">Consumed</span>}
          </div>
        </div>
        <div className="grocery-item__actions">
          {!isConsumed && (
            <>
              <button
                className="grocery-item__btn grocery-item__btn--edit"
                onClick={() => setIsEditModalOpen(true)}
                title="Edit item"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <button
                className="grocery-item__btn grocery-item__btn--consume"
                onClick={() => onConsume(id)}
                title="Mark as consumed"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>
            </>
          )}
          <button
            className="grocery-item__btn grocery-item__btn--delete"
            onClick={() => onDelete(id)}
            title="Delete item"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
        </div>
      </div>

      {isEditModalOpen && (
        <EditGroceryModal
          grocery={grocery}
          onSave={onUpdate}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
    </>
  );
};

export default GroceryItem;
