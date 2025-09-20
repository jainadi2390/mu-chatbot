// Enhanced Chat routes for the Masters Union RAG chatbot API

import express from 'express';
import { 
    processMessage, 
    healthCheck, 
    initializeRAG, 
    getRAGStats, 
    searchDocuments, 
    clearConversation 
} from '../controllers/chatController.js';

const router = express.Router();

// Process chat messages with RAG
router.post('/chat', processMessage);

// Initialize RAG service
router.post('/rag/initialize', initializeRAG);

// Get RAG service statistics
router.get('/rag/stats', getRAGStats);

// Search documents
router.get('/rag/search', searchDocuments);

// Clear conversation history
router.post('/rag/clear-conversation', clearConversation);

// Health check endpoint
router.get('/health', healthCheck);

export default router;