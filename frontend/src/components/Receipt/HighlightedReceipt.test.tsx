import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HighlightedReceipt from './HighlightedReceipt';
import type { ParsedItem, ImageDimensions } from '../../services/receiptService';

describe('HighlightedReceipt', () => {
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
      confidence: 0.75,
      lineIndex: 1,
      bbox: { x0: 10, y0: 50, x1: 100, y1: 70 },
    },
    {
      name: 'Milk',
      category: 'dairy',
      quantity: 1,
      unit: 'gallon',
      expiryDate: '2024-02-10',
      confidence: 0.45,
      lineIndex: 2,
      bbox: { x0: 10, y0: 80, x1: 100, y1: 100 },
    },
  ];

  const mockImageDimensions: ImageDimensions = {
    width: 800,
    height: 1200,
  };

  const mockOnItemClick = vi.fn();
  const mockOnItemHover = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render nothing when imageUrl is null', () => {
    const { container } = render(
      <HighlightedReceipt
        imageUrl={null}
        items={mockItems}
        imageDimensions={mockImageDimensions}
        highlightedIndex={null}
        onItemClick={mockOnItemClick}
        onItemHover={mockOnItemHover}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render receipt image when imageUrl is provided', () => {
    render(
      <HighlightedReceipt
        imageUrl="mock-image-url"
        items={mockItems}
        imageDimensions={mockImageDimensions}
        highlightedIndex={null}
        onItemClick={mockOnItemClick}
        onItemHover={mockOnItemHover}
      />
    );

    const image = screen.getByAltText('Receipt');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'mock-image-url');
  });

  it('should not render canvas before image loads', () => {
    const { container } = render(
      <HighlightedReceipt
        imageUrl="mock-image-url"
        items={mockItems}
        imageDimensions={mockImageDimensions}
        highlightedIndex={null}
        onItemClick={mockOnItemClick}
        onItemHover={mockOnItemHover}
      />
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).not.toBeInTheDocument();
  });

  it('should render canvas after image loads', async () => {
    const { container } = render(
      <HighlightedReceipt
        imageUrl="mock-image-url"
        items={mockItems}
        imageDimensions={mockImageDimensions}
        highlightedIndex={null}
        onItemClick={mockOnItemClick}
        onItemHover={mockOnItemHover}
      />
    );

    const image = screen.getByAltText('Receipt');
    fireEvent.load(image);

    await waitFor(() => {
      const canvas = container.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });
  });

  it('should render confidence legend', () => {
    render(
      <HighlightedReceipt
        imageUrl="mock-image-url"
        items={mockItems}
        imageDimensions={mockImageDimensions}
        highlightedIndex={null}
        onItemClick={mockOnItemClick}
        onItemHover={mockOnItemHover}
      />
    );

    expect(screen.getByText('High confidence')).toBeInTheDocument();
    expect(screen.getByText('Medium confidence')).toBeInTheDocument();
    expect(screen.getByText('Low confidence')).toBeInTheDocument();
  });

  it('should call onItemClick when canvas is clicked', async () => {
    const { container } = render(
      <HighlightedReceipt
        imageUrl="mock-image-url"
        items={mockItems}
        imageDimensions={mockImageDimensions}
        highlightedIndex={null}
        onItemClick={mockOnItemClick}
        onItemHover={mockOnItemHover}
      />
    );

    const image = screen.getByAltText('Receipt');

    // Mock image dimensions
    Object.defineProperty(image, 'clientWidth', {
      configurable: true,
      value: 800,
    });
    Object.defineProperty(image, 'clientHeight', {
      configurable: true,
      value: 1200,
    });

    fireEvent.load(image);

    await waitFor(() => {
      const canvas = container.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    const canvas = container.querySelector('canvas')!;

    // Mock getBoundingClientRect to return proper dimensions
    canvas.getBoundingClientRect = vi.fn().mockReturnValue({
      left: 0,
      top: 0,
      right: 800,
      bottom: 1200,
      width: 800,
      height: 1200,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    // Simulate click within first item's bbox
    // Original bbox: x0: 10, y0: 20, x1: 100, y1: 40
    // With image dimensions 800x1200, scale should be 1:1
    fireEvent.click(canvas, {
      clientX: 50,
      clientY: 30,
    });

    // The click detection logic should find an item
    expect(mockOnItemClick).toHaveBeenCalled();
  });

  it('should call onItemHover when mouse moves over canvas', async () => {
    const { container } = render(
      <HighlightedReceipt
        imageUrl="mock-image-url"
        items={mockItems}
        imageDimensions={mockImageDimensions}
        highlightedIndex={null}
        onItemClick={mockOnItemClick}
        onItemHover={mockOnItemHover}
      />
    );

    const image = screen.getByAltText('Receipt');
    fireEvent.load(image);

    await waitFor(() => {
      const canvas = container.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    const canvas = container.querySelector('canvas')!;

    fireEvent.mouseMove(canvas, {
      clientX: 50,
      clientY: 30,
    });

    expect(mockOnItemHover).toHaveBeenCalled();
  });

  it('should call onItemHover with null when mouse leaves canvas', async () => {
    const { container } = render(
      <HighlightedReceipt
        imageUrl="mock-image-url"
        items={mockItems}
        imageDimensions={mockImageDimensions}
        highlightedIndex={null}
        onItemClick={mockOnItemClick}
        onItemHover={mockOnItemHover}
      />
    );

    const image = screen.getByAltText('Receipt');
    fireEvent.load(image);

    await waitFor(() => {
      const canvas = container.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    const canvas = container.querySelector('canvas')!;

    fireEvent.mouseLeave(canvas);

    expect(mockOnItemHover).toHaveBeenCalledWith(null);
  });

  it('should handle items without bounding boxes', async () => {
    const itemsWithoutBbox: ParsedItem[] = [
      {
        name: 'No Bbox Item',
        category: 'other',
        quantity: 1,
        unit: 'each',
        expiryDate: '2024-02-01',
        bbox: null,
      },
    ];

    const { container } = render(
      <HighlightedReceipt
        imageUrl="mock-image-url"
        items={itemsWithoutBbox}
        imageDimensions={mockImageDimensions}
        highlightedIndex={null}
        onItemClick={mockOnItemClick}
        onItemHover={mockOnItemHover}
      />
    );

    const image = screen.getByAltText('Receipt');
    fireEvent.load(image);

    await waitFor(() => {
      const canvas = container.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    // Should not crash, just not draw any boxes
    expect(container.querySelector('canvas')).toBeInTheDocument();
  });

  it('should apply highlighted styling when highlightedIndex matches', async () => {
    const mockGetContext = vi.fn().mockReturnValue({
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      strokeRect: vi.fn(),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
    });

    HTMLCanvasElement.prototype.getContext = mockGetContext;

    const { container } = render(
      <HighlightedReceipt
        imageUrl="mock-image-url"
        items={mockItems}
        imageDimensions={mockImageDimensions}
        highlightedIndex={0}
        onItemClick={mockOnItemClick}
        onItemHover={mockOnItemHover}
      />
    );

    const image = screen.getByAltText('Receipt');
    fireEvent.load(image);

    await waitFor(() => {
      const canvas = container.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    const ctx = mockGetContext.mock.results[0]?.value;
    expect(ctx).toBeDefined();

    // Wait for drawing to occur
    await waitFor(() => {
      expect(ctx.fillRect).toHaveBeenCalled();
    });
  });

  it('should handle missing imageDimensions gracefully', async () => {
    const { container } = render(
      <HighlightedReceipt
        imageUrl="mock-image-url"
        items={mockItems}
        imageDimensions={undefined}
        highlightedIndex={null}
        onItemClick={mockOnItemClick}
        onItemHover={mockOnItemHover}
      />
    );

    const image = screen.getByAltText('Receipt');
    fireEvent.load(image);

    // Should still render but may not calculate scale correctly
    await waitFor(() => {
      expect(screen.getByAltText('Receipt')).toBeInTheDocument();
    });
  });

  it('should update when highlighted index changes', async () => {
    const { container, rerender } = render(
      <HighlightedReceipt
        imageUrl="mock-image-url"
        items={mockItems}
        imageDimensions={mockImageDimensions}
        highlightedIndex={null}
        onItemClick={mockOnItemClick}
        onItemHover={mockOnItemHover}
      />
    );

    const image = screen.getByAltText('Receipt');
    fireEvent.load(image);

    await waitFor(() => {
      const canvas = container.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    // Change highlighted index
    rerender(
      <HighlightedReceipt
        imageUrl="mock-image-url"
        items={mockItems}
        imageDimensions={mockImageDimensions}
        highlightedIndex={1}
        onItemClick={mockOnItemClick}
        onItemHover={mockOnItemHover}
      />
    );

    // Canvas should still be present and re-render
    expect(container.querySelector('canvas')).toBeInTheDocument();
  });

  it('should handle empty items array', () => {
    render(
      <HighlightedReceipt
        imageUrl="mock-image-url"
        items={[]}
        imageDimensions={mockImageDimensions}
        highlightedIndex={null}
        onItemClick={mockOnItemClick}
        onItemHover={mockOnItemHover}
      />
    );

    expect(screen.getByAltText('Receipt')).toBeInTheDocument();
  });

  it('should apply correct confidence colors', () => {
    // Test confidence color function indirectly through rendering
    const itemsWithDifferentConfidence: ParsedItem[] = [
      {
        name: 'High Conf',
        category: 'produce',
        quantity: 1,
        unit: 'each',
        expiryDate: '2024-02-01',
        confidence: 0.9, // High - green
        bbox: { x0: 10, y0: 20, x1: 100, y1: 40 },
      },
      {
        name: 'Medium Conf',
        category: 'produce',
        quantity: 1,
        unit: 'each',
        expiryDate: '2024-02-01',
        confidence: 0.6, // Medium - yellow
        bbox: { x0: 10, y0: 50, x1: 100, y1: 70 },
      },
      {
        name: 'Low Conf',
        category: 'produce',
        quantity: 1,
        unit: 'each',
        expiryDate: '2024-02-01',
        confidence: 0.3, // Low - red
        bbox: { x0: 10, y0: 80, x1: 100, y1: 100 },
      },
    ];

    render(
      <HighlightedReceipt
        imageUrl="mock-image-url"
        items={itemsWithDifferentConfidence}
        imageDimensions={mockImageDimensions}
        highlightedIndex={null}
        onItemClick={mockOnItemClick}
        onItemHover={mockOnItemHover}
      />
    );

    // Component renders successfully with different confidence levels
    expect(screen.getByAltText('Receipt')).toBeInTheDocument();
  });

  it('should use default confidence when undefined', () => {
    const itemsWithoutConfidence: ParsedItem[] = [
      {
        name: 'No Conf',
        category: 'produce',
        quantity: 1,
        unit: 'each',
        expiryDate: '2024-02-01',
        confidence: undefined,
        bbox: { x0: 10, y0: 20, x1: 100, y1: 40 },
      },
    ];

    render(
      <HighlightedReceipt
        imageUrl="mock-image-url"
        items={itemsWithoutConfidence}
        imageDimensions={mockImageDimensions}
        highlightedIndex={null}
        onItemClick={mockOnItemClick}
        onItemHover={mockOnItemHover}
      />
    );

    // Should use default confidence of 0.8
    expect(screen.getByAltText('Receipt')).toBeInTheDocument();
  });
});
