import { api } from './api';
import type { ApiResponse } from './api';

/** A single meal slot containing recipe information */
export interface MealSlot {
  recipeId?: number;
  recipeName: string;
  prepTime?: number;
  usesExpiring?: string[];
  /** For AI-generated meals without a recipe */
  description?: string;
  ingredients?: string[];
  isAISuggestion?: boolean;
}

/** Structure for a single day's meals */
export interface DayMeals {
  breakfast: MealSlot | null;
  lunch: MealSlot | null;
  dinner: MealSlot | null;
}

/** Day name type for type-safe day access */
export type DayName = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

/** Meal type for breakfast, lunch, or dinner */
export type MealType = 'breakfast' | 'lunch' | 'dinner';

/** Weekly meals structure keyed by day name */
export type WeeklyMeals = Record<DayName, DayMeals>;

/** Meal plan with weekly meals */
export interface MealPlan {
  id: number;
  weekStart: string;
  meals: WeeklyMeals;
}

interface MealPlansResponse {
  mealPlans: MealPlan[];
}

interface MealPlanResponse {
  mealPlan: MealPlan;
  message?: string;
}

class MealPlanService {
  async getMealPlans(): Promise<ApiResponse<MealPlan[]>> {
    const response = await api.request<MealPlansResponse>('/api/meal-plans');
    if (response.error) {
      return { error: response.error };
    }
    return { data: response.data?.mealPlans ?? [] };
  }

  async generateMealPlan(): Promise<ApiResponse<MealPlan>> {
    const response = await api.request<MealPlanResponse>('/api/meal-plans/generate', {
      method: 'POST',
    });
    if (response.error) {
      return { error: response.error };
    }
    if (response.data?.mealPlan) {
      return { data: response.data.mealPlan };
    }
    return { error: 'No meal plan returned' };
  }

  async updateMealPlan(id: number, meals: WeeklyMeals): Promise<ApiResponse<MealPlan>> {
    const response = await api.request<MealPlanResponse>(`/api/meal-plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ meals }),
    });
    if (response.error) {
      return { error: response.error };
    }
    if (response.data?.mealPlan) {
      return { data: response.data.mealPlan };
    }
    return { error: 'No meal plan returned' };
  }
}

export const mealPlanService = new MealPlanService();
