import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ParsedItemsList from './ParsedItemsList';
import type { ParsedItem } from '../../services/receiptService';

describe('ParsedItemsList', () => {
  const mockOnChange = vi.fn();
  const mockOnItemHover = vi.fn();

  const mockItems: ParsedItem[] = [
    {
      name: 'Apple',
      category: 'produce',
      quantity: 2,
      unit: 'each',
      expiryDate: '2024-02-01',
      confidence: 0.95,
      lineIndex: 0,
      bbox: { x0: 10, y0: 20, x1: 100, y1: 40 },
    },
    {
      name: 'Banana',
      category: 'produce',
      quantity: 3,
      unit: 'each',
      expiryDate: '2024-02-05',
      confidence: 0.85,
      lineIndex: 1,
      bbox: { x0: 10, y0: 50, x1: 100, y1: 70 },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render list of items', () => {
      render(<ParsedItemsList items={mockItems} onChange={mockOnChange} />);

      expect(screen.getByText('Apple')).toBeInTheDocument();
      expect(screen.getByText('Banana')).toBeInTheDocument();
    });

    it('should render empty state when no items', () => {
      render(<ParsedItemsList items={[]} onChange={mockOnChange} />);

      expect(screen.getByText(/No items were detected/i)).toBeInTheDocument();
      expect(screen.getByText('Add Item Manually')).toBeInTheDocument();
    });

    it('should display item details', () => {
      render(<ParsedItemsList items={mockItems} onChange={mockOnChange} />);

      // Check if items are rendered with details (multiple items may have same category)
      const details = screen.getAllByText(/produce/);
      expect(details.length).toBeGreaterThan(0);
      expect(screen.getByText(/2 each.*produce.*Exp: 2024-02-01/)).toBeInTheDocument();
    });

    it('should show unnamed placeholder for items without names', () => {
      const itemsWithoutNames: ParsedItem[] = [
        {
          name: '',
          category: 'other',
          quantity: 1,
          unit: 'each',
          expiryDate: '2024-02-01',
        },
      ];

      render(<ParsedItemsList items={itemsWithoutNames} onChange={mockOnChange} />);

      expect(screen.getByText('(unnamed)')).toBeInTheDocument();
    });
  });

  describe('Highlighting', () => {
    it('should apply highlighted class when highlightedIndex matches', () => {
      const { container } = render(
        <ParsedItemsList
          items={mockItems}
          onChange={mockOnChange}
          highlightedIndex={0}
        />
      );

      const items = container.querySelectorAll('.parsed-items-list__item');
      expect(items[0]).toHaveClass('parsed-items-list__item--highlighted');
      expect(items[1]).not.toHaveClass('parsed-items-list__item--highlighted');
    });

    it('should not apply highlighted class when highlightedIndex is null', () => {
      const { container } = render(
        <ParsedItemsList
          items={mockItems}
          onChange={mockOnChange}
          highlightedIndex={null}
        />
      );

      const items = container.querySelectorAll('.parsed-items-list__item');
      items.forEach(item => {
        expect(item).not.toHaveClass('parsed-items-list__item--highlighted');
      });
    });

    it('should call onItemHover when mouse enters item', () => {
      const { container } = render(
        <ParsedItemsList
          items={mockItems}
          onChange={mockOnChange}
          onItemHover={mockOnItemHover}
        />
      );

      const items = container.querySelectorAll('.parsed-items-list__item');
      fireEvent.mouseEnter(items[0]);

      expect(mockOnItemHover).toHaveBeenCalledWith(0);
    });

    it('should call onItemHover with null when mouse leaves item', () => {
      const { container } = render(
        <ParsedItemsList
          items={mockItems}
          onChange={mockOnChange}
          onItemHover={mockOnItemHover}
        />
      );

      const items = container.querySelectorAll('.parsed-items-list__item');
      fireEvent.mouseLeave(items[0]);

      expect(mockOnItemHover).toHaveBeenCalledWith(null);
    });

    it('should not crash when onItemHover is not provided', () => {
      const { container } = render(
        <ParsedItemsList items={mockItems} onChange={mockOnChange} />
      );

      const items = container.querySelectorAll('.parsed-items-list__item');

      expect(() => {
        fireEvent.mouseEnter(items[0]);
        fireEvent.mouseLeave(items[0]);
      }).not.toThrow();
    });
  });

  describe('Scroll behavior', () => {
    it('should scroll to item when scrollToIndex changes', async () => {
      const mockScrollIntoView = vi.fn();
      Element.prototype.scrollIntoView = mockScrollIntoView;

      const { rerender } = render(
        <ParsedItemsList
          items={mockItems}
          onChange={mockOnChange}
          scrollToIndex={null}
        />
      );

      // Change scrollToIndex
      rerender(
        <ParsedItemsList
          items={mockItems}
          onChange={mockOnChange}
          scrollToIndex={1}
        />
      );

      await waitFor(() => {
        expect(mockScrollIntoView).toHaveBeenCalledWith({
          behavior: 'smooth',
          block: 'nearest',
        });
      });
    });

    it('should not scroll when scrollToIndex is null', () => {
      const mockScrollIntoView = vi.fn();
      Element.prototype.scrollIntoView = mockScrollIntoView;

      render(
        <ParsedItemsList
          items={mockItems}
          onChange={mockOnChange}
          scrollToIndex={null}
        />
      );

      expect(mockScrollIntoView).not.toHaveBeenCalled();
    });

    it('should handle invalid scrollToIndex gracefully', () => {
      const mockScrollIntoView = vi.fn();
      Element.prototype.scrollIntoView = mockScrollIntoView;

      render(
        <ParsedItemsList
          items={mockItems}
          onChange={mockOnChange}
          scrollToIndex={999}
        />
      );

      // Should not crash
      expect(mockScrollIntoView).not.toHaveBeenCalled();
    });
  });

  describe('Editing items', () => {
    it('should enter edit mode when edit button clicked', async () => {
      const user = userEvent.setup();
      render(<ParsedItemsList items={mockItems} onChange={mockOnChange} />);

      const editButtons = screen.getAllByTitle('Edit item');
      await user.click(editButtons[0]);

      // Should show input field
      const input = screen.getByPlaceholderText('Item name');
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue('Apple');
    });

    it('should update item name', async () => {
      const user = userEvent.setup();
      render(<ParsedItemsList items={mockItems} onChange={mockOnChange} />);

      const editButtons = screen.getAllByTitle('Edit item');
      await user.click(editButtons[0]);

      const input = screen.getByPlaceholderText('Item name');
      await user.clear(input);
      await user.type(input, 'R');

      // Each character typed triggers onChange
      expect(mockOnChange).toHaveBeenCalled();
      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
      expect(lastCall[0].name).toContain('R');
    });

    it('should update item category', async () => {
      const user = userEvent.setup();
      render(<ParsedItemsList items={mockItems} onChange={mockOnChange} />);

      const editButtons = screen.getAllByTitle('Edit item');
      await user.click(editButtons[0]);

      const categorySelect = screen.getAllByRole('combobox')[0];
      await user.selectOptions(categorySelect, 'dairy');

      expect(mockOnChange).toHaveBeenCalled();
      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
      expect(lastCall[0].category).toBe('dairy');
    });

    it('should update item quantity', async () => {
      const user = userEvent.setup();
      render(<ParsedItemsList items={mockItems} onChange={mockOnChange} />);

      const editButtons = screen.getAllByTitle('Edit item');
      await user.click(editButtons[0]);

      const quantityInputs = screen.getAllByDisplayValue('2');
      const quantityInput = quantityInputs[0];

      await user.clear(quantityInput);
      await user.type(quantityInput, '5');

      expect(mockOnChange).toHaveBeenCalled();
      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
      expect(lastCall[0].quantity).toBe(5);
    });

    it('should update item unit', async () => {
      const user = userEvent.setup();
      render(<ParsedItemsList items={mockItems} onChange={mockOnChange} />);

      const editButtons = screen.getAllByTitle('Edit item');
      await user.click(editButtons[0]);

      const unitInputs = screen.getAllByDisplayValue('each');
      const unitInput = unitInputs[0];

      await user.clear(unitInput);
      await user.type(unitInput, 'l');

      expect(mockOnChange).toHaveBeenCalled();
      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
      expect(lastCall[0].unit).toContain('l');
    });

    it('should update expiry date', async () => {
      const user = userEvent.setup();
      render(<ParsedItemsList items={mockItems} onChange={mockOnChange} />);

      const editButtons = screen.getAllByTitle('Edit item');
      await user.click(editButtons[0]);

      const dateInput = screen.getByDisplayValue('2024-02-01');

      // Simulate changing the date
      fireEvent.change(dateInput, { target: { value: '2024-03-01' } });

      expect(mockOnChange).toHaveBeenCalled();
      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
      expect(lastCall[0].expiryDate).toBe('2024-03-01');
    });

    it('should exit edit mode when Done button clicked', async () => {
      const user = userEvent.setup();
      render(<ParsedItemsList items={mockItems} onChange={mockOnChange} />);

      const editButtons = screen.getAllByTitle('Edit item');
      await user.click(editButtons[0]);

      const doneButton = screen.getByText('Done');
      await user.click(doneButton);

      // Should no longer show input
      expect(screen.queryByPlaceholderText('Item name')).not.toBeInTheDocument();
    });
  });

  describe('Adding items', () => {
    it('should add new item when Add Item button clicked', async () => {
      const user = userEvent.setup();
      render(<ParsedItemsList items={mockItems} onChange={mockOnChange} />);

      const addButton = screen.getByText('Add Item');
      await user.click(addButton);

      expect(mockOnChange).toHaveBeenCalled();
      const newItems = mockOnChange.mock.calls[0][0];
      expect(newItems).toHaveLength(3);
      expect(newItems[2].name).toBe('');
      expect(newItems[2].category).toBe('other');
    });

    it('should add new item from empty state', async () => {
      const user = userEvent.setup();
      render(<ParsedItemsList items={[]} onChange={mockOnChange} />);

      const addButton = screen.getByText('Add Item Manually');
      await user.click(addButton);

      expect(mockOnChange).toHaveBeenCalled();
      const newItems = mockOnChange.mock.calls[0][0];
      expect(newItems).toHaveLength(1);
    });

    it('should set default expiry date 7 days in future for new items', async () => {
      const user = userEvent.setup();
      render(<ParsedItemsList items={mockItems} onChange={mockOnChange} />);

      const addButton = screen.getByText('Add Item');
      await user.click(addButton);

      const newItems = mockOnChange.mock.calls[0][0];
      const expiryDate = new Date(newItems[2].expiryDate);
      const today = new Date();
      const diffDays = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      expect(diffDays).toBeGreaterThanOrEqual(6);
      expect(diffDays).toBeLessThanOrEqual(8);
    });

    it('should show edit mode for new item', async () => {
      const user = userEvent.setup();
      render(<ParsedItemsList items={[]} onChange={mockOnChange} />);

      const addButton = screen.getByText('Add Item Manually');
      await user.click(addButton);

      // Wait a bit for state updates
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check that input is present (autofocus behavior is browser-dependent)
      await waitFor(() => {
        const input = screen.queryByPlaceholderText('Item name');
        expect(input).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Removing items', () => {
    it('should remove item when remove button clicked', async () => {
      const user = userEvent.setup();
      render(<ParsedItemsList items={mockItems} onChange={mockOnChange} />);

      const removeButtons = screen.getAllByTitle('Remove item');
      await user.click(removeButtons[0]);

      expect(mockOnChange).toHaveBeenCalled();
      const newItems = mockOnChange.mock.calls[0][0];
      expect(newItems).toHaveLength(1);
      expect(newItems[0].name).toBe('Banana');
    });

    it('should not crash when removing last item', async () => {
      const user = userEvent.setup();
      const singleItem: ParsedItem[] = [mockItems[0]];

      render(<ParsedItemsList items={singleItem} onChange={mockOnChange} />);

      const removeButton = screen.getByTitle('Remove item');
      await user.click(removeButton);

      expect(mockOnChange).toHaveBeenCalledWith([]);
    });
  });

  describe('Category options', () => {
    it('should show all category options in select', async () => {
      const user = userEvent.setup();
      render(<ParsedItemsList items={mockItems} onChange={mockOnChange} />);

      const editButtons = screen.getAllByTitle('Edit item');
      await user.click(editButtons[0]);

      const categorySelect = screen.getAllByRole('combobox')[0];
      const options = categorySelect.querySelectorAll('option');

      const expectedCategories = [
        'Produce',
        'Dairy',
        'Meat',
        'Bakery',
        'Pantry',
        'Frozen',
        'Beverages',
        'Snacks',
        'Other',
      ];

      expect(options).toHaveLength(expectedCategories.length);
    });
  });

  describe('Edge cases', () => {
    it('should handle quantity as string and convert to number', async () => {
      const user = userEvent.setup();
      render(<ParsedItemsList items={mockItems} onChange={mockOnChange} />);

      const editButtons = screen.getAllByTitle('Edit item');
      await user.click(editButtons[0]);

      const quantityInputs = screen.getAllByDisplayValue('2');
      const quantityInput = quantityInputs[0];

      // Type non-numeric value
      fireEvent.change(quantityInput, { target: { value: 'abc' } });

      // Should default to 1 or NaN (parseFloat returns NaN, then || 1 kicks in)
      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
      expect(lastCall[0].quantity).toBe(1);
    });

    it('should handle zero quantity', async () => {
      const user = userEvent.setup();
      render(<ParsedItemsList items={mockItems} onChange={mockOnChange} />);

      const editButtons = screen.getAllByTitle('Edit item');
      await user.click(editButtons[0]);

      const quantityInputs = screen.getAllByDisplayValue('2');
      const quantityInput = quantityInputs[0];

      fireEvent.change(quantityInput, { target: { value: '0' } });

      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
      // parseFloat('0') returns 0, which is falsy, so || 1 makes it 1
      expect(lastCall[0].quantity).toBe(1);
    });

    it('should handle decimal quantities', async () => {
      const user = userEvent.setup();
      render(<ParsedItemsList items={mockItems} onChange={mockOnChange} />);

      const editButtons = screen.getAllByTitle('Edit item');
      await user.click(editButtons[0]);

      const quantityInputs = screen.getAllByDisplayValue('2');
      const quantityInput = quantityInputs[0];

      fireEvent.change(quantityInput, { target: { value: '1.5' } });

      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
      expect(lastCall[0].quantity).toBe(1.5);
    });
  });
});
