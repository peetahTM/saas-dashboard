import { api } from './api';
import type { ApiResponse } from './api';

export type UnitSystem = 'metric' | 'imperial';
export type Currency = 'USD' | 'EUR' | 'GBP' | 'SEK' | 'CAD' | 'AUD' | 'JPY' | 'CHF' | 'NOK' | 'DKK';

export const CURRENCIES: { code: Currency; symbol: string; name: string }[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '\u20AC', name: 'Euro' },
  { code: 'GBP', symbol: '\u00A3', name: 'British Pound' },
  { code: 'SEK', symbol: 'SEK', name: 'Swedish Krona' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '\u00A5', name: 'Japanese Yen' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'NOK', symbol: 'NOK', name: 'Norwegian Krone' },
  { code: 'DKK', symbol: 'DKK', name: 'Danish Krone' },
];

export const getCurrencySymbol = (code: Currency): string => {
  const currency = CURRENCIES.find(c => c.code === code);
  return currency?.symbol || '$';
};

export interface UserPreferences {
  dietaryRestrictions: string[];
  allergies: string[];
  dislikedIngredients: string[];
  unitSystem: UnitSystem;
  currency: Currency;
}

interface PreferencesResponse {
  preferences: UserPreferences;
}

export const preferencesService = {
  async getPreferences(): Promise<ApiResponse<UserPreferences>> {
    const response = await api.request<PreferencesResponse>('/api/preferences');
    if (response.error) {
      return { error: response.error };
    }
    return { data: response.data?.preferences };
  },

  async updatePreferences(prefs: UserPreferences): Promise<ApiResponse<UserPreferences>> {
    const response = await api.request<PreferencesResponse>('/api/preferences', {
      method: 'PUT',
      body: JSON.stringify(prefs),
    });
    if (response.error) {
      return { error: response.error };
    }
    return { data: response.data?.preferences };
  },
};
