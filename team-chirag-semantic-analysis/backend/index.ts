// backend/index.ts
import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import passport from 'passport';
import './config/passport';
import authRoutes from './routes/authRoutes';
import chatRoutes from './routes/chat'; // New TypeScript chat system
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { initializeEnvironment } from './utils/environment';

// Initialize environment and load config
dotenv.config();

const startServer = async () => {
  try {
    console.log('🚀 Starting DSA Learning Backend...');
    console.log('Environment variables check:');
    console.log('- MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Missing');
    console.log('- DATABASE_NAME:', process.env.DATABASE_NAME ? '✅ Set' : '❌ Missing');
    console.log('- JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');
    console.log('- NODE_ENV:', process.env.NODE_ENV || 'development');
    
    // Initialize the application environment for the chat system
    const config = await initializeEnvironment();
    
    const app = express();
    const PORT = process.env.PORT || 5000;

    // CORS configuration - More permissive for debugging
    app.use(cors({
      origin: true, // Allow all origins temporarily
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Middleware
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    app.use(passport.initialize());

    // Health check
    app.get('/', (req: Request, res: Response) => {
      res.json({
        message: 'DSA Learning Backend is running with TypeScript!',
        timestamp: new Date().toISOString(),
        services: {
          auth: '✅ Active',
          chat: '✅ Active (TypeScript)',
          database: '✅ Connected'
        }
      });
    });

    // Routes
    app.use('/api/users', authRoutes);
    app.use('/auth', authRoutes);
    app.use('/api/chat', chatRoutes); // New TypeScript chat system

    // Error handling
    app.use(notFoundHandler);
    app.use(errorHandler);

    // MongoDB connection
    console.log('🔌 Connecting to MongoDB...');
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is required');
    }
    
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DATABASE_NAME
    });
    console.log('✅ MongoDB connected successfully');

    // Start server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/`);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
      server.close(async () => {
        try {
          await mongoose.connection.close();
          console.log('✅ Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during shutdown:', error);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
