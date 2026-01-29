import type { Recipe } from '../../services/recipeService';

interface RecipeCardProps {
  recipe: Recipe;
  onClick: (id: number) => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onClick }) => {
  return (
    <div className="recipe-card" onClick={() => onClick(recipe.id)}>
      <div className="recipe-card__content">
        <h3 className="recipe-card__name">{recipe.name}</h3>
        <div className="recipe-card__meta">
          <span className="recipe-card__prep-time">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {recipe.prepTime} min
          </span>
          <span className="recipe-card__ingredients">
            {recipe.ingredients.length} ingredients
          </span>
        </div>
        {recipe.dietaryTags && recipe.dietaryTags.length > 0 && (
          <div className="recipe-card__tags">
            {recipe.dietaryTags.slice(0, 3).map((tag) => (
              <span key={tag} className="recipe-card__tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipeCard;
