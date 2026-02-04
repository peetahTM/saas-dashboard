import { useNavigate } from 'react-router-dom';
import type { MealSlot, MealType } from '../../services/mealPlanService';

export interface MealSlotProps {
  mealType: MealType;
  meal?: MealSlot;
  onAIMealClick?: (meal: MealSlot) => void;
}

const mealTypeLabels: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
};

const MealSlotComponent: React.FC<MealSlotProps> = ({ mealType, meal, onAIMealClick }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (!meal) return;

    if (meal.isAISuggestion && onAIMealClick) {
      onAIMealClick(meal);
    } else if (meal.recipeId) {
      navigate(`/recipes/${meal.recipeId}`);
    }
  };

  const isClickable = meal && (meal.recipeId || (meal.isAISuggestion && onAIMealClick));

  return (
    <div
      className={`meal-slot ${meal ? 'meal-slot--filled' : 'meal-slot--empty'} ${meal?.isAISuggestion ? 'meal-slot--ai' : ''}`}
      onClick={isClickable ? handleClick : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={(e) => {
        if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
          handleClick();
        }
      }}
    >
      <div className="meal-slot__header">
        <span className="meal-slot__type">{mealTypeLabels[mealType]}</span>
        {meal?.isAISuggestion && <span className="meal-slot__ai-badge">AI</span>}
      </div>
      {meal ? (
        <span className="meal-slot__recipe">{meal.recipeName}</span>
      ) : (
        <span className="meal-slot__empty-text">No meal planned</span>
      )}
    </div>
  );
};

export default MealSlotComponent;
