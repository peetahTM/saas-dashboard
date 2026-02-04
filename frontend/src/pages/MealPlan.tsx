import { useState, useEffect } from 'react';
import { WeeklyCalendar, GeneratePlanButton, MealSuggestionCard } from '../components/MealPlan';
import { mealPlanService } from '../services/mealPlanService';
import { aiService } from '../services/aiService';
import type { MealPlan as MealPlanType, MealSlot, MealType, WeeklyMeals } from '../services/mealPlanService';
import type { AIMealPlan, AIMealSuggestion, DayName } from '../services/aiService';
import './MealPlan.css';

const DAYS: DayName[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'] as const;

const MealPlan: React.FC = () => {
  const [mealPlans, setMealPlans] = useState<MealPlanType[]>([]);
  const [currentPlanIndex, setCurrentPlanIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // AI state
  const [aiSuggestions, setAISuggestions] = useState<AIMealPlan | null>(null);
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiError, setAIError] = useState<string | null>(null);
  const [isSavingAI, setIsSavingAI] = useState(false);

  const fetchMealPlans = async () => {
    setIsLoading(true);
    setError(null);

    const response = await mealPlanService.getMealPlans();

    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setMealPlans(response.data);
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

  const handleGenerateAIPlan = async () => {
    setIsAILoading(true);
    setAIError(null);

    const response = await aiService.generateMealPlan();

    if (response.error) {
      setAIError(response.error);
    } else if (response.data) {
      setAISuggestions(response.data);
    }

    setIsAILoading(false);
  };

  const handleCloseAISuggestions = () => {
    setAISuggestions(null);
    setAIError(null);
  };

  const convertToMealSlot = (suggestion: AIMealSuggestion): MealSlot => ({
    recipeName: suggestion.recipeName,
    description: suggestion.description,
    prepTime: suggestion.prepTime,
    ingredients: suggestion.ingredients,
    usesExpiring: suggestion.usesExpiring,
    isAISuggestion: true,
  });

  const handleAddAIMealToPlan = async (
    day: DayName,
    mealType: MealType,
    suggestion: AIMealSuggestion
  ) => {
    const currentPlan = mealPlans[currentPlanIndex];
    const mealSlot = convertToMealSlot(suggestion);
    const updatedMeals = {
      ...currentPlan.meals,
      [day]: { ...currentPlan.meals[day], [mealType]: mealSlot },
    };
    const response = await mealPlanService.updateMealPlan(currentPlan.id, updatedMeals);
    if (response.data) {
      setMealPlans(prev => prev.map((p, i) => i === currentPlanIndex ? response.data! : p));
    }
  };

  const handleSaveAllAISuggestions = async () => {
    if (!aiSuggestions) return;
    setIsSavingAI(true);
    setAIError(null);

    // Convert all AI meals to WeeklyMeals format
    const meals: WeeklyMeals = {} as WeeklyMeals;
    for (const day of DAYS) {
      const dayMeals = aiSuggestions.meals[day];
      meals[day] = {
        breakfast: dayMeals?.breakfast ? convertToMealSlot(dayMeals.breakfast) : null,
        lunch: dayMeals?.lunch ? convertToMealSlot(dayMeals.lunch) : null,
        dinner: dayMeals?.dinner ? convertToMealSlot(dayMeals.dinner) : null,
      };
    }

    const response = await aiService.saveAIMealPlan(meals);
    if (response.error) {
      setAIError(response.error);
      setIsSavingAI(false);
      return;
    }

    if (response.data) {
      const savedPlan = response.data;
      // Update mealPlans state - find existing plan for this week or add new
      setMealPlans(prev => {
        const existingIndex = prev.findIndex(p => p.weekStart === savedPlan.weekStart);
        if (existingIndex >= 0) {
          setCurrentPlanIndex(existingIndex);
          return prev.map((p, i) => i === existingIndex ? savedPlan : p);
        } else {
          setCurrentPlanIndex(prev.length);
          return [...prev, savedPlan];
        }
      });
      // Close suggestions panel on success
      handleCloseAISuggestions();
    }

    setIsSavingAI(false);
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

  // Flatten AI suggestions into a list for display
  const flattenedSuggestions: { day: DayName; mealType: typeof MEAL_TYPES[number]; suggestion: AIMealSuggestion }[] = [];
  if (aiSuggestions?.meals) {
    for (const day of DAYS) {
      const dayMeals = aiSuggestions.meals[day];
      if (dayMeals) {
        for (const mealType of MEAL_TYPES) {
          const suggestion = dayMeals[mealType];
          if (suggestion) {
            flattenedSuggestions.push({ day, mealType, suggestion });
          }
        }
      }
    }
  }

  return (
    <div className="meal-plan-page">
      <div className="meal-plan-page__header">
        <div className="meal-plan-page__header-content">
          <div className="generate-plan-button-container">
            <GeneratePlanButton onGenerate={handleGeneratePlan} />
            <button
              className="generate-ai-button"
              onClick={handleGenerateAIPlan}
              disabled={isAILoading}
            >
              {isAILoading ? (
                <>
                  <svg
                    className="generate-ai-button__spinner"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                  </svg>
                  <span>Generating with AI...</span>
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span>Generate with AI</span>
                </>
              )}
            </button>
          </div>
          <p className="meal-plan-page__info">
            Generate a meal plan based on your expiring groceries and preferences
          </p>
        </div>
      </div>

      {(aiSuggestions || isAILoading || aiError) && (
        <div className="meal-plan-page__content ai-suggestions">
          <div className="ai-suggestions__header">
            <h3 className="ai-suggestions__title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              AI Meal Suggestions
            </h3>
            {!isAILoading && (
              <button className="ai-suggestions__close-btn" onClick={handleCloseAISuggestions}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          {isAILoading && (
            <div className="ai-suggestions__loading">
              <div className="ai-suggestions__loading-spinner" />
              <span className="ai-suggestions__loading-text">
                Analyzing your pantry and generating personalized meal suggestions...
              </span>
            </div>
          )}

          {aiError && (
            <div className="ai-suggestions__error">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="ai-suggestions__error-text">{aiError}</p>
              <button className="meal-plan-page__retry-btn" onClick={handleGenerateAIPlan}>
                Try Again
              </button>
            </div>
          )}

          {aiSuggestions && !isAILoading && (
            <>
              {aiSuggestions.tips.length > 0 && (
                <div className="ai-suggestions__tips">
                  <h4 className="ai-suggestions__tips-title">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    Tips from AI
                  </h4>
                  <ul className="ai-suggestions__tips-list">
                    {aiSuggestions.tips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {aiSuggestions.shoppingList.length > 0 && (
                <div className="ai-suggestions__shopping">
                  <h4 className="ai-suggestions__shopping-title">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="9" cy="21" r="1" />
                      <circle cx="20" cy="21" r="1" />
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                    </svg>
                    Suggested Shopping Items
                  </h4>
                  <div className="ai-suggestions__shopping-items">
                    {aiSuggestions.shoppingList.map((item, idx) => (
                      <span key={idx} className="ai-suggestions__shopping-item">{item}</span>
                    ))}
                  </div>
                </div>
              )}

              <button
                className="ai-suggestions__save-all-btn"
                onClick={handleSaveAllAISuggestions}
                disabled={isSavingAI}
              >
                {isSavingAI ? 'Saving...' : 'Save All to Meal Plan'}
              </button>

              <div className="ai-suggestions__meals">
                {flattenedSuggestions.map(({ day, mealType, suggestion }, idx) => (
                  <MealSuggestionCard
                    key={`${day}-${mealType}-${idx}`}
                    suggestion={suggestion}
                    mealType={mealType}
                    day={day}
                    onAddToPlan={handleAddAIMealToPlan}
                    hasMealPlan={mealPlans.length > 0}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

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
