import { useState, useRef } from 'react';
import { receiptService, type ParsedItem, type ReceiptScan } from '../../services/receiptService';
import ReceiptPreview from './ReceiptPreview';
import ParsedItemsList from './ParsedItemsList';
import ImageCropper from './ImageCropper';
import './Receipt.css';

interface ReceiptScannerProps {
  onItemsAdded: () => void;
  onClose: () => void;
}

type ScannerStep = 'capture' | 'crop' | 'preview' | 'review' | 'success';

const ReceiptScanner: React.FC<ReceiptScannerProps> = ({ onItemsAdded, onClose }) => {
  const [step, setStep] = useState<ScannerStep>('capture');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [croppedFile, setCroppedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ReceiptScan | null>(null);
  const [editedItems, setEditedItems] = useState<ParsedItem[]>([]);
  const [addedCount, setAddedCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const processSelectedFile = (file: File) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a JPEG, PNG, or WebP image.');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be smaller than 10MB.');
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setOriginalPreviewUrl(url);
    setPreviewUrl(url);
    setError(null);
    setStep('crop');
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    const croppedFileObj = new File([croppedBlob], selectedFile?.name || 'cropped-receipt.jpg', {
      type: 'image/jpeg',
    });
    setCroppedFile(croppedFileObj);

    // Revoke old preview URL if different from original
    if (previewUrl && previewUrl !== originalPreviewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const newPreviewUrl = URL.createObjectURL(croppedBlob);
    setPreviewUrl(newPreviewUrl);
    setStep('preview');
  };

  const handleSkipCrop = () => {
    setCroppedFile(null);
    setPreviewUrl(originalPreviewUrl);
    setStep('preview');
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleProcessReceipt = async () => {
    const fileToUpload = croppedFile || selectedFile;
    if (!fileToUpload) return;

    setIsProcessing(true);
    setError(null);

    const result = await receiptService.uploadReceipt(fileToUpload);

    setIsProcessing(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.data) {
      setScanResult(result.data);
      setEditedItems(result.data.items);
      setStep('review');
    }
  };

  const handleRetake = () => {
    if (previewUrl && previewUrl !== originalPreviewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    if (originalPreviewUrl) {
      URL.revokeObjectURL(originalPreviewUrl);
    }
    setSelectedFile(null);
    setCroppedFile(null);
    setPreviewUrl(null);
    setOriginalPreviewUrl(null);
    setScanResult(null);
    setEditedItems([]);
    setError(null);
    setStep('capture');
  };

  const handleItemsChange = (items: ParsedItem[]) => {
    setEditedItems(items);
  };

  const handleConfirm = async () => {
    if (!scanResult || editedItems.length === 0) return;

    setIsProcessing(true);
    setError(null);

    const result = await receiptService.confirmItems(scanResult.id, editedItems);

    setIsProcessing(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setAddedCount(result.data?.groceries.length || 0);
    setStep('success');
    onItemsAdded();
  };

  const renderCaptureStep = () => (
    <div className="receipt-scanner__capture">
      <div className="receipt-scanner__icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <line x1="7" y1="8" x2="17" y2="8" />
          <line x1="7" y1="12" x2="14" y2="12" />
          <line x1="7" y1="16" x2="11" y2="16" />
        </svg>
      </div>
      <h3>Scan Your Receipt</h3>
      <p>Take a photo or upload an image of your grocery receipt to automatically add items to your pantry.</p>

      <div className="receipt-scanner__buttons">
        <button className="receipt-scanner__btn receipt-scanner__btn--primary" onClick={handleCameraClick}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          Take Photo
        </button>
        <button className="receipt-scanner__btn receipt-scanner__btn--secondary" onClick={handleUploadClick}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Upload Image
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
    </div>
  );

  const renderCropStep = () => (
    <div className="receipt-scanner__crop-step">
      {originalPreviewUrl && (
        <ImageCropper
          imageUrl={originalPreviewUrl}
          onCropComplete={handleCropComplete}
          onSkip={handleSkipCrop}
        />
      )}
    </div>
  );

  const renderPreviewStep = () => (
    <div className="receipt-scanner__preview-step">
      <ReceiptPreview imageUrl={previewUrl} />
      <div className="receipt-scanner__preview-actions">
        <button
          className="receipt-scanner__btn receipt-scanner__btn--secondary"
          onClick={handleRetake}
          disabled={isProcessing}
        >
          Retake
        </button>
        <button
          className="receipt-scanner__btn receipt-scanner__btn--primary"
          onClick={handleProcessReceipt}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <span className="receipt-scanner__spinner" />
              Processing...
            </>
          ) : (
            'Process Receipt'
          )}
        </button>
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="receipt-scanner__review-step">
      <div className="receipt-scanner__review-header">
        <h3>Review Items</h3>
        {scanResult && (
          <span className="receipt-scanner__confidence">
            {Math.round(scanResult.confidence || 0)}% confidence
          </span>
        )}
      </div>
      <p className="receipt-scanner__review-hint">
        Edit item names, categories, or quantities before adding to your pantry.
      </p>

      <ParsedItemsList items={editedItems} onChange={handleItemsChange} />

      <div className="receipt-scanner__review-actions">
        <button
          className="receipt-scanner__btn receipt-scanner__btn--secondary"
          onClick={handleRetake}
          disabled={isProcessing}
        >
          Scan Another
        </button>
        <button
          className="receipt-scanner__btn receipt-scanner__btn--primary"
          onClick={handleConfirm}
          disabled={isProcessing || editedItems.length === 0}
        >
          {isProcessing ? (
            <>
              <span className="receipt-scanner__spinner" />
              Adding...
            </>
          ) : (
            `Add ${editedItems.length} Items`
          )}
        </button>
      </div>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="receipt-scanner__success">
      <div className="receipt-scanner__success-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>
      <h3>Items Added!</h3>
      <p>{addedCount} items have been added to your pantry.</p>
      <div className="receipt-scanner__success-actions">
        <button className="receipt-scanner__btn receipt-scanner__btn--secondary" onClick={handleRetake}>
          Scan Another Receipt
        </button>
        <button className="receipt-scanner__btn receipt-scanner__btn--primary" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );

  return (
    <div className="receipt-scanner">
      <div className="receipt-scanner__header">
        <h2>Receipt Scanner</h2>
        <button className="receipt-scanner__close" onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="receipt-scanner__error">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      <div className="receipt-scanner__content">
        {step === 'capture' && renderCaptureStep()}
        {step === 'crop' && renderCropStep()}
        {step === 'preview' && renderPreviewStep()}
        {step === 'review' && renderReviewStep()}
        {step === 'success' && renderSuccessStep()}
      </div>
    </div>
  );
};

export default ReceiptScanner;
