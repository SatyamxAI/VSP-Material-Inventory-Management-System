/**
 * VSP Material Inventory Management System
 * Utility Helper Functions
 *
 * Provides common utility functions used across the application
 * including request number generation, date formatting,
 * email validation, and input sanitization.
 */

/**
 * Generates a unique material request number in 'REQ-YYYY-NNN' format.
 * Uses Date.now() for uniqueness — the trailing 3 digits of the
 * timestamp provide a sequential-looking suffix.
 *
 * @returns {string} Request number, e.g. 'REQ-2024-001'
 */
const generateRequestNumber = () => {
  const now = new Date();
  const year = now.getFullYear();
  // Use the last 3 digits of the millisecond timestamp for uniqueness
  const sequence = String(Date.now() % 1000).padStart(3, '0');
  return `REQ-${year}-${sequence}`;
};

/**
 * Formats a Date object into a readable string.
 * Returns 'YYYY-MM-DD HH:mm:ss' format suitable for display and storage.
 *
 * @param {Date|string} date - The date to format
 * @returns {string} Formatted date string, or 'Invalid Date' on failure
 */
const formatDate = (date) => {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      return 'Invalid Date';
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    return 'Invalid Date';
  }
};

/**
 * Validates an email address using a standard regex pattern.
 *
 * @param {string} email - The email address to validate
 * @returns {boolean} True if the email format is valid
 */
const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  // RFC 5322-compliant simplified pattern
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
};

/**
 * Sanitizes user input by trimming whitespace and escaping
 * HTML special characters to prevent basic XSS attacks.
 *
 * @param {string} input - The raw user input
 * @returns {string} Sanitized string safe for rendering
 */
const sanitizeInput = (input) => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  return input
    .trim()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

module.exports = {
  generateRequestNumber,
  formatDate,
  validateEmail,
  sanitizeInput,
};
