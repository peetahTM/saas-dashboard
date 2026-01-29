import type { StorageLocation } from '../../services/groceryService';

interface StorageLocationBadgeProps {
  location: StorageLocation;
  size?: 'small' | 'medium';
}

const LOCATION_CONFIG = {
  fridge: {
    label: 'Fridge',
    className: 'storage-badge--fridge',
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2a5 5 0 0 1 5 5v2a5 5 0 0 1-10 0V7a5 5 0 0 1 5-5z" />
        <path d="M12 13v4" />
        <path d="M10 15h4" />
      </svg>
    ),
  },
  freezer: {
    label: 'Freezer',
    className: 'storage-badge--freezer',
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07l14.14-14.14" />
      </svg>
    ),
  },
  pantry: {
    label: 'Pantry',
    className: 'storage-badge--pantry',
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M3 15h18M9 3v18" />
      </svg>
    ),
  },
};

const StorageLocationBadge: React.FC<StorageLocationBadgeProps> = ({ location, size = 'medium' }) => {
  const config = LOCATION_CONFIG[location] || LOCATION_CONFIG.pantry;

  return (
    <span className={`storage-badge ${config.className} storage-badge--${size}`}>
      {config.icon}
      {size !== 'small' && <span className="storage-badge__label">{config.label}</span>}
    </span>
  );
};

export default StorageLocationBadge;
