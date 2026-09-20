/**
 * Utility functions for date parsing and formatting
 */

export const formatDateString = (dateStr: any): string => {
  if (!dateStr) return '-';
  const str = String(dateStr).trim();
  if (!str || str === '-') return '-';

  // If it's already in DD/MM/YYYY format, return it
  const ddmmyyyyRegex = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/;
  if (ddmmyyyyRegex.test(str)) {
    return str;
  }

  // Try parsing ISO Date or other formats
  try {
    const date = new Date(str);
    if (!isNaN(date.getTime())) {
      // Check if it is a valid date
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch (e) {}

  return str;
};
