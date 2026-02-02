import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Preferences from './Preferences';

// Mock the PreferencesContext
const mockUpdatePreferences = vi.fn();
const mockFetchPreferences = vi.fn();

vi.mock('../context/PreferencesContext', () => ({
  usePreferences: vi.fn(() => ({
    preferences: {
      dietaryRestrictions: [],
      allergies: [],
      dislikedIngredients: [],
      unitSystem: 'metric',
      currency: 'USD',
    },
    isLoading: false,
    error: null,
    fetchPreferences: mockFetchPreferences,
    updatePreferences: mockUpdatePreferences,
  })),
}));

// Mock the AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn().mockReturnValue({
    isAuthenticated: true,
    user: { id: '1', name: 'Test User', email: 'test@example.com' },
  }),
}));

// Mock the NotificationContext
vi.mock('../context/NotificationContext', () => ({
  useNotifications: vi.fn().mockReturnValue({
    unreadCount: 0,
    notifications: [],
    loading: false,
    fetchNotifications: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  }),
}));

const renderPreferences = () => {
  return render(
    <BrowserRouter>
      <Preferences />
    </BrowserRouter>
  );
};

describe('Preferences Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdatePreferences.mockResolvedValue({ success: true });
  });

  describe('Unit System Section', () => {
    it('renders unit system section', () => {
      renderPreferences();

      expect(screen.getByText('Unit System')).toBeInTheDocument();
      expect(screen.getByText('Choose your preferred measurement units for quantities.')).toBeInTheDocument();
    });

    it('renders metric and imperial buttons', () => {
      renderPreferences();

      expect(screen.getByText('Metric')).toBeInTheDocument();
      expect(screen.getByText('Imperial')).toBeInTheDocument();
    });

    it('shows unit hints for each option', () => {
      renderPreferences();

      expect(screen.getByText('kg, g, L, ml')).toBeInTheDocument();
      expect(screen.getByText('lb, oz, cup, tbsp')).toBeInTheDocument();
    });

    it('metric button is active by default', () => {
      renderPreferences();

      const metricButton = screen.getByText('Metric').closest('button');
      expect(metricButton).toHaveClass('unit-toggle__btn--active');
    });

    it('can switch to imperial', async () => {
      const user = userEvent.setup();
      renderPreferences();

      const imperialButton = screen.getByText('Imperial').closest('button');
      await user.click(imperialButton!);

      expect(imperialButton).toHaveClass('unit-toggle__btn--active');
    });
  });

  describe('Currency Section', () => {
    it('renders currency section', () => {
      renderPreferences();

      expect(screen.getByText('Currency')).toBeInTheDocument();
      expect(screen.getByText('Choose your preferred currency for displaying savings and costs.')).toBeInTheDocument();
    });

    it('renders currency dropdown', () => {
      renderPreferences();

      const currencySelect = document.querySelector('.currency-select');
      expect(currencySelect).toBeInTheDocument();
    });

    it('currency dropdown contains expected options', () => {
      renderPreferences();

      const currencySelect = document.querySelector('.currency-select') as HTMLSelectElement;
      const options = Array.from(currencySelect.options);
      const optionValues = options.map((opt) => opt.value);

      expect(optionValues).toContain('USD');
      expect(optionValues).toContain('EUR');
      expect(optionValues).toContain('GBP');
      expect(optionValues).toContain('SEK');
      expect(optionValues).toContain('CAD');
      expect(optionValues).toContain('AUD');
      expect(optionValues).toContain('JPY');
      expect(optionValues).toContain('CHF');
      expect(optionValues).toContain('NOK');
      expect(optionValues).toContain('DKK');
    });

    it('displays currency symbols in dropdown options', () => {
      renderPreferences();

      const currencySelect = document.querySelector('.currency-select') as HTMLSelectElement;
      const usdOption = Array.from(currencySelect.options).find((opt) => opt.value === 'USD');

      expect(usdOption?.textContent).toContain('$');
      expect(usdOption?.textContent).toContain('US Dollar');
    });

    it('can change currency', async () => {
      const user = userEvent.setup();
      renderPreferences();

      const currencySelect = document.querySelector('.currency-select') as HTMLSelectElement;
      await user.selectOptions(currencySelect, 'EUR');

      expect(currencySelect.value).toBe('EUR');
    });
  });

  describe('Save Functionality', () => {
    it('calls updatePreferences with new unit system when saved', async () => {
      const user = userEvent.setup();
      renderPreferences();

      // Switch to imperial
      const imperialButton = screen.getByText('Imperial').closest('button');
      await user.click(imperialButton!);

      // Click save
      const saveButton = screen.getByRole('button', { name: /save preferences/i });
      await user.click(saveButton);

      expect(mockUpdatePreferences).toHaveBeenCalledWith(
        expect.objectContaining({
          unitSystem: 'imperial',
        })
      );
    });

    it('calls updatePreferences with new currency when saved', async () => {
      const user = userEvent.setup();
      renderPreferences();

      // Change currency
      const currencySelect = document.querySelector('.currency-select') as HTMLSelectElement;
      await user.selectOptions(currencySelect, 'EUR');

      // Click save
      const saveButton = screen.getByRole('button', { name: /save preferences/i });
      await user.click(saveButton);

      expect(mockUpdatePreferences).toHaveBeenCalledWith(
        expect.objectContaining({
          currency: 'EUR',
        })
      );
    });

    it('shows success message after saving', async () => {
      const user = userEvent.setup();
      renderPreferences();

      const saveButton = screen.getByRole('button', { name: /save preferences/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Preferences saved successfully!')).toBeInTheDocument();
      });
    });

    it('shows error message if save fails', async () => {
      mockUpdatePreferences.mockResolvedValue({ success: false, error: 'Failed to save' });

      const user = userEvent.setup();
      renderPreferences();

      const saveButton = screen.getByRole('button', { name: /save preferences/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to save')).toBeInTheDocument();
      });
    });
  });
});
