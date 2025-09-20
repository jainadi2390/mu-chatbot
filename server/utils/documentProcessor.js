// Document processor for loading, chunking, and embedding documents

import path from 'path';
import { fileURLToPath } from 'url';
import { loadDocumentsFromDirectory, loadDocumentFromFile } from './documentLoader.js';
import { generateEmbedding, splitTextIntoChunks } from './embeddingUtils.js';

// Setup __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache for document embeddings
let documentEmbeddingsCache = null;

/**
 * Process a document by splitting it into chunks and generating embeddings
 * @param {String} documentName - Name of the document
 * @param {String} content - Document content
 * @returns {Promise<Array<{chunk: string, embedding: Array<number>, documentName: string}>>} - Array of processed chunks
 */
export const processDocument = async (documentName, content) => {
    try {
        // Split document into chunks
        const chunks = splitTextIntoChunks(content);

        // Process each chunk with error handling
        const processedChunks = [];
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            try {
                const embedding = await generateEmbedding(chunk);
                processedChunks.push({
                    chunk,
                    embedding,
                    documentName,
                    chunkIndex: i
                });
            } catch (error) {
                console.error(`Failed to generate embedding for chunk ${i} in ${documentName}:`, error.message);
                // Skip this chunk and continue with the next one
                continue;
            }
        }

        return processedChunks;
    } catch (error) {
        console.error(`Error processing document ${documentName}:`, error);
        throw error;
    }
};

/**
 * Process all documents in the documents directory
 * @param {String} documentsDir - Path to the documents directory
 * @returns {Promise<Array<{chunk: string, embedding: Array<number>, documentName: string, chunkIndex: number}>>} - Array of all processed chunks
 */
export const processAllDocuments = async (documentsDir = path.join(__dirname, '../data/documents')) => {
    try {
        // Load all documents from the directory
        const documents = await loadDocumentsFromDirectory(documentsDir);

        // Import and use the document metadata utilities
        const { logDocumentStatistics } = await import('./documentMetadata.js');
        logDocumentStatistics(documents);

        // Process each document
        const allProcessedChunks = [];
        for (const [documentName, content] of Object.entries(documents)) {
            console.log(`Processing document: ${documentName}`);
            const processedChunks = await processDocument(documentName, content);
            allProcessedChunks.push(...processedChunks);
            console.log(`Generated ${processedChunks.length} chunks with embeddings for ${documentName}`);
        }

        return allProcessedChunks;
    } catch (error) {
        console.error('Error processing all documents:', error);
        throw error;
    }
};

/**
 * Initialize document embeddings cache
 * @returns {Promise<void>}
 */
export const initializeDocumentEmbeddings = async () => {
    try {
        if (documentEmbeddingsCache) {
            console.log('Document embeddings already initialized');
            return;
        }

        console.log('Initializing document embeddings...');
        const processedChunks = await processAllDocuments();

        if (!processedChunks || processedChunks.length === 0) {
            throw new Error('No documents were processed. Please check if the documents directory contains valid files.');
        }

        documentEmbeddingsCache = processedChunks;
        console.log(`Successfully initialized ${processedChunks.length} document chunks with embeddings from ${new Set(processedChunks.map(chunk => chunk.documentName)).size} documents`);
    } catch (error) {
        console.error('Error initializing document embeddings:', error);
        throw error;
    }
};

/**
 * Get the document embeddings cache
 * @returns {Array<{chunk: string, embedding: Array<number>, documentName: string, chunkIndex: number}>} - The document embeddings cache
 */
export const getDocumentEmbeddings = () => {
    if (!documentEmbeddingsCache) {
        throw new Error('Document embeddings not initialized');
    }
    return documentEmbeddingsCache;
};

/**
 * Find relevant document chunks for a query
 * @param {String} query - The query text
 * @param {Array<{chunk: string, embedding: Array<number>, documentName: string, chunkIndex: number}>} processedChunks - Array of processed chunks
 * @param {Number} topK - Number of top results to return
 * @param {Number} similarityThreshold - Minimum similarity score to consider a chunk relevant (0-1)  
 * @returns {Promise<Array<{chunk: string, documentName: string, similarity: number}>>} - Array of relevant chunks
 */
export const findRelevantChunks = async (query, processedChunks, topK = 5, similarityThreshold = 0.5) => {
    try {
        if (!processedChunks || processedChunks.length === 0) {
            console.warn('No processed chunks available for similarity search');
            return [];
        }

        // Generate embedding for the query
        const queryEmbedding = await generateEmbedding(query);

        // Calculate similarity for each chunk using the cosineSimilarity function from embeddingUtils
        const similarities = processedChunks.map(({ chunk, embedding, documentName, chunkIndex }) => {
            // Calculate cosine similarity
            let dotProduct = 0;
            let normA = 0;
            let normB = 0;

            for (let i = 0; i < embedding.length; i++) {
                dotProduct += queryEmbedding[i] * embedding[i];
                normA += queryEmbedding[i] * queryEmbedding[i];
                normB += embedding[i] * embedding[i];
            }

            const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));

            return {
                chunk,
                documentName,
                chunkIndex,
                similarity
            };
        });

        // Sort by similarity (descending)
        similarities.sort((a, b) => b.similarity - a.similarity);

        // Filter by similarity threshold and return top K results
        const relevantChunks = similarities
            .filter(item => item.similarity >= similarityThreshold)
            .slice(0, topK);

        console.log(`Found ${relevantChunks.length} relevant chunks with similarity >= ${similarityThreshold}`);
        return relevantChunks;
    } catch (error) {
        console.error('Error finding relevant chunks:', error);
        throw error;
    }
};