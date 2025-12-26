export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
    console.warn("⚠️ VITE_API_URL is not set! App is trying to connect to localhost:8080 which will fail on a live site.");
}
