interface ReceiptPreviewProps {
  imageUrl: string | null;
}

const ReceiptPreview: React.FC<ReceiptPreviewProps> = ({ imageUrl }) => {
  if (!imageUrl) {
    return null;
  }

  return (
    <div className="receipt-preview">
      <div className="receipt-preview__image-container">
        <img src={imageUrl} alt="Receipt preview" className="receipt-preview__image" />
      </div>
      <p className="receipt-preview__hint">
        Make sure the receipt text is clearly visible and well-lit.
      </p>
    </div>
  );
};

export default ReceiptPreview;
