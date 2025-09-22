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
            return await handleFallbackResponse(req.body.message, res);
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
    const lowercaseMessage = message.toLowerCase();
    let response = "";
    let sources = [];

    // Simple keyword-based matching for better responses
    if (lowercaseMessage.includes('about') || lowercaseMessage.includes('what is') || lowercaseMessage.includes('overview')) {
        response = `**About Masters Union**

${knowledgeBase.about.overview}

**Mission**: ${knowledgeBase.about.mission}`;
        sources = [{ filename: 'About Masters Union', similarity: 0.9 }];
    } else if (lowercaseMessage.includes('program') || lowercaseMessage.includes('course') || lowercaseMessage.includes('mba') || lowercaseMessage.includes('tech')) {
        response = `**Programs at Masters Union**

**MBA Program**: ${knowledgeBase.programs.mba}

**Technology Programs**: ${knowledgeBase.programs.tech}

**Finance Program**: ${knowledgeBase.programs.finance}`;
        sources = [{ filename: 'Programs Information', similarity: 0.9 }];
    } else if (lowercaseMessage.includes('admission') || lowercaseMessage.includes('apply') || lowercaseMessage.includes('requirement')) {
        response = `**Admissions at Masters Union**

**Process**: ${knowledgeBase.admissions.process}

**Requirements**: ${knowledgeBase.admissions.requirements}

**Application**: ${knowledgeBase.admissions.deadlines}`;
        sources = [{ filename: 'Admissions Information', similarity: 0.9 }];
    } else if (lowercaseMessage.includes('faculty') || lowercaseMessage.includes('teacher') || lowercaseMessage.includes('professor')) {
        response = `**Faculty at Masters Union**

**Approach**: ${knowledgeBase.faculty.approach}

**Industry Experts**: ${knowledgeBase.faculty.experts}`;
        sources = [{ filename: 'Faculty Information', similarity: 0.9 }];
    } else if (lowercaseMessage.includes('campus') || lowercaseMessage.includes('location') || lowercaseMessage.includes('facilities')) {
        response = `**Campus Information**

**Location**: ${knowledgeBase.campus.location}

**Facilities**: ${knowledgeBase.campus.facilities}`;
        sources = [{ filename: 'Campus Information', similarity: 0.9 }];
    } else if (lowercaseMessage.includes('placement') || lowercaseMessage.includes('job') || lowercaseMessage.includes('career') || lowercaseMessage.includes('salary')) {
        response = `**Placement Information**

**Opportunities**: ${knowledgeBase.placements.opportunities}

**Companies**: ${knowledgeBase.placements.companies}

**Salary**: ${knowledgeBase.placements.salary}`;
        sources = [{ filename: 'Placement Information', similarity: 0.9 }];
    } else if (lowercaseMessage.includes('fee') || lowercaseMessage.includes('cost') || lowercaseMessage.includes('scholarship') || lowercaseMessage.includes('financial')) {
        response = `**Fees and Financial Aid**

**Fee Structure**: ${knowledgeBase.fees.structure}

**Scholarships**: ${knowledgeBase.fees.scholarships}`;
        sources = [{ filename: 'Fees Information', similarity: 0.9 }];
    } else if (lowercaseMessage.includes('contact') || lowercaseMessage.includes('email') || lowercaseMessage.includes('phone') || lowercaseMessage.includes('reach')) {
        response = `**Contact Masters Union**

**Email**: ${knowledgeBase.contact.email}
**Phone**: ${knowledgeBase.contact.phone}
**Website**: ${knowledgeBase.contact.website}`;
        sources = [{ filename: 'Contact Information', similarity: 0.9 }];
    } else if (lowercaseMessage.includes('hello') || lowercaseMessage.includes('hi') || lowercaseMessage.includes('hey')) {
        response = `Hello! 👋 Welcome to the Masters Union Chatbot!

I can help you with information about:
• **Programs** (MBA, Technology, Finance)
• **Admissions** process and requirements
• **Faculty** and teaching approach
• **Campus** and facilities
• **Placements** and career opportunities
• **Fees** and scholarships
• **Contact** information

What would you like to know about Masters Union?`;
        sources = [{ filename: 'Welcome Information', similarity: 1.0 }];
    } else {
        // General response for unrecognized queries
        response = `I'd be happy to help you with information about Masters Union! I can provide details about:\n\n• **Programs**: MBA, Technology, and Finance programs\n• **Admissions**: Application process and requirements\n• **Faculty**: Industry experts and teaching approach\n• **Campus**: Location and facilities in Gurugram\n• **Placements**: Career opportunities and companies\n• **Fees**: Cost structure and scholarships\n• **Contact**: How to reach Masters Union\n\nPlease ask me about any specific topic you'd like to know more about!`;
        sources = [{ filename: 'General Information', similarity: 0.8 }];
    }

    res.json({
        response: response,
        sources: sources,
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