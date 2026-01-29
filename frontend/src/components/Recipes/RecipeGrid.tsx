import type { Recipe, RecipeSuggestion } from '../../services/recipeService';
import RecipeCard from './RecipeCard';

interface RecipeGridProps {
  recipes: (Recipe | RecipeSuggestion)[];
  isLoading: boolean;
  emptyMessage: string;
  onRecipeClick: (id: number) => void;
}

const RecipeGrid: React.FC<RecipeGridProps> = ({
  recipes,
  isLoading,
  emptyMessage,
  onRecipeClick,
}) => {
  if (isLoading) {
    return (
      <div className="recipe-grid__loading">
        <div className="recipe-grid__spinner" />
        <span>Loading recipes...</span>
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="recipe-grid__empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="recipe-grid">
      {recipes.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} onClick={onRecipeClick} />
      ))}
    </div>
  );
};

export default RecipeGrid;
