// Enhanced Chat controller with RAG capabilities

import ragService from '../services/ragService.js';
import knowledgeBase from '../data/knowledgeBase.js';
import { formatKnowledgeBase } from '../utils/documentLoader.js';

// RAG service initialization status
let ragInitialized = false;

/**
 * Process a chat message using RAG service
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const processMessage = async (req, res) => {
    try {
        const { message, sessionId } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Check if RAG service is initialized
        if (!ragInitialized) {
            console.log('RAG service not initialized, using static knowledge base');
            return await handleFallbackResponse(message, res);
        }

        // Process query using RAG service
        const result = await ragService.processQuery(message, sessionId, {
            maxResults: 5,
            similarityThreshold: 0.6,
            includeConversationHistory: true,
            temperature: 0.7,
            maxTokens: 1000
        });

        // Return enhanced response with sources
        res.json({
            response: result.response,
            sources: result.sources,
            metadata: {
                ...result.metadata,
                ragEnabled: true,
                sessionId: sessionId || null
            }
        });

    } catch (error) {
        console.error('Error processing message:', error);
        
        // Fallback to static knowledge base on error
        try {
            return await handleFallbackResponse(message, res);
        } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
            res.status(500).json({
                error: 'Service temporarily unavailable',
                fallbackResponse: "I'm sorry, but I'm having trouble processing your request right now. Please try again later."
            });
        }
    }
};

/**
 * Handle fallback response using static knowledge base
 */
async function handleFallbackResponse(message, res) {
    const context = formatKnowledgeBase(knowledgeBase);
    
    // Simple response generation for fallback
    const fallbackResponse = `Based on the Masters Union knowledge base:

${context}

Please note: This is a basic response. For more detailed and accurate information, please contact the Masters Union administration directly.`;

    res.json({
        response: fallbackResponse,
        sources: [{ filename: 'Static Knowledge Base', similarity: 1.0 }],
        metadata: {
            query: message,
            timestamp: new Date().toISOString(),
            ragEnabled: false,
            fallback: true
        }
    });
}

/**
 * Initialize RAG service
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const initializeRAG = async (req, res) => {
    try {
        if (ragInitialized) {
            return res.json({ 
                status: 'already_initialized',
                message: 'RAG service is already initialized'
            });
        }

        console.log('Initializing RAG service...');
        const success = await ragService.initialize();
        
        if (success) {
            ragInitialized = true;
            res.json({ 
                status: 'success',
                message: 'RAG service initialized successfully'
            });
        } else {
            res.status(500).json({
                status: 'error',
                message: 'Failed to initialize RAG service'
            });
        }
    } catch (error) {
        console.error('Error initializing RAG service:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to initialize RAG service',
            error: error.message
        });
    }
};

/**
 * Get RAG service statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getRAGStats = async (req, res) => {
    try {
        if (!ragInitialized) {
            return res.json({
                status: 'not_initialized',
                ragEnabled: false
            });
        }

        const stats = await ragService.getStats();
        res.json({
            status: 'success',
            ragEnabled: true,
            stats
        });
    } catch (error) {
        console.error('Error getting RAG stats:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get RAG statistics',
            error: error.message
        });
    }
};

/**
 * Search documents
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const searchDocuments = async (req, res) => {
    try {
        const { query, limit = 10 } = req.query;

        if (!query) {
            return res.status(400).json({ error: 'Query parameter is required' });
        }

        if (!ragInitialized) {
            return res.status(503).json({
                error: 'RAG service not initialized',
                message: 'Please initialize the RAG service first'
            });
        }

        const results = await ragService.searchDocuments(query, parseInt(limit));
        res.json({
            query,
            results,
            count: results.length
        });
    } catch (error) {
        console.error('Error searching documents:', error);
        res.status(500).json({
            error: 'Failed to search documents',
            message: error.message
        });
    }
};

/**
 * Clear conversation history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const clearConversation = (req, res) => {
    try {
        const { sessionId } = req.body;

        if (!sessionId) {
            return res.status(400).json({ error: 'Session ID is required' });
        }

        ragService.clearConversationHistory(sessionId);
        res.json({
            status: 'success',
            message: 'Conversation history cleared'
        });
    } catch (error) {
        console.error('Error clearing conversation:', error);
        res.status(500).json({
            error: 'Failed to clear conversation',
            message: error.message
        });
    }
};

/**
 * Health check endpoint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const healthCheck = (req, res) => {
    res.json({ 
        status: 'ok',
        ragEnabled: ragInitialized,
        timestamp: new Date().toISOString()
    });
};