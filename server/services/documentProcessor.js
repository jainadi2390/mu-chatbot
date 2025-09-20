// Advanced Document Processing Service
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DocumentProcessor {
    constructor() {
        this.supportedFormats = ['.txt', '.md', '.pdf', '.docx', '.html'];
        this.documentsDir = path.join(__dirname, '../data/documents');
    }

    /**
     * Process all documents in the documents directory
     */
    async processAllDocuments() {
        try {
            console.log('Starting document processing...');
            const files = await fs.readdir(this.documentsDir);
            const supportedFiles = files.filter(file => 
                this.supportedFormats.some(format => file.toLowerCase().endsWith(format))
            );

            console.log(`Found ${supportedFiles.length} supported documents`);

            const processedDocuments = [];
            for (const file of supportedFiles) {
                try {
                    const filePath = path.join(this.documentsDir, file);
                    const content = await this.processDocument(filePath);
                    
                    if (content) {
                        processedDocuments.push({
                            id: uuidv4(),
                            filename: file,
                            content: content,
                            metadata: {
                                filename: file,
                                fileType: path.extname(file).toLowerCase(),
                                processedAt: new Date().toISOString(),
                                wordCount: content.split(/\s+/).length,
                                charCount: content.length
                            }
                        });
                        console.log(`✓ Processed: ${file}`);
                    }
                } catch (error) {
                    console.error(`✗ Failed to process ${file}:`, error.message);
                }
            }

            console.log(`Successfully processed ${processedDocuments.length} documents`);
            return processedDocuments;
        } catch (error) {
            console.error('Error processing documents:', error);
            throw error;
        }
    }

    /**
     * Process a single document based on its file type
     */
    async processDocument(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        
        try {
            switch (ext) {
                case '.txt':
                case '.md':
                    return await this.processTextFile(filePath);
                case '.pdf':
                    return await this.processPdfFile(filePath);
                case '.docx':
                    return await this.processDocxFile(filePath);
                case '.html':
                    return await this.processHtmlFile(filePath);
                default:
                    console.warn(`Unsupported file type: ${ext}`);
                    return null;
            }
        } catch (error) {
            console.error(`Error processing ${filePath}:`, error);
            throw error;
        }
    }

    /**
     * Process text and markdown files
     */
    async processTextFile(filePath) {
        const content = await fs.readFile(filePath, 'utf-8');
        return this.cleanText(content);
    }

    /**
     * Process PDF files
     */
    async processPdfFile(filePath) {
        try {
            const dataBuffer = await fs.readFile(filePath);
            const pdf = await import('pdf-parse');
            const data = await pdf.default(dataBuffer);
            return this.cleanText(data.text);
        } catch (error) {
            console.error(`Error processing PDF file ${filePath}:`, error.message);
            // Return a placeholder or skip the file
            return `[PDF file could not be processed: ${path.basename(filePath)}]`;
        }
    }

    /**
     * Process DOCX files
     */
    async processDocxFile(filePath) {
        try {
            const dataBuffer = await fs.readFile(filePath);
            const mammoth = await import('mammoth');
            const result = await mammoth.extractRawText({ buffer: dataBuffer });
            return this.cleanText(result.value);
        } catch (error) {
            console.error(`Error processing DOCX file ${filePath}:`, error.message);
            return `[DOCX file could not be processed: ${path.basename(filePath)}]`;
        }
    }

    /**
     * Process HTML files
     */
    async processHtmlFile(filePath) {
        const html = await fs.readFile(filePath, 'utf-8');
        const $ = cheerio.load(html);
        
        // Remove script and style elements
        $('script, style').remove();
        
        // Extract text content
        const text = $.text();
        return this.cleanText(text);
    }

    /**
     * Clean and normalize text content
     */
    cleanText(text) {
        return text
            .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
            .replace(/\n\s*\n/g, '\n\n') // Replace multiple newlines with double newline
            .trim();
    }

    /**
     * Split document into chunks with advanced strategy
     */
    splitIntoChunks(content, options = {}) {
        const {
            chunkSize = 1000,
            chunkOverlap = 200,
            minChunkSize = 100,
            preserveParagraphs = true
        } = options;

        if (content.length <= chunkSize) {
            return [content];
        }

        const chunks = [];
        let startIndex = 0;

        while (startIndex < content.length) {
            let endIndex = Math.min(startIndex + chunkSize, content.length);
            
            if (preserveParagraphs && endIndex < content.length) {
                // Try to break at paragraph boundaries
                const lastParagraphBreak = content.lastIndexOf('\n\n', endIndex);
                if (lastParagraphBreak > startIndex + minChunkSize) {
                    endIndex = lastParagraphBreak;
                } else {
                    // Try to break at sentence boundaries
                    const sentenceEndings = ['. ', '! ', '? ', '.\n', '!\n', '?\n'];
                    let bestBreak = -1;
                    
                    for (const ending of sentenceEndings) {
                        const breakIndex = content.lastIndexOf(ending, endIndex);
                        if (breakIndex > startIndex + minChunkSize && breakIndex > bestBreak) {
                            bestBreak = breakIndex + ending.length;
                        }
                    }
                    
                    if (bestBreak > startIndex + minChunkSize) {
                        endIndex = bestBreak;
                    }
                }
            }

            const chunk = content.substring(startIndex, endIndex).trim();
            if (chunk.length >= minChunkSize) {
                chunks.push(chunk);
            }

            // Move start index with overlap
            startIndex = Math.max(startIndex + 1, endIndex - chunkOverlap);
            
            // Prevent infinite loop
            if (startIndex >= content.length - minChunkSize) {
                break;
            }
        }

        return chunks.filter(chunk => chunk.length > 0);
    }

    /**
     * Extract metadata from document content
     */
    extractMetadata(content, filename) {
        const metadata = {
            wordCount: content.split(/\s+/).length,
            charCount: content.length,
            paragraphCount: content.split(/\n\s*\n/).length,
            sentenceCount: content.split(/[.!?]+/).length - 1,
            filename: filename,
            processedAt: new Date().toISOString()
        };

        // Extract potential topics/keywords (simple implementation)
        const words = content.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 3);
        
        const wordFreq = {};
        words.forEach(word => {
            wordFreq[word] = (wordFreq[word] || 0) + 1;
        });

        metadata.topKeywords = Object.entries(wordFreq)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([word]) => word);

        return metadata;
    }
}

export default new DocumentProcessor();
