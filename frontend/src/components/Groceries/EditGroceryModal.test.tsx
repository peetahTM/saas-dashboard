import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EditGroceryModal from './EditGroceryModal';
import type { Grocery } from '../../services/groceryService';

const mockGrocery: Grocery = {
  id: 1,
  name: 'Test Milk',
  category: 'Dairy',
  quantity: 2,
  unit: 'L',
  expiryDate: '2024-12-31',
  isConsumed: false,
  storageLocation: 'fridge',
};

describe('EditGroceryModal', () => {
  const mockOnSave = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnSave.mockClear();
    mockOnClose.mockClear();
    mockOnSave.mockResolvedValue({ success: true });
  });

  it('renders with pre-populated values from grocery', () => {
    render(
      <EditGroceryModal
        grocery={mockGrocery}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByLabelText('Name')).toHaveValue('Test Milk');
    expect(screen.getByLabelText('Category')).toHaveValue('Dairy');
    expect(screen.getByLabelText('Quantity')).toHaveValue(2);
    expect(screen.getByLabelText('Unit')).toHaveValue('L');
    expect(screen.getByLabelText('Expiry Date')).toHaveValue('2024-12-31');
  });

  it('calls onClose when Cancel button is clicked', () => {
    render(
      <EditGroceryModal
        grocery={mockGrocery}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <EditGroceryModal
        grocery={mockGrocery}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByLabelText('Close'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    render(
      <EditGroceryModal
        grocery={mockGrocery}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    const backdrop = document.querySelector('.edit-grocery-modal__backdrop');
    fireEvent.click(backdrop!);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when clicking inside modal', () => {
    render(
      <EditGroceryModal
        grocery={mockGrocery}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    const modal = document.querySelector('.edit-grocery-modal');
    fireEvent.click(modal!);
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('calls onSave with updated data when form is submitted', async () => {
    render(
      <EditGroceryModal
        grocery={mockGrocery}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    const nameInput = screen.getByLabelText('Name');
    fireEvent.change(nameInput, { target: { value: 'Updated Milk' } });

    const quantityInput = screen.getByLabelText('Quantity');
    fireEvent.change(quantityInput, { target: { value: '3' } });

    fireEvent.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(1, {
        name: 'Updated Milk',
        category: 'Dairy',
        quantity: 3,
        unit: 'L',
        expiryDate: '2024-12-31',
        storageLocation: 'fridge',
      });
    });
  });

  it('shows error when name is empty', async () => {
    render(
      <EditGroceryModal
        grocery={mockGrocery}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    const nameInput = screen.getByLabelText('Name');
    fireEvent.change(nameInput, { target: { value: '' } });

    fireEvent.click(screen.getByText('Save Changes'));

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('shows error when quantity is invalid', async () => {
    render(
      <EditGroceryModal
        grocery={mockGrocery}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    const quantityInput = screen.getByLabelText('Quantity');
    fireEvent.change(quantityInput, { target: { value: 'abc' } });

    fireEvent.click(screen.getByText('Save Changes'));

    expect(await screen.findByText('Quantity must be a positive number')).toBeInTheDocument();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('allows changing storage location', async () => {
    render(
      <EditGroceryModal
        grocery={mockGrocery}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    // Find and click the Freezer button
    const freezerButton = screen.getByRole('button', { name: /Freezer/i });
    fireEvent.click(freezerButton);

    fireEvent.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(1, expect.objectContaining({
        storageLocation: 'freezer',
      }));
    });
  });

  it('closes modal after successful save', async () => {
    render(
      <EditGroceryModal
        grocery={mockGrocery}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it('shows error message when save fails', async () => {
    mockOnSave.mockResolvedValue({ success: false, error: 'Network error' });

    render(
      <EditGroceryModal
        grocery={mockGrocery}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('Save Changes'));

    expect(await screen.findByText('Network error')).toBeInTheDocument();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('disables save button while submitting', async () => {
    mockOnSave.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100)));

    render(
      <EditGroceryModal
        grocery={mockGrocery}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('Save Changes'));

    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Saving/i })).toBeDisabled();
  });
});
