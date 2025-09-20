// Chat routes for the Masters Union chatbot API

import express from 'express';
import { processMessage, healthCheck } from '../controllers/chatController.js';

const router = express.Router();

// Process chat messages
router.post('/chat', processMessage);

// Health check endpoint
router.get('/health', healthCheck);

export default router;