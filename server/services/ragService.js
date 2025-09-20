// Advanced RAG (Retrieval-Augmented Generation) Service
import { OpenAI } from 'openai';
import vectorDatabase from './vectorDatabase.js';
import documentProcessor from './documentProcessor.js';
import { generateEmbedding } from '../utils/embeddingUtils.js';

class RAGService {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
        this.isInitialized = false;
        this.conversationMemory = new Map(); // Simple in-memory conversation storage
    }

    /**
     * Initialize the RAG service
     */
    async initialize() {
        try {
            console.log('Initializing RAG service...');
            
            // Initialize vector database
            const vectorDbReady = await vectorDatabase.initialize();
            if (!vectorDbReady) {
                console.log('Vector database not available, using fallback mode');
                this.isInitialized = true; // Still mark as initialized for fallback mode
                return true;
            }

            // Process and index documents
            await this.indexDocuments();

            this.isInitialized = true;
            console.log('RAG service initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize RAG service:', error);
            console.log('Using fallback mode without vector database');
            this.isInitialized = true; // Mark as initialized for fallback mode
            return true;
        }
    }

    /**
     * Index all documents into the vector database
     */
    async indexDocuments() {
        try {
            console.log('Indexing documents...');
            
            // Process all documents
            const documents = await documentProcessor.processAllDocuments();
            
            if (documents.length === 0) {
                console.warn('No documents found to index');
                return;
            }

            // Split documents into chunks
            const chunks = [];
            for (const doc of documents) {
                const docChunks = documentProcessor.splitIntoChunks(doc.content, {
                    chunkSize: 800,
                    chunkOverlap: 100,
                    preserveParagraphs: true
                });

                for (let i = 0; i < docChunks.length; i++) {
                    chunks.push({
                        id: `${doc.id}_chunk_${i}`,
                        content: docChunks[i],
                        metadata: {
                            ...doc.metadata,
                            chunkIndex: i,
                            totalChunks: docChunks.length,
                            parentDocumentId: doc.id
                        }
                    });
                }
            }

            console.log(`Created ${chunks.length} chunks from ${documents.length} documents`);

            // Add chunks to vector database
            await vectorDatabase.addDocuments(chunks);
            console.log('Documents indexed successfully');
        } catch (error) {
            console.error('Error indexing documents:', error);
            throw error;
        }
    }

    /**
     * Process a user query and generate response
     */
    async processQuery(query, sessionId = null, options = {}) {
        if (!this.isInitialized) {
            throw new Error('RAG service not initialized');
        }

        try {
            const {
                maxResults = 5,
                similarityThreshold = 0.7,
                includeConversationHistory = true,
                temperature = 0.7,
                maxTokens = 1000
            } = options;

            // Get conversation history if session ID provided
            const conversationHistory = sessionId ? 
                this.getConversationHistory(sessionId) : [];

            let relevantDocs = [];
            let context = "";

            // Check if vector database is available
            if (vectorDatabase.isInitialized) {
                // Retrieve relevant documents using vector search
                relevantDocs = await this.retrieveRelevantDocuments(
                    query, 
                    maxResults, 
                    similarityThreshold
                );
                context = this.buildContext(relevantDocs);
            } else {
                // Fallback: Use static knowledge base
                console.log('Using fallback mode - static knowledge base');
                context = "Using static Masters Union knowledge base. For more detailed information, please contact the administration.";
                relevantDocs = [{
                    metadata: { filename: 'Static Knowledge Base' },
                    content: 'Static knowledge base content',
                    distance: 0
                }];
            }

            // Generate response using OpenAI
            const response = await this.generateResponse(
                query,
                context,
                conversationHistory,
                { temperature, maxTokens }
            );

            // Store conversation if session ID provided
            if (sessionId) {
                this.storeConversation(sessionId, query, response);
            }

            return {
                response,
                sources: relevantDocs.map(doc => ({
                    filename: doc.metadata.filename,
                    chunkIndex: doc.metadata.chunkIndex || 0,
                    similarity: 1 - (doc.distance || 0), // Convert distance to similarity
                    content: doc.content ? doc.content.substring(0, 200) + '...' : 'Static knowledge base'
                })),
                metadata: {
                    query,
                    timestamp: new Date().toISOString(),
                    sessionId,
                    retrievedDocs: relevantDocs.length,
                    ragEnabled: vectorDatabase.isInitialized
                }
            };
        } catch (error) {
            console.error('Error processing query:', error);
            throw error;
        }
    }

    /**
     * Retrieve relevant documents using vector search
     */
    async retrieveRelevantDocuments(query, maxResults, similarityThreshold) {
        try {
            const results = await vectorDatabase.search(query, maxResults);
            
            // Filter by similarity threshold
            const relevantDocs = results.filter(doc => 
                (1 - doc.distance) >= similarityThreshold
            );

            console.log(`Retrieved ${relevantDocs.length} relevant documents for query`);
            return relevantDocs;
        } catch (error) {
            console.error('Error retrieving documents:', error);
            throw error;
        }
    }

    /**
     * Build context string from retrieved documents
     */
    buildContext(documents) {
        if (documents.length === 0) {
            return "No relevant information found in the knowledge base.";
        }

        const contextParts = documents.map((doc, index) => {
            return `[Source ${index + 1}: ${doc.metadata.filename}]\n${doc.content}`;
        });

        return contextParts.join('\n\n---\n\n');
    }

    /**
     * Generate response using OpenAI
     */
    async generateResponse(query, context, conversationHistory, options = {}) {
        try {
            const { temperature = 0.7, maxTokens = 1000 } = options;

            // Build conversation messages
            const messages = [
                {
                    role: "system",
                    content: `You are a helpful AI assistant for Masters Union. You have access to the Masters Union knowledge base to answer questions about the institution, programs, policies, and student life.

Instructions:
- Answer questions based ONLY on the provided context from the knowledge base
- If the context doesn't contain enough information to answer the question, say so clearly
- Be helpful, accurate, and concise
- Use markdown formatting when appropriate
- Cite sources when referencing specific information
- If asked about something not related to Masters Union, politely redirect to Masters Union topics

Context from knowledge base:
${context}`
                }
            ];

            // Add conversation history
            conversationHistory.forEach(entry => {
                messages.push({ role: "user", content: entry.query });
                messages.push({ role: "assistant", content: entry.response });
            });

            // Add current query
            messages.push({ role: "user", content: query });

            const completion = await this.openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: messages,
                temperature: temperature,
                max_tokens: maxTokens
            });

            return completion.choices[0].message.content;
        } catch (error) {
            console.error('Error generating response:', error);
            throw error;
        }
    }

    /**
     * Get conversation history for a session
     */
    getConversationHistory(sessionId) {
        return this.conversationMemory.get(sessionId) || [];
    }

    /**
     * Store conversation in memory
     */
    storeConversation(sessionId, query, response) {
        if (!this.conversationMemory.has(sessionId)) {
            this.conversationMemory.set(sessionId, []);
        }

        const history = this.conversationMemory.get(sessionId);
        history.push({ query, response, timestamp: new Date().toISOString() });

        // Keep only last 10 conversations per session
        if (history.length > 10) {
            history.splice(0, history.length - 10);
        }
    }

    /**
     * Clear conversation history for a session
     */
    clearConversationHistory(sessionId) {
        this.conversationMemory.delete(sessionId);
    }

    /**
     * Get service statistics
     */
    async getStats() {
        try {
            const vectorDbStats = await vectorDatabase.getStats();
            return {
                isInitialized: this.isInitialized,
                vectorDatabase: vectorDbStats,
                activeSessions: this.conversationMemory.size,
                totalConversations: Array.from(this.conversationMemory.values())
                    .reduce((total, history) => total + history.length, 0)
            };
        } catch (error) {
            console.error('Error getting stats:', error);
            throw error;
        }
    }

    /**
     * Search documents by keyword
     */
    async searchDocuments(keyword, limit = 10) {
        try {
            const results = await vectorDatabase.search(keyword, limit);
            return results.map(doc => ({
                id: doc.id,
                content: doc.content,
                metadata: doc.metadata,
                similarity: 1 - doc.distance
            }));
        } catch (error) {
            console.error('Error searching documents:', error);
            throw error;
        }
    }
}

export default new RAGService();
