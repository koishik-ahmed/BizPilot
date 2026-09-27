/**
 * BizPilot Currency Formatting Utility
 * Standardized to Bangladeshi Taka (৳ / Tk)
 */

export const CURRENCY_SYMBOL = '৳';

export const formatCurrency = (amount, options = {}) => {
  const val = parseFloat(amount || 0);
  const decimals = options.decimals !== undefined ? options.decimals : 2;
  const showSymbol = options.showSymbol !== undefined ? options.showSymbol : true;

  const formatted = val.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });

  return showSymbol ? `৳${formatted}` : formatted;
};

export const formatCompactCurrency = (amount) => {
  const val = parseFloat(amount || 0);
  if (val >= 10000000) return `৳${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `৳${(val / 100000).toFixed(2)} Lakh`;
  if (val >= 1000) return `৳${(val / 1000).toFixed(1)}k`;
  return `৳${val.toFixed(0)}`;
};

