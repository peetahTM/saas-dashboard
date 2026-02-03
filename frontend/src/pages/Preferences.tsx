import { useState, useEffect } from 'react';
import { MultiSelect, TagInput, LoadingSpinner } from '../components/common';
import { usePreferences } from '../context/PreferencesContext';
import type { UserPreferences, UnitSystem, Currency } from '../services/preferencesService';
import { CURRENCIES } from '../services/preferencesService';
import './Preferences.css';

const DIETARY_OPTIONS = [
  'Vegetarian',
  'Vegan',
  'Pescatarian',
  'Keto',
  'Paleo',
  'Gluten-Free',
  'Dairy-Free',
  'Low-Carb',
];

const ALLERGY_OPTIONS = [
  'Peanuts',
  'Tree Nuts',
  'Milk',
  'Eggs',
  'Wheat',
  'Soy',
  'Fish',
  'Shellfish',
  'Sesame',
];

const Preferences: React.FC = () => {
  const { preferences, isLoading, error, fetchPreferences, updatePreferences } = usePreferences();
  const [localPreferences, setLocalPreferences] = useState<UserPreferences>({
    dietaryRestrictions: [],
    allergies: [],
    dislikedIngredients: [],
    unitSystem: 'metric',
    currency: 'USD',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences);
    }
  }, [preferences]);

  const handleDietaryChange = (values: string[]) => {
    setLocalPreferences((prev) => ({
      ...prev,
      dietaryRestrictions: values,
    }));
    setSaveMessage(null);
  };

  const handleAllergiesChange = (values: string[]) => {
    setLocalPreferences((prev) => ({
      ...prev,
      allergies: values,
    }));
    setSaveMessage(null);
  };

  const handleDislikedChange = (tags: string[]) => {
    setLocalPreferences((prev) => ({
      ...prev,
      dislikedIngredients: tags,
    }));
    setSaveMessage(null);
  };

  const handleUnitSystemChange = (unitSystem: UnitSystem) => {
    setLocalPreferences((prev) => ({
      ...prev,
      unitSystem,
    }));
    setSaveMessage(null);
  };

  const handleCurrencyChange = (currency: Currency) => {
    setLocalPreferences((prev) => ({
      ...prev,
      currency,
    }));
    setSaveMessage(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    const result = await updatePreferences(localPreferences);

    if (result.success) {
      setSaveMessage({ type: 'success', text: 'Preferences saved successfully!' });
    } else {
      setSaveMessage({ type: 'error', text: result.error || 'Failed to save preferences' });
    }

    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="preferences-loading">
        <LoadingSpinner size="large" />
        <p>Loading preferences...</p>
      </div>
    );
  }

  if (error && !preferences) {
    return (
      <div className="preferences-error">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p className="error-message">{error}</p>
        <button className="retry-button" onClick={() => fetchPreferences()}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="preferences">
        <div className="preferences-header">
          <h2 className="preferences-title">User Preferences</h2>
          <p className="preferences-subtitle">
            Customize your experience by setting your dietary preferences and restrictions.
          </p>
        </div>

        <div className="preferences-form">
          <section className="preferences-section">
            <h3 className="section-heading">Dietary Restrictions</h3>
            <p className="section-description">
              Select any dietary restrictions that apply to you.
            </p>
            <MultiSelect
              label=""
              options={DIETARY_OPTIONS}
              selectedValues={localPreferences.dietaryRestrictions || []}
              onChange={handleDietaryChange}
            />
          </section>

          <section className="preferences-section">
            <h3 className="section-heading">Allergies</h3>
            <p className="section-description">
              Select any food allergies you have.
            </p>
            <MultiSelect
              label=""
              options={ALLERGY_OPTIONS}
              selectedValues={localPreferences.allergies || []}
              onChange={handleAllergiesChange}
            />
          </section>

          <section className="preferences-section">
            <h3 className="section-heading">Disliked Ingredients</h3>
            <p className="section-description">
              Add any ingredients you prefer to avoid.
            </p>
            <TagInput
              label=""
              tags={localPreferences.dislikedIngredients || []}
              onChange={handleDislikedChange}
              placeholder="Type an ingredient and press Enter"
            />
          </section>

          <section className="preferences-section">
            <h3 className="section-heading">Unit System</h3>
            <p className="section-description">
              Choose your preferred measurement units for quantities.
            </p>
            <div className="unit-toggle">
              <button
                type="button"
                className={`unit-toggle__btn ${localPreferences.unitSystem === 'metric' ? 'unit-toggle__btn--active' : ''}`}
                onClick={() => handleUnitSystemChange('metric')}
              >
                <span className="unit-toggle__label">Metric</span>
                <span className="unit-toggle__hint">kg, g, L, ml</span>
              </button>
              <button
                type="button"
                className={`unit-toggle__btn ${localPreferences.unitSystem === 'imperial' ? 'unit-toggle__btn--active' : ''}`}
                onClick={() => handleUnitSystemChange('imperial')}
              >
                <span className="unit-toggle__label">Imperial</span>
                <span className="unit-toggle__hint">lb, oz, cup, tbsp</span>
              </button>
            </div>
          </section>

          <section className="preferences-section">
            <h3 className="section-heading">Currency</h3>
            <p className="section-description">
              Choose your preferred currency for displaying savings and costs.
            </p>
            <select
              className="currency-select"
              value={localPreferences.currency}
              onChange={(e) => {
                const value = e.target.value;
                if (CURRENCIES.some(c => c.code === value)) {
                  handleCurrencyChange(value as Currency);
                }
              }}
            >
              {CURRENCIES.map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.symbol} - {curr.name} ({curr.code})
                </option>
              ))}
            </select>
          </section>

          <div className="preferences-actions">
            {saveMessage && (
              <div className={`save-message save-message-${saveMessage.type}`}>
                {saveMessage.type === 'success' ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                )}
                {saveMessage.text}
              </div>
            )}
            <button
              className="save-button"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <LoadingSpinner size="small" />
                  Saving...
                </>
              ) : (
                'Save Preferences'
              )}
            </button>
          </div>
      </div>
    </div>
  );
};

export default Preferences;
