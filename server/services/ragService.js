// Advanced RAG (Retrieval-Augmented Generation) Service
import { OpenAI } from 'openai';
import vectorDatabase from './vectorDatabase.js';
import documentProcessor from './documentProcessor.js';
import { generateEmbedding } from '../utils/embeddingUtils.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class RAGService {
    constructor() {
        // Initialize OpenAI API client if API key is available
        if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('disabled')) {
            try {
                this.openai = new OpenAI({
                    apiKey: process.env.OPENAI_API_KEY,
                });
                console.log('OpenAI API client initialized successfully');
            } catch (error) {
                console.log('Error initializing OpenAI client:', error.message);
                this.openai = null;
            }
        } else {
            console.log('OpenAI API key not configured, using fallback mode only');
            this.openai = null;
        }

        this.isInitialized = false;
        this.conversationMemory = new Map(); // Simple in-memory conversation storage
        this.infoTxtContent = null; // Cache for info.txt content
    }

    /**
     * Load and cache the info.txt content
     */
    loadInfoTxtContent() {
        if (this.infoTxtContent) {
            return this.infoTxtContent;
        }

        try {
            // Try to load from server/data/documents/info.txt first
            const infoPath = join(__dirname, '../data/documents/info.txt');
            this.infoTxtContent = readFileSync(infoPath, 'utf8');
            console.log('Loaded info.txt from server/data/documents/');
        } catch (error) {
            try {
                // Fallback to root directory info.txt
                const rootInfoPath = join(__dirname, '../../info.txt');
                this.infoTxtContent = readFileSync(rootInfoPath, 'utf8');
                console.log('Loaded info.txt from root directory');
            } catch (fallbackError) {
                console.error('Could not load info.txt from any location:', fallbackError);
                this.infoTxtContent = 'Masters Union knowledge base not available.';
            }
        }

        return this.infoTxtContent;
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
                // Fallback: Use info.txt content
                console.log('Using fallback mode - info.txt knowledge base');
                context = this.loadInfoTxtContent();
                relevantDocs = [{
                    metadata: { filename: 'Masters Union Information Guide' },
                    content: 'Comprehensive Masters Union knowledge base',
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
                    content: doc.content ? doc.content.substring(0, 200) + '...' : 'Masters Union knowledge base'
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
     * Generate response using OpenAI API or fallback to static responses
     */
    async generateResponse(query, context, conversationHistory, options = {}) {
        try {
            const { temperature = 0.7, maxTokens = 1000 } = options;

            // Check if OpenAI client is available and API key is valid
            if (!this.openai || !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('disabled')) {
                console.log('OpenAI not available, using fallback responses');
                return await this.generateFallbackResponse(query, context);
            }

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
                model: process.env.AI_MODEL || "gpt-3.5-turbo",
                messages: messages,
                temperature: temperature,
                max_tokens: maxTokens
            });

            return completion.choices[0].message.content;
        } catch (error) {
            console.error('Error generating response:', error);

            // Check if it's an authentication error
            if (error.status === 401 || error.code === 'invalid_api_key') {
                console.log('OpenAI API authentication failed, using fallback response');
                return await this.generateFallbackResponse(query, context);
            }

            // For other errors, also use fallback
            console.log('OpenAI API call failed, using fallback response');
            return await this.generateFallbackResponse(query, context);
        }
    }

    /**
     * Generate a fallback response when OpenAI is not available
     */
    async generateFallbackResponse(query, context) {
        const lowercaseQuery = query.toLowerCase();

        // Load the comprehensive info.txt content
        const infoContent = this.loadInfoTxtContent();

        // Simple keyword-based responses using info.txt content
        if (lowercaseQuery.includes('hello') || lowercaseQuery.includes('hi') || lowercaseQuery.includes('hey')) {
            return `Hello! 👋 Welcome to the Masters Union Chatbot!

I can help you with comprehensive information about:
• **Programs** (MBA, Technology, Finance)
• **Admissions** process and requirements
• **Faculty** and industry experts
• **Campus** facilities and location
• **Student Life** (councils, clubs, housing)
• **Career Services** and placements
• **Fees** and financial aid
• **Policies** and conduct guidelines
• **Contact** information

What would you like to know about Masters Union?`;
        } else {
            // Return relevant excerpts from info.txt based on query keywords
            const keywords = this.extractKeywords(lowercaseQuery);
            const relevantContent = this.findRelevantContent(infoContent, keywords);

            return `**Masters Union Information**

${relevantContent}

*Based on our comprehensive knowledge base. Ask specific questions for more details.*`;
        }
    }

    /**
     * Extract keywords from user query
     */
    extractKeywords(query) {
        const importantKeywords = ['program', 'mba', 'technology', 'finance', 'admission', 'faculty', 'campus', 'hostel', 'student', 'career', 'placement', 'fee', 'scholarship', 'contact', 'council', 'club'];
        return importantKeywords.filter(keyword => query.includes(keyword));
    }

    /**
     * Find relevant content from info.txt based on keywords
     */
    findRelevantContent(content, keywords) {
        if (keywords.length === 0) {
            // Return general overview
            const lines = content.split('\n').slice(0, 10);
            return lines.join('\n').substring(0, 500) + '...';
        }

        // Find sections that contain the keywords
        const lines = content.split('\n');
        const relevantLines = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].toLowerCase();
            if (keywords.some(keyword => line.includes(keyword))) {
                // Add context: previous line, current line, and next few lines
                const start = Math.max(0, i - 1);
                const end = Math.min(lines.length, i + 5);
                relevantLines.push(...lines.slice(start, end));
                break; // Get first relevant section
            }
        }

        if (relevantLines.length > 0) {
            return relevantLines.join('\n').substring(0, 800) + (relevantLines.join('\n').length > 800 ? '...' : '');
        }

        return 'Masters Union is a pioneering educational institution focused on learning by doing with industry experts as faculty. Please ask specific questions about programs, admissions, faculty, campus life, or any other aspect.';
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