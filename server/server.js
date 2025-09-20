import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { OpenAI } from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';
import knowledgeBase from './data/knowledgeBase.js';
import { formatKnowledgeBase } from './utils/documentLoader.js';
import { initializeDocumentEmbeddings } from './utils/documentProcessor.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Setup __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Initialize OpenAI client
let openai;
try {
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
} catch (error) {
    console.error('Error initializing OpenAI client:', error.message);
}

// Knowledge base is imported from './data/knowledgeBase.js'

// Format knowledge base is handled by the formatKnowledgeBase utility function

// Import routes
import chatRoutes from './routes/chatRoutes.js';

// Use routes
app.use('/api', chatRoutes);

// Initialize document embeddings
console.log('Initializing document embeddings...');
initializeDocumentEmbeddings()
    .then(() => {
        console.log('Document embeddings initialized successfully');
    })
    .catch(error => {
        console.error('Failed to initialize document embeddings:', error);
    });

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});