// Utility functions for safe operations

// Safe clipboard copy function
export const safeCopyToClipboard = async (text: string): Promise<boolean> => {
  try {
    // Check if clipboard API is available
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback method for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
      } catch (err) {
        document.body.removeChild(textArea);
        console.warn('Fallback copy method failed:', err);
        return false;
      }
    }
  } catch (err) {
    console.warn('Clipboard operation failed:', err);
    return false;
  }
};

// Safe timestamp conversion for Firebase Timestamps
export const safeToDate = (timestamp: any): Date => {
  if (timestamp && typeof timestamp.toDate === 'function') {
    try {
      return timestamp.toDate();
    } catch (error) {
      console.warn('Failed to convert timestamp:', error);
      return new Date();
    }
  }
  
  // If it's already a Date object
  if (timestamp instanceof Date) {
    return timestamp;
  }
  
  // If it's a string that can be parsed as a date
  if (typeof timestamp === 'string') {
    const parsed = new Date(timestamp);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }
  
  // If it's a number (Unix timestamp)
  if (typeof timestamp === 'number') {
    return new Date(timestamp);
  }
  
  // Fallback to current date
  console.warn('Unable to convert timestamp, using current date:', timestamp);
  return new Date();
};

// Notification helper for operations
export const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  // Simple console notification - can be enhanced with toast library later
  const prefix = {
    success: '✅',
    error: '❌',
    info: 'ℹ️'
  }[type];
  
  console.log(`${prefix} ${message}`);
  
  // Could implement toast notifications here
  // For now, just use console.log
};
