import { useNavigate } from 'react-router-dom';
import type { MealSlot } from '../../services/mealPlanService';
import type { MealType } from './DayColumn';

export interface MealSlotProps {
  mealType: MealType;
  meal?: MealSlot;
}

const mealTypeLabels: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
};

const MealSlot: React.FC<MealSlotProps> = ({ mealType, meal }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (meal?.recipeId) {
      navigate(`/recipes/${meal.recipeId}`);
    }
  };

  return (
    <div
      className={`meal-slot ${meal ? 'meal-slot--filled' : 'meal-slot--empty'}`}
      onClick={meal ? handleClick : undefined}
      role={meal ? 'button' : undefined}
      tabIndex={meal ? 0 : undefined}
      onKeyDown={(e) => {
        if (meal && (e.key === 'Enter' || e.key === ' ')) {
          handleClick();
        }
      }}
    >
      <span className="meal-slot__type">{mealTypeLabels[mealType]}</span>
      {meal ? (
        <span className="meal-slot__recipe">{meal.recipeName}</span>
      ) : (
        <span className="meal-slot__empty-text">No meal planned</span>
      )}
    </div>
  );
};

export default MealSlot;
