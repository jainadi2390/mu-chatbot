# 🚀 Masters Union RAG Chatbot Setup Guide

## Overview
This is a comprehensive RAG (Retrieval-Augmented Generation) chatbot for Masters Union, featuring:
- **Vector Database**: ChromaDB for semantic search
- **Document Processing**: Multi-format support (PDF, DOCX, HTML, TXT, MD)
- **Advanced Chunking**: Smart text segmentation with overlap
- **Conversation Memory**: Session-based chat history
- **Source Attribution**: Citations for all responses
- **Security**: Rate limiting, CORS, and input validation

## 🏗️ Architecture

```
Frontend (React + Vite)     Backend (Node.js + Express)
├── Chat Interface          ├── RAG Service
├── Source Display          ├── Vector Database (ChromaDB)
├── Session Management      ├── Document Processor
└── RAG Status Display      └── OpenAI Integration
```

## 📋 Prerequisites

1. **Node.js** (v18 or higher)
2. **ChromaDB** (for vector storage)
3. **OpenAI API Key**
4. **Git** (for cloning)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ..
npm install
```

### 2. Set Up ChromaDB

**Option A: Using Docker (Recommended)**
```bash
docker run -p 8000:8000 chromadb/chroma:latest
```

**Option B: Using Python**
```bash
pip install chromadb
chroma run --host 0.0.0.0 --port 8000
```

### 3. Configure Environment Variables

Create `server/.env`:
```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# RAG Configuration
INITIALIZE_RAG_ON_STARTUP=true
```

### 4. Start the Services

**Terminal 1 - Backend Server:**
```bash
cd server
npm start
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

**Terminal 3 - ChromaDB (if not using Docker):**
```bash
chroma run --host 0.0.0.0 --port 8000
```

### 5. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api
- **ChromaDB**: http://localhost:8000

## 🔧 Configuration Options

### RAG Service Configuration

Edit `server/services/ragService.js`:

```javascript
// Document chunking options
const chunkOptions = {
    chunkSize: 800,        // Characters per chunk
    chunkOverlap: 100,     // Overlap between chunks
    preserveParagraphs: true
};

// Retrieval options
const retrievalOptions = {
    maxResults: 5,         // Number of documents to retrieve
    similarityThreshold: 0.6, // Minimum similarity score
    includeConversationHistory: true
};
```

### Vector Database Configuration

Edit `server/services/vectorDatabase.js`:

```javascript
// ChromaDB configuration
const client = new ChromaClient({
    path: "http://localhost:8000" // ChromaDB server URL
});

const collectionName = 'masters_union_knowledge';
```

## 📚 API Endpoints

### Chat Endpoints
- `POST /api/chat` - Send message to chatbot
- `GET /api/health` - Health check

### RAG Endpoints
- `POST /api/rag/initialize` - Initialize RAG service
- `GET /api/rag/stats` - Get RAG statistics
- `GET /api/rag/search?query=...` - Search documents
- `POST /api/rag/clear-conversation` - Clear chat history

### Example API Usage

```javascript
// Send a message
const response = await fetch('http://localhost:5000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        message: "What is Masters Union?",
        sessionId: "session_123"
    })
});

const data = await response.json();
console.log(data.response); // Bot response
console.log(data.sources);  // Source documents
```

## 📁 Document Management

### Adding New Documents

1. Place documents in `server/data/documents/`
2. Supported formats: `.txt`, `.md`, `.pdf`, `.docx`, `.html`
3. Restart the server or call `/api/rag/initialize`

### Document Processing

The system automatically:
- Extracts text from various formats
- Splits content into semantic chunks
- Generates embeddings using OpenAI
- Stores in ChromaDB vector database

## 🔍 Monitoring and Analytics

### RAG Statistics

Access `/api/rag/stats` to get:
- Document count in vector database
- Active conversation sessions
- RAG service status
- Performance metrics

### Health Monitoring

The `/api/health` endpoint provides:
- Server status
- RAG service status
- Timestamp information

## 🛠️ Troubleshooting

### Common Issues

**1. ChromaDB Connection Error**
```bash
# Check if ChromaDB is running
curl http://localhost:8000/api/v1/heartbeat
```

**2. OpenAI API Key Error**
- Verify API key in `.env` file
- Check API key format (starts with `sk-`)
- Ensure sufficient API credits

**3. Document Processing Fails**
- Check file permissions
- Verify document format is supported
- Check console logs for specific errors

**4. Frontend Connection Error**
- Verify backend is running on port 5000
- Check CORS configuration
- Ensure API_BASE_URL is correct

### Debug Mode

Enable debug logging:
```bash
NODE_ENV=development npm start
```

## 🚀 Production Deployment

### Environment Variables
```env
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://yourdomain.com
OPENAI_API_KEY=your_production_key
```

### Security Considerations
- Use environment variables for secrets
- Enable HTTPS in production
- Configure proper CORS origins
- Set up rate limiting
- Use a production ChromaDB instance

### Performance Optimization
- Use Redis for conversation memory
- Implement document caching
- Set up monitoring and logging
- Configure load balancing

## 📈 Advanced Features

### Custom Document Types
Add support for new file types in `server/services/documentProcessor.js`

### Custom Embedding Models
Modify `server/utils/embeddingUtils.js` to use different embedding models

### Conversation Analytics
Implement conversation tracking and analytics in the RAG service

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Check GitHub issues
4. Contact the development team

---

**Happy Chatting! 🎉**

