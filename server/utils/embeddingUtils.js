// Utility for handling document embeddings and vector search

import { OpenAI } from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize OpenAI client
let openai;
try {
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
} catch (error) {
    console.error('Error initializing OpenAI client:', error.message);
}

/**
 * Generate embeddings for a text using OpenAI's embedding model
 * @param {String} text - The text to generate embeddings for
 * @returns {Promise<Array<number>>} - The embedding vector
 */
export const generateEmbedding = async (text) => {
    try {
        if (!openai) {
            throw new Error('OpenAI client not initialized');
        }

        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Embedding generation timeout')), 30000);
        });

        const embeddingPromise = openai.embeddings.create({
            model: "text-embedding-ada-002",
            input: text,
        });

        const response = await Promise.race([embeddingPromise, timeoutPromise]);
        return response.data[0].embedding;
    } catch (error) {
        console.error('Error generating embedding:', error);
        throw error;
    }
};

/**
 * Calculate cosine similarity between two vectors
 * @param {Array<number>} vecA - First vector
 * @param {Array<number>} vecB - Second vector
 * @returns {number} - Cosine similarity score (between -1 and 1)
 */
export const cosineSimilarity = (vecA, vecB) => {
    if (vecA.length !== vecB.length) {
        throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) {
        return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Find the most similar documents to a query
 * @param {String} query - The query text
 * @param {Object} documentEmbeddings - Object with document names as keys and embeddings as values
 * @param {Number} topK - Number of top results to return
 * @returns {Promise<Array<{document: string, similarity: number}>>} - Array of top similar documents with scores
 */
export const findSimilarDocuments = async (query, documentEmbeddings, topK = 3) => {
    try {
        // Generate embedding for the query
        const queryEmbedding = await generateEmbedding(query);

        // Calculate similarity scores for each document
        const similarities = Object.entries(documentEmbeddings).map(([document, embedding]) => ({
            document,
            similarity: cosineSimilarity(queryEmbedding, embedding)
        }));

        // Sort by similarity score (descending)
        similarities.sort((a, b) => b.similarity - a.similarity);

        // Return top K results
        return similarities.slice(0, topK);
    } catch (error) {
        console.error('Error finding similar documents:', error);
        throw error;
    }
};

/**
 * Split a document into chunks for better embedding and retrieval
 * This improved version tries to split at paragraph or sentence boundaries when possible
 * @param {String} text - The document text
 * @param {Number} chunkSize - Maximum size of each chunk
 * @param {Number} chunkOverlap - Number of characters to overlap between chunks
 * @returns {Array<String>} - Array of text chunks
 */
export const splitTextIntoChunks = (text, chunkSize = 4000, chunkOverlap = 200) => {
    if (chunkSize <= 0 || chunkOverlap >= chunkSize) {
        throw new Error('Invalid chunk size or overlap');
    }

    // Clean the text - remove excessive newlines and spaces
    const cleanedText = text.replace(/\n{3,}/g, '\n\n').trim();

    const chunks = [];
    let startIndex = 0;

    while (startIndex < cleanedText.length) {
        // Calculate the maximum possible end index for this chunk
        let endIndex = Math.min(startIndex + chunkSize, cleanedText.length);

        // Try to find a natural break point (paragraph or sentence)
        if (endIndex < cleanedText.length) {
            // First try to find paragraph break
            const paragraphBreak = cleanedText.lastIndexOf('\n\n', endIndex);
            if (paragraphBreak > startIndex && paragraphBreak > endIndex - chunkSize / 2) {
                endIndex = paragraphBreak + 2; // Include the newlines
            } else {
                // If no good paragraph break, try to find sentence break
                const sentenceBreaks = ['. ', '! ', '? ', '.\n', '!\n', '?\n', '; ', ':\n'];
                let bestBreakIndex = -1;

                // Look for sentence breaks within a reasonable range
                const searchStartIndex = Math.max(startIndex, endIndex - chunkSize / 2);
                for (const breakChar of sentenceBreaks) {
                    let breakIndex = cleanedText.lastIndexOf(breakChar, endIndex);
                    while (breakIndex >= searchStartIndex) {
                        if (breakIndex > bestBreakIndex) {
                            bestBreakIndex = breakIndex + breakChar.length;
                            break;
                        }
                        breakIndex = cleanedText.lastIndexOf(breakChar, breakIndex - 1);
                    }
                }

                if (bestBreakIndex > startIndex && bestBreakIndex > endIndex - chunkSize / 3) {
                    endIndex = bestBreakIndex;
                }
            }
        }

        // Add chunk to the list
        chunks.push(cleanedText.substring(startIndex, endIndex).trim());

        // Move start index for next chunk, accounting for overlap
        startIndex = Math.max(startIndex + 1, endIndex - chunkOverlap);

        // If we can't make progress, break to avoid infinite loop
        if (startIndex >= cleanedText.length - 10) { // Small buffer to avoid tiny chunks at the end
            break;
        }
    }

    // Filter out empty chunks and log chunk statistics
    const nonEmptyChunks = chunks.filter(chunk => chunk.trim().length > 0);
    console.log(`Split document into ${nonEmptyChunks.length} chunks (average size: ${Math.round(nonEmptyChunks.reduce((sum, chunk) => sum + chunk.length, 0) / nonEmptyChunks.length)} chars)`);

    return nonEmptyChunks;
};