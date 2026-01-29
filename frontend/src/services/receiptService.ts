import { api } from './api';
import type { ApiResponse } from './api';

import type { StorageLocation } from './groceryService';

export interface ParsedItem {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  storageLocation?: StorageLocation;
  confidence?: number;
  matchedSuggestionId?: number;
}

export interface ReceiptScan {
  id: number;
  confidence: number | null;
  itemCount: number;
  items: ParsedItem[];
}

export interface ReceiptScanSummary {
  id: number;
  status: string;
  confidence: number | null;
  itemCount: number;
  createdAt: string;
}

export interface ReceiptScanDetail {
  id: number;
  status: string;
  confidence: number | null;
  rawText: string;
  items: ParsedItem[];
  createdAt: string;
}

interface ConfirmResponse {
  message: string;
  groceries: Array<{
    id: number;
    name: string;
    category: string;
    quantity: number;
    unit: string;
    expiryDate: string;
    isConsumed: boolean;
    createdAt: string;
  }>;
}

interface HistoryResponse {
  scans: ReceiptScanSummary[];
  total: number;
}

interface ScanDetailResponse {
  scan: ReceiptScanDetail;
}

class ReceiptService {
  /**
   * Upload and process a receipt image
   */
  async uploadReceipt(file: File): Promise<ApiResponse<ReceiptScan>> {
    const formData = new FormData();
    formData.append('receipt', file);

    const token = localStorage.getItem('authToken');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch('http://localhost:3001/api/receipts/upload', {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.message || 'Failed to process receipt' };
      }

      return { data: data.scan };
    } catch (error) {
      return { error: 'Failed to upload receipt. Please check your connection.' };
    }
  }

  /**
   * Confirm parsed items and add them to pantry
   */
  async confirmItems(scanId: number, items: ParsedItem[]): Promise<ApiResponse<ConfirmResponse>> {
    const response = await api.request<ConfirmResponse>(`/api/receipts/${scanId}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ items }),
    });

    if (response.error) {
      return { error: response.error };
    }

    return { data: response.data };
  }

  /**
   * Get receipt scan history
   */
  async getHistory(limit = 20, offset = 0): Promise<ApiResponse<HistoryResponse>> {
    const response = await api.request<HistoryResponse>(
      `/api/receipts/history?limit=${limit}&offset=${offset}`
    );

    if (response.error) {
      return { error: response.error };
    }

    return { data: response.data };
  }

  /**
   * Get a specific receipt scan with full details
   */
  async getScan(scanId: number): Promise<ApiResponse<ReceiptScanDetail>> {
    const response = await api.request<ScanDetailResponse>(`/api/receipts/${scanId}`);

    if (response.error) {
      return { error: response.error };
    }

    return { data: response.data?.scan };
  }

  /**
   * Delete a receipt scan
   */
  async deleteScan(scanId: number): Promise<ApiResponse<void>> {
    return api.request<void>(`/api/receipts/${scanId}`, {
      method: 'DELETE',
    });
  }
}

export const receiptService = new ReceiptService();
