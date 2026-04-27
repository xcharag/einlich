import axios from 'axios';

/* In development, Vite proxies /api → localhost:3001.
   In production, nginx proxies /api → backend:3001.
   VITE_API_URL can override for other setups.          */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',
});

export default api;
