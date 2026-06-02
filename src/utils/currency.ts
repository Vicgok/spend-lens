import { CURRENCY_SYMBOL, DEFAULT_CURRENCY } from '../lib/constants';

/**
 * Format an amount with currency symbol.
 * e.g., formatCurrency(1500, 'INR') => '₹1,500'
 */
export function formatCurrency(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
  showDecimals: boolean = false
): string {
  const symbol = CURRENCY_SYMBOL[currency] || currency;
  const formatted = showDecimals
    ? amount.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : amount.toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
  return `${symbol}${formatted}`;
}

/**
 * Format amount with sign indicator.
 * e.g., formatSignedAmount(1500, 'income') => '+₹1,500'
 */
export function formatSignedAmount(
  amount: number,
  type: 'income' | 'expense' | 'transfer',
  currency: string = DEFAULT_CURRENCY
): string {
  const prefix = type === 'income' ? '+' : type === 'expense' ? '-' : '';
  return `${prefix}${formatCurrency(amount, currency)}`;
}

/**
 * Compact format for large numbers.
 * e.g., formatCompact(150000) => '₹1.5L'
 */
export function formatCompact(
  amount: number,
  currency: string = DEFAULT_CURRENCY
): string {
  const symbol = CURRENCY_SYMBOL[currency] || currency;
  if (currency === 'INR') {
    if (amount >= 10000000) return `${symbol}${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `${symbol}${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `${symbol}${(amount / 1000).toFixed(1)}K`;
  } else {
    if (amount >= 1000000000) return `${symbol}${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `${symbol}${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${symbol}${(amount / 1000).toFixed(1)}K`;
  }
  return formatCurrency(amount, currency);
}
