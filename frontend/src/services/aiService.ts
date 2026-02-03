import { api } from './api';
import type { ApiResponse } from './api';

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
}

export const aiService = new AIService();
