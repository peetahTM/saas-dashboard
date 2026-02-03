import { describe, it, expect } from 'vitest';
import { getCurrencySymbol, CURRENCIES } from './preferencesService';
import type { Currency } from './preferencesService';

describe('preferencesService', () => {
  describe('CURRENCIES', () => {
    it('contains all expected currencies', () => {
      const expectedCodes: Currency[] = ['USD', 'EUR', 'GBP', 'SEK', 'CAD', 'AUD', 'JPY', 'CHF', 'NOK', 'DKK'];

      expectedCodes.forEach(code => {
        const currency = CURRENCIES.find(c => c.code === code);
        expect(currency).toBeDefined();
        expect(currency?.symbol).toBeTruthy();
        expect(currency?.name).toBeTruthy();
      });
    });

    it('has correct symbols for common currencies', () => {
      expect(CURRENCIES.find(c => c.code === 'USD')?.symbol).toBe('$');
      expect(CURRENCIES.find(c => c.code === 'EUR')?.symbol).toBe('\u20AC');
      expect(CURRENCIES.find(c => c.code === 'GBP')?.symbol).toBe('\u00A3');
      expect(CURRENCIES.find(c => c.code === 'SEK')?.symbol).toBe('SEK');
      expect(CURRENCIES.find(c => c.code === 'JPY')?.symbol).toBe('\u00A5');
    });
  });

  describe('getCurrencySymbol', () => {
    it('returns correct symbol for USD', () => {
      expect(getCurrencySymbol('USD')).toBe('$');
    });

    it('returns correct symbol for EUR', () => {
      expect(getCurrencySymbol('EUR')).toBe('\u20AC');
    });

    it('returns correct symbol for GBP', () => {
      expect(getCurrencySymbol('GBP')).toBe('\u00A3');
    });

    it('returns correct symbol for SEK', () => {
      expect(getCurrencySymbol('SEK')).toBe('SEK');
    });

    it('returns correct symbol for JPY', () => {
      expect(getCurrencySymbol('JPY')).toBe('\u00A5');
    });

    it('returns correct symbol for CAD', () => {
      expect(getCurrencySymbol('CAD')).toBe('C$');
    });

    it('returns correct symbol for AUD', () => {
      expect(getCurrencySymbol('AUD')).toBe('A$');
    });

    it('returns correct symbol for CHF', () => {
      expect(getCurrencySymbol('CHF')).toBe('CHF');
    });

    it('returns correct symbol for NOK', () => {
      expect(getCurrencySymbol('NOK')).toBe('NOK');
    });

    it('returns correct symbol for DKK', () => {
      expect(getCurrencySymbol('DKK')).toBe('DKK');
    });

    it('returns $ as fallback for unknown currency', () => {
      // TypeScript won't allow this normally, but testing defensive code
      expect(getCurrencySymbol('UNKNOWN' as Currency)).toBe('$');
    });
  });
});
