import { useRef, useEffect, useState } from 'react';
import type { ParsedItem, BoundingBox, ImageDimensions } from '../../services/receiptService';

interface HighlightedReceiptProps {
  imageUrl: string;
  items: ParsedItem[];
  highlightedIndex: number | null;
  onItemClick: (index: number) => void;
  /** The dimensions of the processed image used for OCR (for accurate bbox scaling) */
  processedDimensions?: ImageDimensions;
}

function getConfidenceColor(confidence: number | undefined): string {
  if (!confidence) return 'rgba(156, 163, 175, 0.4)'; // gray
  if (confidence >= 0.8) return 'rgba(34, 197, 94, 0.4)'; // green
  if (confidence >= 0.5) return 'rgba(234, 179, 8, 0.4)'; // yellow
  return 'rgba(239, 68, 68, 0.4)'; // red
}

function getConfidenceBorderColor(confidence: number | undefined): string {
  if (!confidence) return 'rgb(156, 163, 175)'; // gray
  if (confidence >= 0.8) return 'rgb(34, 197, 94)'; // green
  if (confidence >= 0.5) return 'rgb(234, 179, 8)'; // yellow
  return 'rgb(239, 68, 68)'; // red
}

const HighlightedReceipt: React.FC<HighlightedReceiptProps> = ({
  imageUrl,
  items,
  highlightedIndex,
  onItemClick,
  processedDimensions,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const boxRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [imageSize, setImageSize] = useState({ width: 0, height: 0, naturalWidth: 0, naturalHeight: 0 });

  useEffect(() => {
    const updateImageSize = () => {
      if (imgRef.current) {
        setImageSize({
          width: imgRef.current.width,
          height: imgRef.current.height,
          naturalWidth: imgRef.current.naturalWidth,
          naturalHeight: imgRef.current.naturalHeight,
        });
      }
    };

    const img = imgRef.current;
    if (img) {
      if (img.complete) {
        updateImageSize();
      } else {
        img.addEventListener('load', updateImageSize);
        return () => img.removeEventListener('load', updateImageSize);
      }
    }
  }, [imageUrl]);

  // Scroll to highlighted item when it changes
  useEffect(() => {
    if (highlightedIndex !== null && imageContainerRef.current) {
      const boxElement = boxRefs.current.get(highlightedIndex);
      if (boxElement) {
        const container = imageContainerRef.current;
        const boxRect = boxElement.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // Check if box is outside visible area
        const isAbove = boxRect.top < containerRect.top;
        const isBelow = boxRect.bottom > containerRect.bottom;

        if (isAbove || isBelow) {
          boxElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [highlightedIndex]);

  const scaleBox = (bbox: BoundingBox) => {
    if (!imageSize.width || !imageSize.height) return null;

    // Use processed dimensions from backend if available (more accurate for OCR bboxes)
    // Otherwise fall back to the image's natural dimensions
    const referenceWidth = processedDimensions?.width || imageSize.naturalWidth;
    const referenceHeight = processedDimensions?.height || imageSize.naturalHeight;

    if (!referenceWidth || !referenceHeight) return null;

    const scaleX = imageSize.width / referenceWidth;
    const scaleY = imageSize.height / referenceHeight;

    return {
      left: bbox.x0 * scaleX,
      top: bbox.y0 * scaleY,
      width: (bbox.x1 - bbox.x0) * scaleX,
      height: (bbox.y1 - bbox.y0) * scaleY,
    };
  };

  const itemsWithBbox = items.filter((item) => item.bbox);

  return (
    <div className="highlighted-receipt" ref={containerRef}>
      <div className="highlighted-receipt__image-container" ref={imageContainerRef}>
        <img
          ref={imgRef}
          src={imageUrl}
          alt="Receipt with highlighted items"
          className="highlighted-receipt__image"
        />
        {imageSize.width > 0 && itemsWithBbox.map((item, idx) => {
          const originalIndex = items.indexOf(item);
          if (!item.bbox) return null;

          const scaledBox = scaleBox(item.bbox);
          if (!scaledBox) return null;

          const isHighlighted = highlightedIndex === originalIndex;

          return (
            <div
              key={idx}
              ref={(el) => {
                if (el) boxRefs.current.set(originalIndex, el);
              }}
              className={`highlighted-receipt__box ${isHighlighted ? 'highlighted-receipt__box--active' : ''}`}
              style={{
                left: scaledBox.left,
                top: scaledBox.top,
                width: scaledBox.width,
                height: scaledBox.height,
                backgroundColor: isHighlighted
                  ? 'rgba(59, 130, 246, 0.3)'
                  : getConfidenceColor(item.confidence),
                borderColor: isHighlighted
                  ? 'rgb(59, 130, 246)'
                  : getConfidenceBorderColor(item.confidence),
              }}
              onClick={() => onItemClick(originalIndex)}
              title={`${item.name} (${Math.round((item.confidence || 0) * 100)}% confidence)`}
            />
          );
        })}
      </div>
      <div className="highlighted-receipt__legend">
        <span className="highlighted-receipt__legend-item">
          <span className="highlighted-receipt__legend-color highlighted-receipt__legend-color--high" />
          High confidence
        </span>
        <span className="highlighted-receipt__legend-item">
          <span className="highlighted-receipt__legend-color highlighted-receipt__legend-color--medium" />
          Medium
        </span>
        <span className="highlighted-receipt__legend-item">
          <span className="highlighted-receipt__legend-color highlighted-receipt__legend-color--low" />
          Low
        </span>
      </div>
    </div>
  );
};

export default HighlightedReceipt;
