import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AddGroceryForm from './AddGroceryForm';

// Mock the groceryService
vi.mock('../../services/groceryService', () => ({
  groceryService: {
    getSuggestions: vi.fn().mockResolvedValue({ data: [] }),
  },
  getDefaultStorageLocation: vi.fn().mockReturnValue('pantry'),
}));

// Mock the PreferencesContext
vi.mock('../../context/PreferencesContext', () => ({
  usePreferences: vi.fn().mockReturnValue({
    preferences: {
      unitSystem: 'metric',
      currency: 'USD',
      dietaryRestrictions: [],
      allergies: [],
      dislikedIngredients: [],
    },
    isLoading: false,
    error: null,
    fetchPreferences: vi.fn(),
    updatePreferences: vi.fn(),
  }),
}));

describe('AddGroceryForm', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
    mockOnSubmit.mockResolvedValue({ success: true });
  });

  describe('Storage Location Buttons', () => {
    it('renders all three storage location buttons', () => {
      render(<AddGroceryForm onSubmit={mockOnSubmit} />);

      expect(screen.getByText('Fridge')).toBeInTheDocument();
      expect(screen.getByText('Freezer')).toBeInTheDocument();
      expect(screen.getByText('Pantry')).toBeInTheDocument();
    });

    it('renders storage location icons', () => {
      render(<AddGroceryForm onSubmit={mockOnSubmit} />);

      // Check for emoji icons
      expect(screen.getByText('❄️')).toBeInTheDocument();
      expect(screen.getByText('🧊')).toBeInTheDocument();
      expect(screen.getByText('🗄️')).toBeInTheDocument();
    });

    it('defaults to pantry as selected storage location', () => {
      render(<AddGroceryForm onSubmit={mockOnSubmit} />);

      const buttons = screen.getAllByRole('button').filter(
        (btn) => btn.classList.contains('add-grocery-form__storage-btn')
      );

      // Find the pantry button
      const pantryButton = buttons.find((btn) =>
        btn.textContent?.includes('Pantry')
      );

      expect(pantryButton).toHaveClass('add-grocery-form__storage-btn--active');
    });

    it('changes active button when clicking a different storage location', async () => {
      const user = userEvent.setup();
      render(<AddGroceryForm onSubmit={mockOnSubmit} />);

      const fridgeButton = screen
        .getAllByRole('button')
        .find((btn) => btn.textContent?.includes('Fridge'));
      const pantryButton = screen
        .getAllByRole('button')
        .find((btn) => btn.textContent?.includes('Pantry'));

      // Initially pantry is active
      expect(pantryButton).toHaveClass('add-grocery-form__storage-btn--active');
      expect(fridgeButton).not.toHaveClass(
        'add-grocery-form__storage-btn--active'
      );

      // Click fridge
      await user.click(fridgeButton!);

      // Now fridge should be active and pantry not
      expect(fridgeButton).toHaveClass('add-grocery-form__storage-btn--active');
      expect(pantryButton).not.toHaveClass(
        'add-grocery-form__storage-btn--active'
      );
    });

    it('allows selecting freezer as storage location', async () => {
      const user = userEvent.setup();
      render(<AddGroceryForm onSubmit={mockOnSubmit} />);

      const freezerButton = screen
        .getAllByRole('button')
        .find((btn) => btn.textContent?.includes('Freezer'));

      await user.click(freezerButton!);

      expect(freezerButton).toHaveClass('add-grocery-form__storage-btn--active');
    });

    it('has the correct CSS classes on storage button elements', () => {
      render(<AddGroceryForm onSubmit={mockOnSubmit} />);

      // Check storage buttons container exists
      const storageButtonsContainer = document.querySelector(
        '.add-grocery-form__storage-buttons'
      );
      expect(storageButtonsContainer).toBeInTheDocument();

      // Check individual buttons have correct classes
      const storageButtons = document.querySelectorAll(
        '.add-grocery-form__storage-btn'
      );
      expect(storageButtons.length).toBe(3);

      // Check icons have correct class
      const storageIcons = document.querySelectorAll(
        '.add-grocery-form__storage-icon'
      );
      expect(storageIcons.length).toBe(3);

      // Check labels have correct class
      const storageLabels = document.querySelectorAll(
        '.add-grocery-form__storage-label'
      );
      expect(storageLabels.length).toBe(3);
    });

    it('submits with the selected storage location', async () => {
      const user = userEvent.setup();
      render(<AddGroceryForm onSubmit={mockOnSubmit} />);

      // Fill in required fields
      const nameInput = screen.getByPlaceholderText('Enter grocery name...');
      await user.type(nameInput, 'Milk');

      // Select category
      const categorySelect = screen.getByLabelText('Category');
      await user.selectOptions(categorySelect, 'Dairy');

      // Select fridge storage
      const fridgeButton = screen
        .getAllByRole('button')
        .find((btn) => btn.textContent?.includes('Fridge'));
      await user.click(fridgeButton!);

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /add item/i });
      await user.click(submitButton);

      // Verify onSubmit was called with fridge as storage location
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          storageLocation: 'fridge',
        })
      );
    });
  });

  describe('Form Validation', () => {
    it('shows error when name is empty', async () => {
      const user = userEvent.setup();
      render(<AddGroceryForm onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole('button', { name: /add item/i });
      await user.click(submitButton);

      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('shows error when category is not selected', async () => {
      const user = userEvent.setup();
      render(<AddGroceryForm onSubmit={mockOnSubmit} />);

      const nameInput = screen.getByPlaceholderText('Enter grocery name...');
      await user.type(nameInput, 'Milk');

      const submitButton = screen.getByRole('button', { name: /add item/i });
      await user.click(submitButton);

      expect(screen.getByText('Category is required')).toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Form Reset', () => {
    it('resets storage location to pantry after successful submission', async () => {
      const user = userEvent.setup();
      render(<AddGroceryForm onSubmit={mockOnSubmit} />);

      // Fill in required fields
      const nameInput = screen.getByPlaceholderText('Enter grocery name...');
      await user.type(nameInput, 'Milk');

      const categorySelect = screen.getByLabelText('Category');
      await user.selectOptions(categorySelect, 'Dairy');

      // Select freezer (not the default)
      const freezerButton = screen
        .getAllByRole('button')
        .find((btn) => btn.textContent?.includes('Freezer'));
      await user.click(freezerButton!);

      // Submit
      const submitButton = screen.getByRole('button', { name: /add item/i });
      await user.click(submitButton);

      // Wait for async operations
      await vi.waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });

      // After reset, pantry should be active again
      const pantryButton = screen
        .getAllByRole('button')
        .find((btn) => btn.textContent?.includes('Pantry'));
      expect(pantryButton).toHaveClass('add-grocery-form__storage-btn--active');
    });
  });
});
