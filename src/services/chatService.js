// Chat service to process user messages and generate responses
// This service connects to the backend API to get responses based on Masters Union knowledge base

import axios from 'axios';

// API base URL - adjust this based on your environment
const API_BASE_URL = 'http://localhost:5000/api';
// Process user message and return a response from the backend
export const processUserMessage = async (message) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/chat`, { message });
        return response.data.response;
    } catch (error) {
        console.error('Error processing message:', error);

        // If the server returned a fallback response, use it
        if (error.response && error.response.data && error.response.data.fallbackResponse) {
            return error.response.data.fallbackResponse;
        }

        // Otherwise return a generic error message
        return "I'm sorry, but I'm having trouble connecting to my knowledge base right now. Please try again later.";
    }
};