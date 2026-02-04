import { api } from './api';
import type { ApiResponse } from './api';
import type { MealPlan, WeeklyMeals } from './mealPlanService';

/** AI-generated meal suggestion */
export interface AIMealSuggestion {
  recipeName: string;
  description: string;
  ingredients: string[];
  prepTime: number;
  usesExpiring: string[];
  isAISuggestion: boolean;
}

/** Day meals structure for AI suggestions */
export interface AIDayMeals {
  breakfast: AIMealSuggestion | null;
  lunch: AIMealSuggestion | null;
  dinner: AIMealSuggestion | null;
}

/** Day name type */
export type DayName = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

/** AI-generated meal plan */
export interface AIMealPlan {
  meals: Record<DayName, AIDayMeals>;
  tips: string[];
  shoppingList: string[];
  expiringItemsUsed: string[];
  generatedAt: string;
}

/** AI status response */
export interface AIStatus {
  available: boolean;
  model: string;
}

/** Response from generate endpoint */
interface GenerateMealPlanResponse {
  message: string;
  mealPlan: AIMealPlan;
}

/** Response from status endpoint */
interface StatusResponse {
  available: boolean;
  model: string;
}

/** Response from save meal plan endpoint */
interface SaveMealPlanResponse {
  message: string;
  mealPlan: MealPlan;
}

class AIService {
  /**
   * Generate a meal plan using AI
   */
  async generateMealPlan(): Promise<ApiResponse<AIMealPlan>> {
    const response = await api.request<GenerateMealPlanResponse>('/api/ai/generate-meal-plan', {
      method: 'POST',
    });

    if (response.error) {
      return { error: response.error, code: response.code };
    }

    if (response.data?.mealPlan) {
      return { data: response.data.mealPlan };
    }

    return { error: 'No meal plan returned' };
  }

  /**
   * Check if AI service is available
   */
  async getStatus(): Promise<ApiResponse<AIStatus>> {
    const response = await api.request<StatusResponse>('/api/ai/status');

    if (response.error) {
      return { error: response.error, code: response.code };
    }

    if (response.data) {
      return {
        data: {
          available: response.data.available,
          model: response.data.model,
        },
      };
    }

    return { error: 'Failed to get AI status' };
  }

  /**
   * Save AI-generated meal plan to the database
   */
  async saveAIMealPlan(meals: WeeklyMeals, weekStart?: string): Promise<ApiResponse<MealPlan>> {
    const response = await api.request<SaveMealPlanResponse>('/api/ai/save-meal-plan', {
      method: 'POST',
      body: JSON.stringify({ meals, weekStart }),
    });

    if (response.error) {
      return { error: response.error, code: response.code };
    }

    if (response.data?.mealPlan) {
      return { data: response.data.mealPlan };
    }

    return { error: 'No meal plan returned' };
  }
}

export const aiService = new AIService();
