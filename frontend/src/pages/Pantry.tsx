import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import { AddGroceryForm, GroceryList } from '../components/Groceries';
import { useGroceries } from '../context/GroceryContext';
import './Pantry.css';

const Pantry: React.FC = () => {
  const navigate = useNavigate();
  const { groceries, loading, error, addGrocery, consumeGrocery, deleteGrocery, fetchGroceries } = useGroceries();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleConsume = async (id: number) => {
    await consumeGrocery(id);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      await deleteGrocery(id);
    }
  };

  return (
    <Layout
      pageTitle="My Pantry"
      activeNavItem="pantry"
      onNavigate={handleNavigate}
    >
      <div className="pantry">
        <div className="pantry__form-section">
          <AddGroceryForm onSubmit={addGrocery} />
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
            />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Pantry;
