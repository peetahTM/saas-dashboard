import { useState, useEffect } from 'react';
import { WeeklyCalendar, GeneratePlanButton } from '../components/MealPlan';
import { mealPlanService } from '../services/mealPlanService';
import type { MealPlan as MealPlanType } from '../services/mealPlanService';
import './MealPlan.css';

const MealPlan: React.FC = () => {
  const [mealPlans, setMealPlans] = useState<MealPlanType[]>([]);
  const [currentPlanIndex, setCurrentPlanIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMealPlans = async () => {
    setIsLoading(true);
    setError(null);

    const response = await mealPlanService.getMealPlans();

    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setMealPlans(response.data);
      // Set current index to the latest plan (last in the array)
      if (response.data.length > 0) {
        setCurrentPlanIndex(response.data.length - 1);
      }
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchMealPlans();
  }, []);

  const handleGeneratePlan = async () => {
    const response = await mealPlanService.generateMealPlan();

    if (response.error) {
      throw new Error(response.error);
    }

    if (response.data) {
      setMealPlans((prev) => [...prev, response.data!]);
      setCurrentPlanIndex(mealPlans.length);
    }
  };

  const handlePreviousWeek = () => {
    if (currentPlanIndex > 0) {
      setCurrentPlanIndex((prev) => prev - 1);
    }
  };

  const handleNextWeek = () => {
    if (currentPlanIndex < mealPlans.length - 1) {
      setCurrentPlanIndex((prev) => prev + 1);
    }
  };

  return (
    <div className="meal-plan-page">
        <div className="meal-plan-page__header">
          <div className="meal-plan-page__header-content">
            <GeneratePlanButton onGenerate={handleGeneratePlan} />
            <p className="meal-plan-page__info">
              Generate a meal plan based on your expiring groceries and preferences
            </p>
          </div>
        </div>

        <div className="meal-plan-page__content">
          {isLoading ? (
            <div className="meal-plan-page__loading">
              <div className="meal-plan-page__loading-spinner" />
              <span>Loading meal plans...</span>
            </div>
          ) : error ? (
            <div className="meal-plan-page__error">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p>{error}</p>
              <button className="meal-plan-page__retry-btn" onClick={fetchMealPlans}>
                Try Again
              </button>
            </div>
          ) : mealPlans.length === 0 ? (
            <div className="meal-plan-page__empty">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <h3>No meal plan for this week</h3>
              <p>Generate one based on your preferences and expiring groceries!</p>
            </div>
          ) : (
            <WeeklyCalendar
              mealPlans={mealPlans}
              currentPlanIndex={currentPlanIndex}
              onPreviousWeek={handlePreviousWeek}
              onNextWeek={handleNextWeek}
            />
          )}
      </div>
    </div>
  );
};

export default MealPlan;
