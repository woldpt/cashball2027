import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { setupSocket } from './socket';

// Initialize DB (runs schema if needed)
import { db } from './db';
import roomRoutes from './routes/rooms';
import tacticsRoutes from './routes/tactics';
import authRoutes from './routes/auth';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// API Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

const httpServer = createServer(app);
export const io = setupSocket(httpServer);

// Basic routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CashBall Server is running' });
});

// Game Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/tactics', tacticsRoutes);

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
