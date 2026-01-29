import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { recipeService } from '../services/recipeService';
import type { Recipe } from '../services/recipeService';
import './RecipeDetail.css';

const RecipeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecipe = async () => {
      if (!id) {
        setError('Recipe not found');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      const response = await recipeService.getRecipe(parseInt(id, 10));

      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setRecipe(response.data);
      } else {
        setError('Recipe not found');
      }

      setIsLoading(false);
    };

    fetchRecipe();
  }, [id]);

  const handleBack = () => {
    navigate('/recipes');
  };

  if (isLoading) {
    return (
      <div className="recipe-detail">
        <div className="recipe-detail__loading">
          <div className="recipe-detail__spinner" />
          <span>Loading recipe...</span>
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="recipe-detail">
        <div className="recipe-detail__error">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p>{error || 'Recipe not found'}</p>
          <button onClick={handleBack}>Back to Recipes</button>
        </div>
      </div>
    );
  }

  return (
    <div className="recipe-detail">
      <button className="recipe-detail__back-btn" onClick={handleBack}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to Recipes
      </button>

      <div className="recipe-detail__header">
        <h1 className="recipe-detail__title">{recipe.name}</h1>
        <div className="recipe-detail__meta">
          <span className="recipe-detail__prep-time">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {recipe.prepTime} min
          </span>
          {recipe.dietaryTags && recipe.dietaryTags.length > 0 && (
            <div className="recipe-detail__tags">
              {recipe.dietaryTags.map((tag) => (
                <span key={tag} className="recipe-detail__tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="recipe-detail__content">
        <section className="recipe-detail__section">
          <h2 className="recipe-detail__section-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="2" />
            </svg>
            Ingredients
          </h2>
          <ul className="recipe-detail__ingredients">
            {recipe.ingredients.map((ingredient, index) => (
              <li key={index} className="recipe-detail__ingredient">
                <span className="recipe-detail__ingredient-amount">{ingredient.amount}</span>
                <span className="recipe-detail__ingredient-name">{ingredient.name}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="recipe-detail__section">
          <h2 className="recipe-detail__section-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            Instructions
          </h2>
          <ol className="recipe-detail__instructions">
            {recipe.instructions.map((instruction, index) => (
              <li key={index} className="recipe-detail__instruction">
                <span className="recipe-detail__step-number">{index + 1}</span>
                <span className="recipe-detail__step-text">{instruction}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
};

export default RecipeDetail;
