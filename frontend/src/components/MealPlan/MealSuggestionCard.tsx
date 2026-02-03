import type { AIMealSuggestion } from '../../services/aiService';

export interface MealSuggestionCardProps {
  suggestion: AIMealSuggestion;
  mealType: 'breakfast' | 'lunch' | 'dinner';
  day: string;
  onAddToPlan?: () => void;
}

const MealSuggestionCard: React.FC<MealSuggestionCardProps> = ({
  suggestion,
  mealType,
  day,
  onAddToPlan,
}) => {
  const getMealTypeIcon = () => {
    switch (mealType) {
      case 'breakfast':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
            <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
            <line x1="6" y1="1" x2="6" y2="4" />
            <line x1="10" y1="1" x2="10" y2="4" />
            <line x1="14" y1="1" x2="14" y2="4" />
          </svg>
        );
      case 'lunch':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        );
      case 'dinner':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
            <path d="M7 2v20" />
            <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
          </svg>
        );
    }
  };

  return (
    <div className="meal-suggestion-card">
      <div className="meal-suggestion-card__header">
        <div className="meal-suggestion-card__meta">
          <span className="meal-suggestion-card__meal-type">
            {getMealTypeIcon()}
            {mealType}
          </span>
          <span className="meal-suggestion-card__day">{day}</span>
        </div>
        <span className="meal-suggestion-card__ai-badge">AI</span>
      </div>

      <h4 className="meal-suggestion-card__name">{suggestion.recipeName}</h4>

      {suggestion.description && (
        <p className="meal-suggestion-card__description">{suggestion.description}</p>
      )}

      <div className="meal-suggestion-card__details">
        <div className="meal-suggestion-card__prep-time">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {suggestion.prepTime} min
        </div>

        {suggestion.ingredients.length > 0 && (
          <div className="meal-suggestion-card__ingredients">
            <span className="meal-suggestion-card__ingredients-label">Ingredients:</span>
            <span className="meal-suggestion-card__ingredients-list">
              {suggestion.ingredients.slice(0, 4).join(', ')}
              {suggestion.ingredients.length > 4 && ` +${suggestion.ingredients.length - 4} more`}
            </span>
          </div>
        )}

        {suggestion.usesExpiring.length > 0 && (
          <div className="meal-suggestion-card__expiring">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Uses: {suggestion.usesExpiring.join(', ')}
          </div>
        )}
      </div>

      {onAddToPlan && (
        <button className="meal-suggestion-card__add-btn" onClick={onAddToPlan}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add to Plan
        </button>
      )}
    </div>
  );
};

export default MealSuggestionCard;
