// Vector Database Service using ChromaDB
import { ChromaClient } from 'chromadb';
import { v4 as uuidv4 } from 'uuid';

class VectorDatabaseService {
    constructor() {
        this.client = new ChromaClient({
            path: "http://localhost:8000" // ChromaDB server URL
        });
        this.collectionName = 'masters_union_knowledge';
        this.collection = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the vector database and create collection
     */
    async initialize() {
        try {
            console.log('Initializing ChromaDB vector database...');
            
            // Check if ChromaDB is available
            try {
                await this.client.heartbeat();
            } catch (error) {
                console.log('ChromaDB not available, using fallback mode...');
                this.isInitialized = false;
                return false;
            }
            
            // Check if collection exists, if not create it
            try {
                this.collection = await this.client.getCollection({
                    name: this.collectionName
                });
                console.log(`Found existing collection: ${this.collectionName}`);
            } catch (error) {
                console.log(`Creating new collection: ${this.collectionName}`);
                this.collection = await this.client.createCollection({
                    name: this.collectionName,
                    metadata: {
                        description: "Masters Union knowledge base documents",
                        created_at: new Date().toISOString()
                    }
                });
            }

            this.isInitialized = true;
            console.log('Vector database initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize vector database:', error);
            console.log('Using fallback mode without vector database');
            this.isInitialized = false;
            return false;
        }
    }

    /**
     * Add documents to the vector database
     * @param {Array} documents - Array of document objects with {id, content, metadata}
     */
    async addDocuments(documents) {
        if (!this.isInitialized) {
            throw new Error('Vector database not initialized');
        }

        try {
            const ids = documents.map(doc => doc.id || uuidv4());
            const contents = documents.map(doc => doc.content);
            const metadatas = documents.map(doc => doc.metadata || {});

            await this.collection.add({
                ids: ids,
                documents: contents,
                metadatas: metadatas
            });

            console.log(`Added ${documents.length} documents to vector database`);
            return ids;
        } catch (error) {
            console.error('Error adding documents to vector database:', error);
            throw error;
        }
    }

    /**
     * Search for similar documents
     * @param {string} query - Search query
     * @param {number} nResults - Number of results to return
     * @param {Object} filter - Optional metadata filter
     * @returns {Array} Array of similar documents
     */
    async search(query, nResults = 5, filter = null) {
        if (!this.isInitialized) {
            throw new Error('Vector database not initialized');
        }

        try {
            const searchParams = {
                queryTexts: [query],
                nResults: nResults
            };

            if (filter) {
                searchParams.where = filter;
            }

            const results = await this.collection.query(searchParams);
            
            // Format results
            const formattedResults = results.ids[0].map((id, index) => ({
                id: id,
                content: results.documents[0][index],
                metadata: results.metadatas[0][index],
                distance: results.distances[0][index]
            }));

            return formattedResults;
        } catch (error) {
            console.error('Error searching vector database:', error);
            throw error;
        }
    }

    /**
     * Get collection statistics
     */
    async getStats() {
        if (!this.isInitialized) {
            return {
                collectionName: this.collectionName,
                documentCount: 0,
                isInitialized: false,
                status: 'fallback_mode'
            };
        }

        try {
            const count = await this.collection.count();
            return {
                collectionName: this.collectionName,
                documentCount: count,
                isInitialized: this.isInitialized
            };
        } catch (error) {
            console.error('Error getting collection stats:', error);
            return {
                collectionName: this.collectionName,
                documentCount: 0,
                isInitialized: false,
                status: 'error'
            };
        }
    }

    /**
     * Clear all documents from the collection
     */
    async clearCollection() {
        if (!this.isInitialized) {
            throw new Error('Vector database not initialized');
        }

        try {
            await this.collection.delete();
            console.log('Collection cleared successfully');
            return true;
        } catch (error) {
            console.error('Error clearing collection:', error);
            throw error;
        }
    }

    /**
     * Delete specific documents by IDs
     * @param {Array} ids - Array of document IDs to delete
     */
    async deleteDocuments(ids) {
        if (!this.isInitialized) {
            throw new Error('Vector database not initialized');
        }

        try {
            await this.collection.delete({
                ids: ids
            });
            console.log(`Deleted ${ids.length} documents from vector database`);
            return true;
        } catch (error) {
            console.error('Error deleting documents:', error);
            throw error;
        }
    }
}

// Export singleton instance
export default new VectorDatabaseService();
