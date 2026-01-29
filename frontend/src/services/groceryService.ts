import { api } from './api';
import type { ApiResponse } from './api';

export type StorageLocation = 'fridge' | 'freezer' | 'pantry';

export interface Grocery {
  id: number;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  isConsumed: boolean;
  storageLocation: StorageLocation;
}

export interface GrocerySuggestion {
  id: number;
  name: string;
  category: string;
  defaultExpiryDays: number;
  defaultStorageLocation?: StorageLocation;
}

export interface CreateGroceryData {
  name: string;
  category?: string;
  quantity?: number;
  unit?: string;
  expiryDate?: string;
  storageLocation?: StorageLocation;
}

export interface UpdateGroceryData {
  name?: string;
  category?: string;
  quantity?: number;
  unit?: string;
  expiryDate?: string;
}

interface GroceriesResponse {
  groceries: Grocery[];
}

interface GroceryResponse {
  grocery: Grocery;
  message?: string;
}

interface SuggestionsResponse {
  suggestions: GrocerySuggestion[];
}

interface GetGroceriesOptions {
  includeConsumed?: boolean;
}

class GroceryService {
  async getGroceries(options?: GetGroceriesOptions): Promise<ApiResponse<Grocery[]>> {
    let endpoint = '/api/groceries';
    if (options?.includeConsumed) {
      endpoint += '?includeConsumed=true';
    }
    const response = await api.request<GroceriesResponse>(endpoint);
    if (response.error) {
      return { error: response.error };
    }
    return { data: response.data?.groceries || [] };
  }

  async addGrocery(data: CreateGroceryData): Promise<ApiResponse<Grocery>> {
    const response = await api.request<GroceryResponse>('/api/groceries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (response.error) {
      return { error: response.error };
    }
    return { data: response.data?.grocery };
  }

  async updateGrocery(id: number, data: UpdateGroceryData): Promise<ApiResponse<Grocery>> {
    const response = await api.request<GroceryResponse>(`/api/groceries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (response.error) {
      return { error: response.error };
    }
    return { data: response.data?.grocery };
  }

  async deleteGrocery(id: number): Promise<ApiResponse<void>> {
    return api.request<void>(`/api/groceries/${id}`, {
      method: 'DELETE',
    });
  }

  async consumeGrocery(id: number): Promise<ApiResponse<Grocery>> {
    const response = await api.request<GroceryResponse>(`/api/groceries/${id}/consume`, {
      method: 'POST',
    });
    if (response.error) {
      return { error: response.error };
    }
    return { data: response.data?.grocery };
  }

  async getSuggestions(query: string): Promise<ApiResponse<GrocerySuggestion[]>> {
    const response = await api.request<SuggestionsResponse>(`/api/groceries/suggestions?q=${encodeURIComponent(query)}`);
    if (response.error) {
      return { error: response.error };
    }
    return { data: response.data?.suggestions || [] };
  }
}

export const groceryService = new GroceryService();

// Helper to get default storage location based on category
export function getDefaultStorageLocation(category: string): StorageLocation {
  const categoryLower = category.toLowerCase();
  if (['dairy', 'meat', 'produce', 'beverages', 'seafood', 'fruits', 'vegetables'].includes(categoryLower)) {
    return 'fridge';
  }
  if (categoryLower === 'frozen') {
    return 'freezer';
  }
  return 'pantry';
}
