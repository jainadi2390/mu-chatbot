// Utility to load and process documents for the OpenAI API
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Formats the knowledge base data into a string format suitable for OpenAI context
 * @param {Object} knowledgeBase - The knowledge base object containing information about Masters Union
 * @returns {String} - Formatted string with all knowledge base information
 */
export const formatKnowledgeBase = (knowledgeBase) => {
    let context = "";

    // Iterate through the knowledge base and format it as text
    for (const [category, items] of Object.entries(knowledgeBase)) {
        context += `## ${category.toUpperCase()}\n`;

        for (const [key, value] of Object.entries(items)) {
            context += `${key}: ${value}\n`;
        }

        context += "\n";
    }

    return context;
};

/**
 * Load document content from a file
 * @param {String} filePath - Path to the document file
 * @returns {Promise<String>} - The document content
 */
export const loadDocumentFromFile = async (filePath) => {
    try {
        const content = await fs.promises.readFile(filePath, 'utf8');
        return content;
    } catch (error) {
        console.error(`Error loading document from ${filePath}:`, error);
        throw error;
    }
};

/**
 * Load all documents from a directory
 * @param {String} dirPath - Path to the directory containing documents
 * @param {Array<String>} fileExtensions - Array of file extensions to include (e.g., ['.md', '.txt'])
 * @returns {Promise<Object>} - Object with filenames as keys and content as values
 */
export const loadDocumentsFromDirectory = async (dirPath = '../data/documents', fileExtensions = ['.md', '.txt', '.pdf', '.docx', '.html']) => {
    try {
        // Resolve the directory path
        const resolvedPath = path.resolve(__dirname, dirPath);
        console.log(`Loading documents from: ${resolvedPath}`);

        // Check if directory exists
        try {
            await fs.promises.access(resolvedPath);
        } catch (err) {
            console.error(`Directory does not exist: ${resolvedPath}`);
            return {};
        }

        // Read all files in the directory
        const files = await fs.promises.readdir(resolvedPath);
        console.log(`Found ${files.length} files in documents directory`);

        // Filter files by extension and load their content
        const documents = {};
        const loadErrors = [];

        for (const file of files) {
            const ext = path.extname(file).toLowerCase();
            if (fileExtensions.includes(ext)) {
                try {
                    const filePath = path.join(resolvedPath, file);
                    const content = await loadDocumentFromFile(filePath);
                    documents[file] = content;
                    console.log(`Successfully loaded document: ${file}`);
                } catch (fileError) {
                    console.error(`Error loading document ${file}:`, fileError);
                    loadErrors.push({ file, error: fileError.message });
                }
            } else {
                console.log(`Skipping unsupported file type: ${file}`);
            }
        }

        if (Object.keys(documents).length === 0) {
            console.warn('No valid documents found in the specified directory');
        }

        if (loadErrors.length > 0) {
            console.warn(`Encountered ${loadErrors.length} errors while loading documents:`, loadErrors);
        }

        return documents;
    } catch (error) {
        console.error(`Error loading documents from ${dirPath}:`, error);
        throw error;
    }
};