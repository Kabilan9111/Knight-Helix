/**
 * Dynamic API URL resolver for SANCHALAN Mobile
 * Automatically adapts between localhost (laptop) and LAN IP (mobile phone on Wi-Fi).
 */
export const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && window.location.origin) {
    // When using Vite proxy or same-origin, empty string or origin works seamlessly
    return window.location.origin;
  }
  return 'http://localhost:3001';
};

export const API_URL = getApiUrl();
