import './common.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'medium', message }) => {
  return (
    <div className={`loading-spinner loading-spinner-${size}`}>
      <div className="loading-spinner-circle" />
      {message && <span className="loading-spinner-message">{message}</span>}
    </div>
  );
};

export default LoadingSpinner;
