// Utility for managing document metadata and statistics

/**
 * Generate metadata for a document collection
 * @param {Object} documents - Object with document names as keys and content as values
 * @returns {Object} - Metadata object with document statistics
 */
export const generateDocumentMetadata = (documents) => {
    if (!documents || typeof documents !== 'object') {
        return { count: 0, totalSize: 0, documents: [] };
    }

    const documentNames = Object.keys(documents);
    const metadata = {
        count: documentNames.length,
        totalSize: 0,
        averageSize: 0,
        documents: []
    };

    // Process each document
    documentNames.forEach(name => {
        const content = documents[name];
        const size = content.length;
        const wordCount = content.split(/\s+/).filter(Boolean).length;
        const paragraphCount = content.split(/\n\s*\n/).filter(Boolean).length;

        metadata.totalSize += size;
        metadata.documents.push({
            name,
            size,
            wordCount,
            paragraphCount,
            preview: content.substring(0, 100) + (content.length > 100 ? '...' : '')
        });
    });

    // Calculate averages
    if (metadata.count > 0) {
        metadata.averageSize = Math.round(metadata.totalSize / metadata.count);
    }

    return metadata;
};

/**
 * Log document collection statistics
 * @param {Object} documents - Object with document names as keys and content as values
 */
export const logDocumentStatistics = (documents) => {
    const metadata = generateDocumentMetadata(documents);

    console.log('=== Document Collection Statistics ===');
    console.log(`Total documents: ${metadata.count}`);
    console.log(`Total content size: ${metadata.totalSize} characters`);
    console.log(`Average document size: ${metadata.averageSize} characters`);
    console.log('Documents:');

    metadata.documents.forEach(doc => {
        console.log(`- ${doc.name}: ${doc.wordCount} words, ${doc.paragraphCount} paragraphs`);
    });

    console.log('=====================================');

    return metadata;
};

/**
 * Format document metadata as a human-readable string
 * @param {Object} metadata - Document metadata object
 * @returns {String} - Formatted metadata string
 */
export const formatMetadataAsString = (metadata) => {
    if (!metadata || !metadata.documents) {
        return 'No document metadata available';
    }

    let result = `Available Documents (${metadata.count}):\n`;

    metadata.documents.forEach(doc => {
        result += `- ${doc.name}: ${doc.wordCount} words, ${doc.paragraphCount} paragraphs\n`;
    });

    return result;
};