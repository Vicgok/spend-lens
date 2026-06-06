import { TransactionType } from '../../types';

export interface ParsedTransaction {
  account: {
    type: 'ACCOUNT' | 'CARD' | 'WALLET' | null;
    number: string | null;    // Last 4 digits
    name: string | null;      // Wallet/card brand name
  };
  balance: {
    available: number | null;   // e.g. 2345.67
    outstanding: number | null; // Only for CARD type
  };
  transaction: {
    type: 'debit' | 'credit' | null;
    amount: number | null;      // e.g. 500.00
    merchant: string | null;    // UPI merchant or VPA
    referenceNo: string | null; // UPI reference number
  };
  date: string | null;          // ISO 8601 string or null
  confidence: 'high' | 'medium' | 'low';
  rawBody: string;
}
