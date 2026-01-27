import MealSlotComponent from './MealSlot';
import type { DayMeals, MealSlot, DayName } from '../../services/mealPlanService';

/** Meal type for breakfast, lunch, or dinner */
export type MealType = 'breakfast' | 'lunch' | 'dinner';

export interface DayColumnProps {
  dayName: DayName;
  dayLabel: string;
  date: Date;
  dayMeals: DayMeals;
  isToday?: boolean;
}

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const DayColumn: React.FC<DayColumnProps> = ({ dayLabel, date, dayMeals, isToday = false }) => {
  const getMealByType = (mealType: MealType): MealSlot | null => {
    return dayMeals[mealType];
  };

  return (
    <div className={`day-column ${isToday ? 'day-column--today' : ''}`}>
      <div className="day-column__header">
        <span className="day-column__day-name">{dayLabel}</span>
        <span className="day-column__date">{formatDate(date)}</span>
      </div>
      <div className="day-column__meals">
        <MealSlotComponent mealType="breakfast" meal={getMealByType('breakfast') ?? undefined} />
        <MealSlotComponent mealType="lunch" meal={getMealByType('lunch') ?? undefined} />
        <MealSlotComponent mealType="dinner" meal={getMealByType('dinner') ?? undefined} />
      </div>
    </div>
  );
};

export default DayColumn;
