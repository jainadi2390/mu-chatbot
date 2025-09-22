import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import path from 'path';
import { fileURLToPath } from 'url';
import ragService from './services/ragService.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Setup __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rate limiting
const rateLimiter = new RateLimiterMemory({
    keyPrefix: 'middleware',
    points: 100, // Number of requests
    duration: 60, // Per 60 seconds
});

// Rate limiting middleware
const rateLimiterMiddleware = async (req, res, next) => {
    try {
        await rateLimiter.consume(req.ip);
        next();
    } catch (rejRes) {
        res.status(429).json({
            error: 'Too Many Requests',
            message: 'Rate limit exceeded. Please try again later.'
        });
    }
};

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Gzip compression
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined'));
app.use(rateLimiterMiddleware);

// Import routes
import chatRoutes from './routes/chatRoutes.js';

// Use routes
app.use('/api', chatRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: 'The requested endpoint does not exist'
    });
});

// Initialize RAG service on startup (optional - can be done via API)
const initializeRAGOnStartup = process.env.INITIALIZE_RAG_ON_STARTUP === 'true';

if (initializeRAGOnStartup) {
    console.log('Initializing RAG service on startup...');
    ragService.initialize()
        .then((success) => {
            if (success) {
                console.log('✅ RAG service initialized successfully');
            } else {
                console.log('⚠️ RAG service initialization failed - will use fallback mode');
            }
        })
        .catch((error) => {
            console.error('❌ Error initializing RAG service:', error);
        });
} else {
    console.log('RAG service will be initialized on first API call');
}

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📚 RAG Chatbot API available at http://localhost:${PORT}/api`);
    console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📊 RAG Stats: http://localhost:${PORT}/api/rag/stats`);
});