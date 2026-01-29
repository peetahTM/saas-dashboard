import { api } from './api';
import type { ApiResponse } from './api';

export interface RecipeIngredient {
  name: string;
  amount: string;
}

export interface Recipe {
  id: number;
  name: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
  prepTime: number;
  dietaryTags: string[];
}

export interface RecipeSuggestion extends Recipe {
  matchingIngredientsCount: number;
}

export interface RecipeFilters {
  dietary?: string;
}

interface RecipesResponse {
  recipes: Recipe[];
  total: number;
  limit: number;
  offset: number;
}

interface RecipeResponse {
  recipe: Recipe;
}

interface SuggestionsResponse {
  recipes: RecipeSuggestion[];
  expiringGroceries: { name: string; expiryDate: string }[];
}

class RecipeService {
  async getRecipes(filters?: RecipeFilters): Promise<ApiResponse<Recipe[]>> {
    let endpoint = '/api/recipes';

    if (filters?.dietary) {
      const params = new URLSearchParams();
      params.append('dietary', filters.dietary);
      endpoint += `?${params.toString()}`;
    }

    const response = await api.request<RecipesResponse>(endpoint);
    if (response.error) {
      return { error: response.error };
    }
    return { data: response.data?.recipes || [] };
  }

  async getRecipe(id: number): Promise<ApiResponse<Recipe>> {
    const response = await api.request<RecipeResponse>(`/api/recipes/${id}`);
    if (response.error) {
      return { error: response.error };
    }
    return { data: response.data?.recipe };
  }

  async getRecipeSuggestions(): Promise<ApiResponse<RecipeSuggestion[]>> {
    const response = await api.request<SuggestionsResponse>('/api/recipes/suggestions');
    if (response.error) {
      return { error: response.error };
    }
    return { data: response.data?.recipes || [] };
  }
}

export const recipeService = new RecipeService();
