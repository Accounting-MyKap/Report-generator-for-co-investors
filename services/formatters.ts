/**
 * Converts a string to Title Case.
 * @param str The string to convert.
 * @returns The Title Cased string.
 */
export const toTitleCase = (str: string): string => {
  if (!str) return '';
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

/**
 * Parses a string or number into a number, handling currency symbols,
 * commas, and accounting-style negative numbers in parentheses.
 * @param value The value to parse.
 * @returns A number, or null if parsing is not possible.
 */
export const parseCurrency = (value: any): number | null => {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value !== 'string' || value.trim() === '') {
    return null;
  }

  // Handle accounting format for negative numbers, e.g., (1,234.56)
  const isNegative = value.includes('(') && value.includes(')');
  
  // Remove all non-numeric characters except for the decimal point and the minus sign
  const cleanedString = value.replace(/[^0-9.-]+/g, '');
  
  if (cleanedString === '' || cleanedString === '.' || cleanedString === '-') {
    return null;
  }
  
  const num = Number(cleanedString);

  if (isNaN(num)) {
    return null;
  }
  
  // If the original string used parentheses and the parsed number is positive, make it negative.
  if (isNegative && num > 0) {
    return -num;
  }

  return num;
};

/**
 * Formats a value as a USD currency string. If the value cannot be parsed
 * as a number, the original value is returned as a string.
 * @param value The value to format.
 * @returns A formatted currency string or the original value.
 */
export const formatCurrency = (value: any): string => {
  const number = parseCurrency(value);
  
  if (number === null) {
    return String(value ?? ''); // Return original value if it couldn't be parsed
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(number);
};

/**
 * Parses a string or number representing a percentage into a number.
 * @param value The value to parse (e.g., '9.20%', 8.5).
 * @returns A number, or null if parsing fails.
 */
export const parsePercent = (value: any): number | null => {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value !== 'string' || value.trim() === '') {
    return null;
  }
  const cleanedString = value.replace(/[%]/g, '').trim();
  const num = parseFloat(cleanedString);
  return isNaN(num) ? null : num;
};
