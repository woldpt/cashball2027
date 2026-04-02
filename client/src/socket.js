import { io } from 'socket.io-client';

// 'http://localhost:3000' will be used directly during development,
// replace with relative or env var for production.
const VITE_API_URL = import.meta.env.VITE_API_URL || '';

export const socket = io(VITE_API_URL, {
  autoConnect: false // We will connect manually when entering the app
});
