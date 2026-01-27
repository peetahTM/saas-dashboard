import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import type { ReactNode } from 'react';
import { preferencesService } from '../services/preferencesService';
import type { UserPreferences } from '../services/preferencesService';
import { useAuth } from './AuthContext';

interface PreferencesContextType {
  preferences: UserPreferences | null;
  isLoading: boolean;
  error: string | null;
  fetchPreferences: () => Promise<void>;
  updatePreferences: (prefs: UserPreferences) => Promise<{ success: boolean; error?: string }>;
}

const defaultPreferences: UserPreferences = {
  dietaryRestrictions: [],
  allergies: [],
  dislikedIngredients: [],
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

interface PreferencesProviderProps {
  children: ReactNode;
}

export function PreferencesProvider({ children }: PreferencesProviderProps) {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const fetchPreferences = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const response = await preferencesService.getPreferences();

    if (response.error) {
      setError(response.error);
      setPreferences(defaultPreferences);
    } else if (response.data) {
      setPreferences(response.data);
    }

    setIsLoading(false);
  }, []);

  const updatePreferences = async (prefs: UserPreferences) => {
    setError(null);

    const response = await preferencesService.updatePreferences(prefs);

    if (response.error) {
      setError(response.error);
      return { success: false, error: response.error };
    }

    if (response.data) {
      setPreferences(response.data);
      return { success: true };
    }

    return { success: false, error: 'Unable to save your preferences. Please try again.' };
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchPreferences();
    } else {
      setPreferences(null);
      setError(null);
    }
  }, [isAuthenticated, fetchPreferences]);

  const value: PreferencesContextType = {
    preferences,
    isLoading,
    error,
    fetchPreferences,
    updatePreferences,
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}
