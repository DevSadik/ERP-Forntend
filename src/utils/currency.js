/**
 * Bangladesh Taka (BDT) currency formatter
 * All money in the app is displayed in ৳ (Taka)
 */

export const CURRENCY = {
  symbol: '৳',
  code: 'BDT',
  name: 'Bangladeshi Taka',
  locale: 'bn-BD',
};

/**
 * Format a number as BDT — e.g. ৳1,250.00
 */
export function formatBDT(amount, decimals = 2) {
  if (amount === null || amount === undefined || isNaN(amount)) return `${CURRENCY.symbol}0.00`;
  return `${CURRENCY.symbol}${Number(amount).toLocaleString('en-BD', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/**
 * Format compact — e.g. ৳1.2K or ৳2.5L (lakh)
 */
export function formatBDTCompact(amount) {
  if (!amount) return `${CURRENCY.symbol}0`;
  if (amount >= 10000000) return `${CURRENCY.symbol}${(amount / 10000000).toFixed(1)} কোটি`;
  if (amount >= 100000)   return `${CURRENCY.symbol}${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000)     return `${CURRENCY.symbol}${(amount / 1000).toFixed(1)}K`;
  return formatBDT(amount);
}
