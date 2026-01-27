import DayColumn from './DayColumn';
import type { MealPlan, DayMeals, DayName } from '../../services/mealPlanService';

export interface WeeklyCalendarProps {
  mealPlans: MealPlan[];
  currentPlanIndex: number;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
}

const DAYS_OF_WEEK: DayName[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const DAY_LABELS: Record<DayName, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

const getDateForDay = (weekStart: string, dayIndex: number): Date => {
  const date = new Date(weekStart);
  date.setDate(date.getDate() + dayIndex);
  return date;
};

const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
};

const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({
  mealPlans,
  currentPlanIndex,
  onPreviousWeek,
  onNextWeek,
}) => {
  const currentPlan = mealPlans[currentPlanIndex];
  const hasPreviousWeek = currentPlanIndex > 0;
  const hasNextWeek = currentPlanIndex < mealPlans.length - 1;

  if (!currentPlan) {
    return null;
  }

  return (
    <div className="weekly-calendar">
      <div className="weekly-calendar__navigation">
        <button
          className="weekly-calendar__nav-btn"
          onClick={onPreviousWeek}
          disabled={!hasPreviousWeek}
          aria-label="Previous week"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="weekly-calendar__week-label">
          Week of {new Date(currentPlan.weekStart).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
        <button
          className="weekly-calendar__nav-btn"
          onClick={onNextWeek}
          disabled={!hasNextWeek}
          aria-label="Next week"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
      <div className="weekly-calendar__grid">
        {DAYS_OF_WEEK.map((dayName, index) => {
          const dayMeals: DayMeals = currentPlan.meals[dayName];
          const date = getDateForDay(currentPlan.weekStart, index);
          return (
            <DayColumn
              key={dayName}
              dayName={dayName}
              dayLabel={DAY_LABELS[dayName]}
              date={date}
              dayMeals={dayMeals}
              isToday={isToday(date)}
            />
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyCalendar;
