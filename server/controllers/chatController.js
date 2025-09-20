// Chat controller to handle chat-related API endpoints

import { OpenAI } from 'openai';
import knowledgeBase from '../data/knowledgeBase.js';
import { formatKnowledgeBase } from '../utils/documentLoader.js';
import { initializeDocumentEmbeddings, getDocumentEmbeddings, findRelevantChunks } from '../utils/documentProcessor.js';

// Initialize OpenAI client
let openai;
try {
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
} catch (error) {
    console.error('Error initializing OpenAI client:', error.message);
}

// Initialize document embeddings when the controller is loaded
let embeddingsInitialized = false;
initializeDocumentEmbeddings()
    .then(() => {
        embeddingsInitialized = true;
        console.log('Document embeddings initialized successfully');
    })
    .catch(error => {
        console.error('Failed to initialize document embeddings:', error);
    });

/**
 * Process a chat message using OpenAI API
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const processMessage = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        if (!openai || !process.env.OPENAI_API_KEY || !process.env.OPENAI_API_KEY.startsWith('sk-') || process.env.OPENAI_API_KEY.startsWith('sk-proj-')) {
            console.error('Invalid or missing OpenAI API key');
            return res.status(500).json({
                error: 'OpenAI API configuration error. Please check your API key.',
                fallbackResponse: "I'm sorry, but there seems to be an issue with the API configuration. Please contact the administrator."
            });
        }

        let context = "";
        let sourceDocuments = [];

        // Check if embeddings were successfully initialized
        if (embeddingsInitialized) {
            try {
                // Get document embeddings and find relevant chunks for the query
                const documentEmbeddings = getDocumentEmbeddings();

                // Use a higher similarity threshold and more chunks for better context
                const relevantChunks = await findRelevantChunks(message, documentEmbeddings, 8, 0.6);

                // Format relevant chunks as context
                if (relevantChunks.length > 0) {
                    // Track source documents for citation
                    sourceDocuments = [...new Set(relevantChunks.map(chunk => chunk.documentName))];

                    // Format context with document sources
                    context = relevantChunks.map(({ chunk, documentName, similarity }) => {
                        // Include similarity score for debugging
                        console.log(`Using chunk from "${documentName}" with similarity: ${similarity.toFixed(2)}`);
                        return `From document "${documentName}":\n${chunk}`;
                    }).join('\n\n');

                    console.log(`Using ${relevantChunks.length} relevant chunks from ${sourceDocuments.length} documents`);
                } else {
                    // Fallback to static knowledge base if no relevant chunks found
                    console.log('No relevant document chunks found, falling back to static knowledge base');
                    context = formatKnowledgeBase(knowledgeBase);
                    sourceDocuments = ['Static Knowledge Base'];
                }
            } catch (error) {
                console.error('Error retrieving document context:', error);
                // Fallback to static knowledge base if there's an error
                context = formatKnowledgeBase(knowledgeBase);
                sourceDocuments = ['Static Knowledge Base (Error Fallback)'];
            }
        } else {
            // Embeddings not initialized, use static knowledge base
            console.log('Using static knowledge base as fallback (embeddings not initialized)');
            context = formatKnowledgeBase(knowledgeBase);
            sourceDocuments = ['Static Knowledge Base (Embeddings Not Initialized)'];
        }

        // Enhanced system prompt with better instructions
        const systemPrompt = `You are a helpful assistant for Masters Union college. Your name is Masters Union AI Assistant.

Answer questions based ONLY on the following information. If you don't know the answer based on this information, say that you don't have that information but you'd be happy to forward the question to the Masters Union team.

Be concise, accurate, and helpful. Format your responses using Markdown for better readability when appropriate.

CONTEXT:\n${context}`;

        // Call OpenAI API with the document context
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: message }
            ],
            temperature: 0.7,
            max_tokens: 500
        });

        const response = completion.choices[0].message.content;

        // Return response with metadata
        res.json({
            response,
            metadata: {
                sourceDocuments,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error processing message:', error);
        res.status(500).json({
            error: `Error processing message: ${error.message}`,
            fallbackResponse: "I'm sorry, but I'm having trouble processing your request right now. Please try again later."
        });
    }
};

/**
 * Health check endpoint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const healthCheck = (req, res) => {
    res.json({ status: 'ok' });
};