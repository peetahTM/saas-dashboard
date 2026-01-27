import { useState } from 'react';

interface GeneratePlanButtonProps {
  onGenerate: () => Promise<void>;
}

const GeneratePlanButton: React.FC<GeneratePlanButtonProps> = ({ onGenerate }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleClick = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      await onGenerate();
      setMessage({ type: 'success', text: 'Meal plan generated successfully!' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to generate meal plan',
      });
    } finally {
      setIsLoading(false);
    }

    // Clear message after 3 seconds
    setTimeout(() => {
      setMessage(null);
    }, 3000);
  };

  return (
    <div className="generate-plan-button-container">
      <button
        className="generate-plan-button"
        onClick={handleClick}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <svg
              className="generate-plan-button__spinner"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
            </svg>
            <span>Generating...</span>
          </>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            <span>Generate Meal Plan</span>
          </>
        )}
      </button>
      {message && (
        <div className={`generate-plan-message generate-plan-message--${message.type}`}>
          {message.text}
        </div>
      )}
    </div>
  );
};

export default GeneratePlanButton;
