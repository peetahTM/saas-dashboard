import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { dashboardService } from '../services/dashboardService';
import { getCurrencySymbol } from '../services/preferencesService';
import type { DashboardStats, ExpiringItem, SuggestedRecipe } from '../services/dashboardService';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { preferences } = usePreferences();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [expiringItems, setExpiringItems] = useState<ExpiringItem[]>([]);
  const [suggestedRecipes, setSuggestedRecipes] = useState<SuggestedRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [statsResponse, expiringResponse, recipesResponse] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getExpiringSoon(),
          dashboardService.getSuggestedRecipes()
        ]);

        if (statsResponse.error) {
          setError(statsResponse.error);
        } else if (statsResponse.data) {
          setStats(statsResponse.data);
        }

        if (expiringResponse.data) {
          setExpiringItems(expiringResponse.data);
        }

        if (recipesResponse.data) {
          setSuggestedRecipes(recipesResponse.data);
        }
      } catch (err) {
        setError('Unable to load dashboard data. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAuthenticated]);

  const formatDaysUntilExpiry = (expiryDate: string): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `${diffDays} days`;
  };

  const getExpiryUrgency = (expiryDate: string): 'urgent' | 'warning' | 'normal' => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) return 'urgent';
    if (diffDays <= 3) return 'warning';
    return 'normal';
  };

  const currencySymbol = getCurrencySymbol(preferences?.currency || 'USD');

  const statsCards = stats ? [
    {
      label: 'Expiring Soon',
      value: stats.expiringCount.toString(),
      description: 'Items within 3 days',
      icon: 'clock',
      color: 'warning'
    },
    {
      label: 'Expired This Week',
      value: stats.expiredThisWeek.toString(),
      description: 'Items to review',
      icon: 'alert',
      color: 'danger'
    },
    {
      label: 'Consumed This Month',
      value: stats.consumedCount.toString(),
      description: 'Items saved from waste',
      icon: 'check',
      color: 'success'
    },
    {
      label: 'Potential Savings',
      value: `${currencySymbol}${stats.potentialSavings}`,
      description: 'Estimated money saved',
      icon: 'dollar',
      color: 'primary'
    }
  ] : [];

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard__loading">
          <div className="dashboard__spinner" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  const handleRetry = () => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);

    Promise.all([
      dashboardService.getStats(),
      dashboardService.getExpiringSoon(),
      dashboardService.getSuggestedRecipes()
    ]).then(([statsResponse, expiringResponse, recipesResponse]) => {
      if (statsResponse.error) {
        setError(statsResponse.error);
      } else if (statsResponse.data) {
        setStats(statsResponse.data);
      }

      if (expiringResponse.data) {
        setExpiringItems(expiringResponse.data);
      }

      if (recipesResponse.data) {
        setSuggestedRecipes(recipesResponse.data);
      }
    }).catch(() => {
      setError('Unable to load dashboard data. Please check your connection and try again.');
    }).finally(() => {
      setLoading(false);
    });
  };

  if (error) {
    return (
      <div className="dashboard">
        <div className="dashboard__error">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p>{error}</p>
          <button className="dashboard__retry-btn" onClick={handleRetry}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Stats Cards */}
      <div className="stats-grid">
          {statsCards.map((stat, index) => (
            <div key={index} className={`stat-card stat-card--${stat.color}`}>
              <div className="stat-header">
                <span className="stat-label">{stat.label}</span>
                <div className={`stat-icon stat-icon--${stat.color}`}>
                  {stat.icon === 'clock' && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  )}
                  {stat.icon === 'alert' && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  )}
                  {stat.icon === 'check' && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  )}
                  {stat.icon === 'dollar' && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="1" x2="12" y2="23" />
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  )}
                </div>
              </div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-description">{stat.description}</div>
            </div>
          ))}
        </div>

        {/* Content Grid */}
        <div className="content-grid">
          {/* Expiring Soon Widget */}
          <div className="widget-card expiring-card">
            <div className="card-header">
              <h2 className="card-title">Expiring Soon</h2>
              <button className="card-link" onClick={() => navigate('/pantry')}>
                View all
              </button>
            </div>
            {expiringItems.length === 0 ? (
              <div className="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <p>No items expiring soon!</p>
                <span>Your pantry is looking good</span>
              </div>
            ) : (
              <div className="expiring-list">
                {expiringItems.map((item) => (
                  <div key={item.id} className={`expiring-item expiring-item--${getExpiryUrgency(item.expiryDate)}`}>
                    <div className="expiring-item__info">
                      <span className="expiring-item__name">{item.name}</span>
                      <span className="expiring-item__quantity">
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                    <div className={`expiring-item__badge expiring-item__badge--${getExpiryUrgency(item.expiryDate)}`}>
                      {formatDaysUntilExpiry(item.expiryDate)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Suggested Recipes Widget */}
          <div className="widget-card recipes-card">
            <div className="card-header">
              <h2 className="card-title">Suggested Recipes</h2>
              <button className="card-link" onClick={() => navigate('/recipes')}>
                Browse all
              </button>
            </div>
            {suggestedRecipes.length === 0 ? (
              <div className="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
                <p>No recipe suggestions</p>
                <span>Add items with expiry dates to get suggestions</span>
              </div>
            ) : (
              <div className="recipes-list">
                {suggestedRecipes.map((recipe) => (
                  <div key={recipe.id} className="recipe-item" onClick={() => navigate(`/recipes/${recipe.id}`)}>
                    <div className="recipe-item__header">
                      <span className="recipe-item__name">{recipe.name}</span>
                      <span className="recipe-item__time">{recipe.prepTime} min</span>
                    </div>
                    <div className="recipe-item__match">
                      <span className="recipe-item__match-count">
                        Uses {recipe.matchingIngredientsCount} expiring {recipe.matchingIngredientsCount === 1 ? 'item' : 'items'}
                      </span>
                      <div className="recipe-item__ingredients">
                        {recipe.matchingIngredients.slice(0, 3).map((ing, idx) => (
                          <span key={idx} className="recipe-item__ingredient-tag">{ing}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h2 className="section-title">Quick Actions</h2>
          <div className="actions-grid">
            <button className="action-btn" onClick={() => navigate('/pantry')}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Add Item</span>
            </button>
            <button className="action-btn" onClick={() => navigate('/recipes')}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              <span>Find Recipes</span>
            </button>
            <button className="action-btn" onClick={() => navigate('/meal-plans')}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>Meal Plan</span>
            </button>
            <button className="action-btn" onClick={() => navigate('/settings')}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <span>Settings</span>
            </button>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
