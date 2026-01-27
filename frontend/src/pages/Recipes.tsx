import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import { RecipeGrid, RecipeFilters } from '../components/Recipes';
import { recipeService } from '../services/recipeService';
import type { Recipe, RecipeSuggestion } from '../services/recipeService';
import './Recipes.css';

const Recipes: React.FC = () => {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [suggestions, setSuggestions] = useState<RecipeSuggestion[]>([]);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(true);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      setIsLoadingSuggestions(true);
      const response = await recipeService.getRecipeSuggestions();
      if (response.error) {
        console.error('Failed to fetch suggestions:', response.error);
      } else if (response.data) {
        setSuggestions(response.data);
      }
      setIsLoadingSuggestions(false);
    };

    fetchSuggestions();
  }, []);

  useEffect(() => {
    const fetchRecipes = async () => {
      setIsLoadingRecipes(true);
      setError(null);

      const filters = activeFilter ? { dietary: activeFilter } : undefined;
      const response = await recipeService.getRecipes(filters);

      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setRecipes(response.data);
      }
      setIsLoadingRecipes(false);
    };

    fetchRecipes();
  }, [activeFilter]);

  const handleRecipeClick = (recipeId: number) => {
    navigate(`/recipes/${recipeId}`);
  };

  const handleFilterChange = (filter: string | null) => {
    setActiveFilter(filter);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <Layout pageTitle="Recipes" activeNavItem="recipes" onNavigate={handleNavigate}>
      <div className="recipes-page">
        {/* Suggestions Section */}
        {!isLoadingSuggestions && suggestions.length > 0 && (
          <section className="recipes-suggestions-section">
            <h2 className="recipes-section-title">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 2v4" />
                <path d="M12 18v4" />
                <path d="m4.93 4.93 2.83 2.83" />
                <path d="m16.24 16.24 2.83 2.83" />
                <path d="M2 12h4" />
                <path d="M18 12h4" />
                <path d="m4.93 19.07 2.83-2.83" />
                <path d="m16.24 7.76 2.83-2.83" />
              </svg>
              Suggested for Expiring Items
            </h2>
            <RecipeGrid
              recipes={suggestions}
              isLoading={false}
              emptyMessage="No suggestions available"
              onRecipeClick={handleRecipeClick}
            />
          </section>
        )}

        {/* All Recipes Section */}
        <section className="recipes-all-section">
          <div className="recipes-section-header">
            <h2 className="recipes-section-title">All Recipes</h2>
          </div>

          <RecipeFilters
            activeFilter={activeFilter}
            onFilterChange={handleFilterChange}
          />

          {error ? (
            <div className="recipes-error">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p>{error}</p>
              <button onClick={() => setActiveFilter(activeFilter)}>
                Try Again
              </button>
            </div>
          ) : (
            <RecipeGrid
              recipes={recipes}
              isLoading={isLoadingRecipes}
              emptyMessage={
                activeFilter
                  ? `No ${activeFilter} recipes found`
                  : 'No recipes available'
              }
              onRecipeClick={handleRecipeClick}
            />
          )}
        </section>
      </div>
    </Layout>
  );
};

export default Recipes;
