import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { groceryService } from '../services/groceryService';
import type { Grocery, CreateGroceryData, UpdateGroceryData } from '../services/groceryService';

interface GroceryContextType {
  groceries: Grocery[];
  loading: boolean;
  error: string | null;
  fetchGroceries: () => Promise<void>;
  addGrocery: (data: CreateGroceryData) => Promise<{ success: boolean; error?: string }>;
  updateGrocery: (id: number, data: UpdateGroceryData) => Promise<{ success: boolean; error?: string }>;
  deleteGrocery: (id: number) => Promise<{ success: boolean; error?: string }>;
  consumeGrocery: (id: number) => Promise<{ success: boolean; error?: string }>;
}

const GroceryContext = createContext<GroceryContextType | undefined>(undefined);

interface GroceryProviderProps {
  children: ReactNode;
}

export function GroceryProvider({ children }: GroceryProviderProps) {
  const { isAuthenticated } = useAuth();
  const [groceries, setGroceries] = useState<Grocery[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGroceries = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await groceryService.getGroceries();

    if (response.error) {
      setError(response.error);
      setLoading(false);
      return;
    }

    if (response.data) {
      setGroceries(response.data);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchGroceries();
    } else {
      setGroceries([]);
    }
  }, [isAuthenticated, fetchGroceries]);

  const addGrocery = async (data: CreateGroceryData) => {
    const response = await groceryService.addGrocery(data);

    if (response.error) {
      return { success: false, error: response.error };
    }

    if (response.data) {
      setGroceries((prev) => [...prev, response.data!]);
      return { success: true };
    }

    return { success: false, error: 'Unable to complete the operation. Please try again.' };
  };

  const updateGrocery = async (id: number, data: UpdateGroceryData) => {
    const response = await groceryService.updateGrocery(id, data);

    if (response.error) {
      return { success: false, error: response.error };
    }

    if (response.data) {
      setGroceries((prev) =>
        prev.map((grocery) => (grocery.id === id ? response.data! : grocery))
      );
      return { success: true };
    }

    return { success: false, error: 'Unable to complete the operation. Please try again.' };
  };

  const deleteGrocery = async (id: number) => {
    const response = await groceryService.deleteGrocery(id);

    if (response.error) {
      return { success: false, error: response.error };
    }

    setGroceries((prev) => prev.filter((grocery) => grocery.id !== id));
    return { success: true };
  };

  const consumeGrocery = async (id: number) => {
    const response = await groceryService.consumeGrocery(id);

    if (response.error) {
      return { success: false, error: response.error };
    }

    if (response.data) {
      setGroceries((prev) =>
        prev.map((grocery) => (grocery.id === id ? response.data! : grocery))
      );
      return { success: true };
    }

    return { success: false, error: 'Unable to complete the operation. Please try again.' };
  };

  const value: GroceryContextType = {
    groceries,
    loading,
    error,
    fetchGroceries,
    addGrocery,
    updateGrocery,
    deleteGrocery,
    consumeGrocery,
  };

  return <GroceryContext.Provider value={value}>{children}</GroceryContext.Provider>;
}

export function useGroceries() {
  const context = useContext(GroceryContext);
  if (context === undefined) {
    throw new Error('useGroceries must be used within a GroceryProvider');
  }
  return context;
}
