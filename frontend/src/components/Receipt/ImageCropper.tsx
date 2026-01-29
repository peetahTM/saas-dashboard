import { useState, useRef, useCallback } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageCropperProps {
  imageUrl: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
  onSkip: () => void;
}

const ImageCropper: React.FC<ImageCropperProps> = ({ imageUrl, onCropComplete, onSkip }) => {
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    x: 10,
    y: 10,
    width: 80,
    height: 80,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const onImageLoad = useCallback(() => {
    // Set initial crop to center 80% of the image
    setCrop({
      unit: '%',
      x: 10,
      y: 10,
      width: 80,
      height: 80,
    });
  }, []);

  const getCroppedImg = async (
    image: HTMLImageElement,
    pixelCrop: PixelCrop
  ): Promise<Blob> => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = pixelCrop.width * scaleX;
    canvas.height = pixelCrop.height * scaleY;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('No 2d context');
    }

    ctx.drawImage(
      image,
      pixelCrop.x * scaleX,
      pixelCrop.y * scaleY,
      pixelCrop.width * scaleX,
      pixelCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas is empty'));
          }
        },
        'image/jpeg',
        0.95
      );
    });
  };

  const handleCrop = async () => {
    if (!completedCrop || !imgRef.current) return;

    setIsProcessing(true);
    try {
      const croppedBlob = await getCroppedImg(imgRef.current, completedCrop);
      onCropComplete(croppedBlob);
    } catch (error) {
      console.error('Error cropping image:', error);
    }
    setIsProcessing(false);
  };

  return (
    <div className="image-cropper">
      <div className="image-cropper__instructions">
        <p>Drag to select the area containing your receipt items. This helps improve OCR accuracy.</p>
      </div>

      <div className="image-cropper__container">
        <ReactCrop
          crop={crop}
          onChange={(c) => setCrop(c)}
          onComplete={(c) => setCompletedCrop(c)}
          aspect={undefined}
        >
          <img
            ref={imgRef}
            src={imageUrl}
            alt="Receipt to crop"
            onLoad={onImageLoad}
            className="image-cropper__image"
          />
        </ReactCrop>
      </div>

      <div className="image-cropper__actions">
        <button
          className="receipt-scanner__btn receipt-scanner__btn--secondary"
          onClick={onSkip}
          disabled={isProcessing}
        >
          Skip Cropping
        </button>
        <button
          className="receipt-scanner__btn receipt-scanner__btn--primary"
          onClick={handleCrop}
          disabled={isProcessing || !completedCrop}
        >
          {isProcessing ? (
            <>
              <span className="receipt-scanner__spinner" />
              Cropping...
            </>
          ) : (
            'Apply Crop'
          )}
        </button>
      </div>
    </div>
  );
};

export default ImageCropper;
