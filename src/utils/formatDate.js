export const formatDate = (dateString) => {
  if (!dateString) return 'Release Date TBD';
  try {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-US', options);
  } catch {
    return dateString;
  }
};

export const formatYear = (dateString) => {
  if (!dateString) return '';
  return dateString.slice(0, 4);
};

export default formatDate;
