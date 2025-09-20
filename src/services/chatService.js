// Enhanced Chat service with RAG capabilities
import axios from 'axios';

// API base URL - adjust this based on your environment
const API_BASE_URL = 'http://localhost:5000/api';

// Generate a session ID for conversation tracking
const generateSessionId = () => {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
};

// Get or create session ID
const getSessionId = () => {
    let sessionId = localStorage.getItem('chatSessionId');
    if (!sessionId) {
        sessionId = generateSessionId();
        localStorage.setItem('chatSessionId', sessionId);
    }
    return sessionId;
};

// Process user message and return a response from the backend
export const processUserMessage = async (message, sessionId = null) => {
    try {
        const currentSessionId = sessionId || getSessionId();
        const response = await axios.post(`${API_BASE_URL}/chat`, { 
            message, 
            sessionId: currentSessionId 
        });
        
        return {
            response: response.data.response,
            sources: response.data.sources || [],
            metadata: response.data.metadata || {},
            sessionId: currentSessionId
        };
    } catch (error) {
        console.error('Error processing message:', error);

        // If the server returned a fallback response, use it
        if (error.response && error.response.data && error.response.data.fallbackResponse) {
            return {
                response: error.response.data.fallbackResponse,
                sources: [],
                metadata: { fallback: true, error: true },
                sessionId: sessionId || getSessionId()
            };
        }

        // Otherwise return a generic error message
        return {
            response: "I'm sorry, but I'm having trouble processing your request right now. Please try again later.",
            sources: [],
            metadata: { error: true, ragEnabled: false },
            sessionId: sessionId || getSessionId()
        };
    }
};

// Initialize RAG service
export const initializeRAG = async () => {
    try {
        const response = await axios.post(`${API_BASE_URL}/rag/initialize`);
        return response.data;
    } catch (error) {
        console.error('Error initializing RAG service:', error);
        throw error;
    }
};

// Get RAG service statistics
export const getRAGStats = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/rag/stats`);
        return response.data;
    } catch (error) {
        console.error('Error getting RAG stats:', error);
        throw error;
    }
};

// Search documents
export const searchDocuments = async (query, limit = 10) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/rag/search`, {
            params: { query, limit }
        });
        return response.data;
    } catch (error) {
        console.error('Error searching documents:', error);
        throw error;
    }
};

// Clear conversation history
export const clearConversation = async (sessionId) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/rag/clear-conversation`, {
            sessionId
        });
        return response.data;
    } catch (error) {
        console.error('Error clearing conversation:', error);
        throw error;
    }
};

// Check server health
export const checkHealth = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/health`);
        return response.data;
    } catch (error) {
        console.error('Error checking health:', error);
        throw error;
    }
};