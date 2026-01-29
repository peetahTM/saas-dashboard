import { useRef, useEffect, useState, useCallback } from 'react';
import type { ParsedItem, ImageDimensions } from '../../services/receiptService';

interface HighlightedReceiptProps {
  imageUrl: string | null;
  items: ParsedItem[];
  imageDimensions?: ImageDimensions;
  highlightedIndex: number | null;
  onItemClick: (index: number) => void;
  onItemHover: (index: number | null) => void;
}

const getConfidenceColor = (confidence: number | undefined): string => {
  const conf = confidence ?? 0.8;
  if (conf >= 0.8) return 'rgba(34, 197, 94, 0.4)'; // green
  if (conf >= 0.5) return 'rgba(234, 179, 8, 0.4)'; // yellow
  return 'rgba(239, 68, 68, 0.4)'; // red
};

const getConfidenceBorderColor = (confidence: number | undefined): string => {
  const conf = confidence ?? 0.8;
  if (conf >= 0.8) return 'rgb(34, 197, 94)'; // green
  if (conf >= 0.5) return 'rgb(234, 179, 8)'; // yellow
  return 'rgb(239, 68, 68)'; // red
};

const HighlightedReceipt: React.FC<HighlightedReceiptProps> = ({
  imageUrl,
  items,
  imageDimensions,
  highlightedIndex,
  onItemClick,
  onItemHover,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [scale, setScale] = useState({ x: 1, y: 1 });
  const [imageLoaded, setImageLoaded] = useState(false);

  // Calculate scale when image loads or container resizes
  const updateScale = useCallback(() => {
    if (!imageRef.current || !imageDimensions || !containerRef.current) return;

    const displayedWidth = imageRef.current.clientWidth;
    const displayedHeight = imageRef.current.clientHeight;

    setScale({
      x: displayedWidth / imageDimensions.width,
      y: displayedHeight / imageDimensions.height,
    });
  }, [imageDimensions]);

  // Handle image load
  const handleImageLoad = () => {
    setImageLoaded(true);
    updateScale();
  };

  // Update scale on resize
  useEffect(() => {
    if (!imageLoaded) return;

    const resizeObserver = new ResizeObserver(() => {
      updateScale();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [imageLoaded, updateScale]);

  // Draw highlights on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image || !imageLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match canvas size to image display size
    canvas.width = image.clientWidth;
    canvas.height = image.clientHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw rectangles for items with bounding boxes
    items.forEach((item, index) => {
      if (!item.bbox) return;

      const x = item.bbox.x0 * scale.x;
      const y = item.bbox.y0 * scale.y;
      const width = (item.bbox.x1 - item.bbox.x0) * scale.x;
      const height = (item.bbox.y1 - item.bbox.y0) * scale.y;

      const isHighlighted = highlightedIndex === index;

      // Fill
      ctx.fillStyle = isHighlighted
        ? 'rgba(59, 130, 246, 0.5)' // blue highlight
        : getConfidenceColor(item.confidence);
      ctx.fillRect(x, y, width, height);

      // Border
      ctx.strokeStyle = isHighlighted
        ? 'rgb(59, 130, 246)'
        : getConfidenceBorderColor(item.confidence);
      ctx.lineWidth = isHighlighted ? 3 : 2;
      ctx.strokeRect(x, y, width, height);
    });
  }, [items, scale, highlightedIndex, imageLoaded]);

  // Handle canvas click to find which item was clicked
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Find clicked item (reverse order to get top-most)
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      if (!item.bbox) continue;

      const x = item.bbox.x0 * scale.x;
      const y = item.bbox.y0 * scale.y;
      const width = (item.bbox.x1 - item.bbox.x0) * scale.x;
      const height = (item.bbox.y1 - item.bbox.y0) * scale.y;

      if (clickX >= x && clickX <= x + width && clickY >= y && clickY <= y + height) {
        onItemClick(i);
        return;
      }
    }
  };

  // Handle canvas mouse move for hover
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Find hovered item
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      if (!item.bbox) continue;

      const x = item.bbox.x0 * scale.x;
      const y = item.bbox.y0 * scale.y;
      const width = (item.bbox.x1 - item.bbox.x0) * scale.x;
      const height = (item.bbox.y1 - item.bbox.y0) * scale.y;

      if (mouseX >= x && mouseX <= x + width && mouseY >= y && mouseY <= y + height) {
        onItemHover(i);
        canvas.style.cursor = 'pointer';
        return;
      }
    }

    onItemHover(null);
    canvas.style.cursor = 'default';
  };

  const handleCanvasMouseLeave = () => {
    onItemHover(null);
  };

  if (!imageUrl) {
    return null;
  }

  return (
    <div className="highlighted-receipt" ref={containerRef}>
      <div className="highlighted-receipt__container">
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Receipt"
          className="highlighted-receipt__image"
          onLoad={handleImageLoad}
        />
        {imageLoaded && (
          <canvas
            ref={canvasRef}
            className="highlighted-receipt__canvas"
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={handleCanvasMouseLeave}
          />
        )}
      </div>
      <div className="highlighted-receipt__legend">
        <span className="highlighted-receipt__legend-item highlighted-receipt__legend-item--high">
          High confidence
        </span>
        <span className="highlighted-receipt__legend-item highlighted-receipt__legend-item--medium">
          Medium confidence
        </span>
        <span className="highlighted-receipt__legend-item highlighted-receipt__legend-item--low">
          Low confidence
        </span>
      </div>
    </div>
  );
};

export default HighlightedReceipt;
