export const formatCurrency = (amount, isRevenue = false) => {
  if (!amount || amount <= 0) {
    return isRevenue ? 'Undisclosed' : 'Undisclosed';
  }

  // Format large numbers to Millions/Billions or Indian Crores
  if (amount >= 1000000000) {
    return `$${(amount / 1000000000).toFixed(2)}B`;
  }
  if (amount >= 1000000) {
    const usdM = (amount / 1000000).toFixed(1);
    const inrCr = (amount / 1200000).toFixed(0);
    return `$${usdM}M (₹${inrCr} Cr)`;
  }

  return `$${amount.toLocaleString()}`;
};

export const formatRating = (rating) => {
  if (!rating || rating <= 0) return 'NR';
  return Number(rating).toFixed(1);
};

export const formatViews = (views) => {
  if (!views || views <= 0) return '1 view';
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M views`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K views`;
  return `${views.toLocaleString()} ${views === 1 ? 'view' : 'views'}`;
};

export const formatYear = (dateString) => {
  if (!dateString) return '';
  return String(dateString).slice(0, 4);
};

export default { formatCurrency, formatRating, formatViews, formatYear };
