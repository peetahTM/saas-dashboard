import { useState } from 'react';
import { AddGroceryForm, GroceryList } from '../components/Groceries';
import { ReceiptScanner } from '../components/Receipt';
import { useGroceries } from '../context/GroceryContext';
import './Pantry.css';

const Pantry: React.FC = () => {
  const { groceries, loading, error, addGrocery, updateGrocery, consumeGrocery, deleteGrocery, fetchGroceries } = useGroceries();
  const [showReceiptScanner, setShowReceiptScanner] = useState(false);

  const handleConsume = async (id: number) => {
    await consumeGrocery(id);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      await deleteGrocery(id);
    }
  };

  const handleReceiptItemsAdded = () => {
    fetchGroceries();
  };

  return (
    <>
      <div className="pantry">
        <div className="pantry__form-section">
          <div className="pantry__form-header">
            <AddGroceryForm onSubmit={addGrocery} />
            <button
              className="pantry__scan-btn"
              onClick={() => setShowReceiptScanner(true)}
              title="Scan receipt"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <line x1="7" y1="8" x2="17" y2="8" />
                <line x1="7" y1="12" x2="14" y2="12" />
                <line x1="7" y1="16" x2="11" y2="16" />
              </svg>
              Scan Receipt
            </button>
          </div>
        </div>

        <div className="pantry__list-section">
          {loading && (
            <div className="pantry__loading">
              <div className="pantry__spinner" />
              <span>Loading groceries...</span>
            </div>
          )}

          {error && (
            <div className="pantry__error">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p>{error}</p>
              <button className="pantry__retry-btn" onClick={fetchGroceries}>
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && (
            <GroceryList
              groceries={groceries}
              onConsume={handleConsume}
              onDelete={handleDelete}
              onUpdate={updateGrocery}
            />
          )}
        </div>
      </div>

      {showReceiptScanner && (
        <div className="receipt-modal-overlay">
          <ReceiptScanner
            onItemsAdded={handleReceiptItemsAdded}
            onClose={() => setShowReceiptScanner(false)}
          />
        </div>
      )}
    </>
  );
};

export default Pantry;
