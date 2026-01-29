import { useMemo } from 'react';

interface ExpiryBadgeProps {
  expiryDate: string;
}

type ExpiryStatus = 'expired' | 'critical' | 'warning' | 'fresh';

function getExpiryStatus(expiryDate: string): { status: ExpiryStatus; days: number } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  const diffTime = expiry.getTime() - today.getTime();
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (days < 0) {
    return { status: 'expired', days };
  } else if (days <= 2) {
    return { status: 'critical', days };
  } else if (days <= 5) {
    return { status: 'warning', days };
  } else {
    return { status: 'fresh', days };
  }
}

function getExpiryText(status: ExpiryStatus, days: number): string {
  if (status === 'expired') {
    return 'Expired';
  } else if (status === 'fresh') {
    return 'Fresh';
  } else {
    return `${days} day${days !== 1 ? 's' : ''}`;
  }
}

const ExpiryBadge: React.FC<ExpiryBadgeProps> = ({ expiryDate }) => {
  const { status, text } = useMemo(() => {
    const { status, days } = getExpiryStatus(expiryDate);
    const text = getExpiryText(status, days);
    return { status, text };
  }, [expiryDate]);

  return (
    <span className={`expiry-badge expiry-badge--${status}`}>
      {text}
    </span>
  );
};

export default ExpiryBadge;
