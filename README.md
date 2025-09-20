# Masters Union Chatbot

A web-based chatbot application designed to answer questions about Masters Union college. The chatbot provides information about programs, faculty, admissions, campus life, and other aspects of Masters Union based on a knowledge base.

## Features

- Interactive chat interface
- Natural language processing to understand user queries
- Knowledge base integration for accurate responses
- Responsive design for all devices
- Context-aware conversations
- OpenAI API integration for intelligent responses

## Project Overview

This project consists of two main parts:

1. **Frontend**: A React-based web application that provides the user interface for the chatbot
2. **Backend**: A Node.js/Express server that processes user queries using OpenAI's API

## About Masters Union

Masters Union is a new age college which focuses on learning by doing, where students learn from industry experts. The college emphasizes practical knowledge and real-world experience in its educational approach.

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- OpenAI API key

### Setup

#### Backend Setup

1. Navigate to the server directory:
   ```
   cd server
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on the `.env.example` file and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=5000
   ```

4. Start the backend server:
   ```
   npm run dev
   ```

#### Frontend Setup

1. In the root directory, install dependencies:
   ```
   npm install
   ```

2. Start the frontend development server:
   ```
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173`

## Project Structure

- `/src` - Frontend source code
  - `/components` - React components
  - `/services` - API services
  - `/styles` - CSS styles
  - `/utils` - Utility functions
- `/server` - Backend source code
  - `server.js` - Main server file
  - `.env.example` - Example environment variables

## Knowledge Base

The chatbot uses a JSON-based knowledge base that contains information about Masters Union. To update the knowledge base, edit the files in the `/src/data` directory.

## License

MIT