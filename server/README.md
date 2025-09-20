# Masters Union Chatbot - Backend Server

This is the backend server for the Masters Union Chatbot application. It uses Express.js and OpenAI's API to process chat messages based on a knowledge base about Masters Union college.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file based on the `.env.example` file and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=5000
   ```

3. Start the server:
   ```
   npm run dev
   ```

## API Endpoints

### POST /api/chat
Process a chat message and return a response based on the Masters Union knowledge base.

**Request Body:**
```json
{
  "message": "Tell me about Masters Union programs"
}
```

**Response:**
```json
{
  "response": "Masters Union offers various programs including business management, technology, and finance..."
}
```

### GET /api/health
Health check endpoint to verify the server is running.

**Response:**
```json
{
  "status": "ok"
}
```

## Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key
- `PORT`: The port on which the server will run (default: 5000)