import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import passwordRoutes from './routes/passwordRoutes';
import { protect } from './middleware/auth.middleware';
import { AuthRequest } from './types/request';
import { initDb } from './models/db';

// Load env variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/passwords', passwordRoutes);

// Protected health check route (for testing auth middleware)
app.get('/api/health', protect, (req: AuthRequest, res) => {
  res.json({
    status: 'healthy',
    user: req.user,
  });
});

// Basic Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err,
  });
});

const PORT = process.env.PORT || 5000;

// Initialize database and start the server
const startServer = async () => {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize database. Server cannot start.', error);
    process.exit(1);
  }
};

startServer();
