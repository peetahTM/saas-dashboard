import { useState, useEffect, useRef } from 'react';
import { groceryService } from '../../services/groceryService';
import type { GrocerySuggestion } from '../../services/groceryService';

interface GroceryAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: GrocerySuggestion) => void;
  placeholder?: string;
}

const GroceryAutocomplete: React.FC<GroceryAutocompleteProps> = ({
  value,
  onChange,
  onSelect,
  placeholder = 'Enter grocery name...',
}) => {
  const [suggestions, setSuggestions] = useState<GrocerySuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const debounceRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);

    debounceRef.current = window.setTimeout(async () => {
      const response = await groceryService.getSuggestions(value);

      if (response.data) {
        setSuggestions(response.data);
        setIsOpen(response.data.length > 0);
        setHighlightedIndex(-1);
      } else {
        setSuggestions([]);
        setIsOpen(false);
      }

      setIsLoading(false);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleSelect = (suggestion: GrocerySuggestion) => {
    onChange(suggestion.name);
    onSelect(suggestion);
    setIsOpen(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSelect(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  return (
    <div className="grocery-autocomplete" ref={containerRef}>
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => value.length >= 2 && suggestions.length > 0 && setIsOpen(true)}
        placeholder={placeholder}
        className="grocery-autocomplete__input"
        autoComplete="off"
      />
      {isLoading && (
        <div className="grocery-autocomplete__loading">
          <span className="grocery-autocomplete__spinner" />
        </div>
      )}
      {isOpen && suggestions.length > 0 && (
        <ul className="grocery-autocomplete__dropdown">
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.id}
              className={`grocery-autocomplete__option ${
                index === highlightedIndex ? 'grocery-autocomplete__option--highlighted' : ''
              }`}
              onClick={() => handleSelect(suggestion)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <span className="grocery-autocomplete__option-name">{suggestion.name}</span>
              <span className="grocery-autocomplete__option-category">{suggestion.category}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default GroceryAutocomplete;
