import { useState, useRef, useEffect } from 'react'
import ChatHeader from './components/ChatHeader'
import ChatInput from './components/ChatInput'
import ChatMessages from './components/ChatMessages'
import { processUserMessage, initializeRAG, getRAGStats, clearConversation } from './services/chatService'

function App() {
    const [messages, setMessages] = useState([])
    const [isTyping, setIsTyping] = useState(false)
    const [sessionId, setSessionId] = useState(null)
    const [ragStatus, setRagStatus] = useState('unknown')
    const [ragStats, setRagStats] = useState(null)
    const messagesEndRef = useRef(null)

    // Initialize RAG service and check status on component mount
    useEffect(() => {
        initializeRAGService()
        checkRAGStatus()
    }, [])

    // Scroll to bottom whenever messages change
    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // Initialize RAG service
    const initializeRAGService = async () => {
        try {
            const result = await initializeRAG()
            if (result.status === 'success') {
                setRagStatus('initialized')
                console.log('✅ RAG service initialized successfully')
            } else {
                setRagStatus('failed')
                console.log('⚠️ RAG service initialization failed')
            }
        } catch (error) {
            setRagStatus('failed')
            console.error('❌ Error initializing RAG service:', error)
        }
    }

    // Check RAG status
    const checkRAGStatus = async () => {
        try {
            const stats = await getRAGStats()
            setRagStats(stats)
            if (stats.ragEnabled) {
                setRagStatus('initialized')
            } else {
                setRagStatus('not_initialized')
            }
        } catch (error) {
            setRagStatus('unknown')
            console.error('Error checking RAG status:', error)
        }
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const handleSendMessage = async (message) => {
        if (!message.trim()) return

        // Add user message to chat
        const userMessage = {
            id: Date.now(),
            text: message,
            sender: 'user',
            timestamp: new Date().toISOString()
        }

        setMessages(prev => [...prev, userMessage])
        setIsTyping(true)

        try {
            // Process the message and get response with RAG
            console.log('Sending message to RAG service:', message);
            const result = await processUserMessage(message, sessionId)
            console.log('Received RAG response:', result);
            
            // Update session ID if provided
            if (result.sessionId && result.sessionId !== sessionId) {
                setSessionId(result.sessionId)
            }

            // Add bot response to chat with sources
            const botMessage = {
                id: Date.now() + 1,
                text: result.response,
                sender: 'bot',
                timestamp: new Date().toISOString(),
                sources: result.sources || [],
                metadata: result.metadata || {},
                ragEnabled: result.metadata?.ragEnabled || false
            }

            console.log('Adding bot message:', botMessage);
            setMessages(prev => [...prev, botMessage])
        } catch (error) {
            console.error('Error processing message:', error)

            // Add error message
            const errorMessage = {
                id: Date.now() + 1,
                text: "I'm sorry, I couldn't process your request. Please try again later.",
                sender: 'bot',
                timestamp: new Date().toISOString(),
                isError: true
            }

            setMessages(prev => [...prev, errorMessage])
        } finally {
            setIsTyping(false)
        }
    }

    // Clear conversation
    const handleClearConversation = async () => {
        if (sessionId) {
            try {
                await clearConversation(sessionId)
            } catch (error) {
                console.error('Error clearing conversation:', error)
            }
        }
        setMessages([])
        setSessionId(null)
    }

    return (
        <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
            <ChatHeader 
                ragStatus={ragStatus} 
                ragStats={ragStats}
                onClearConversation={handleClearConversation}
            />
            <div className="flex-1 overflow-hidden flex flex-col max-w-4xl w-full mx-auto p-4">
                <div className="flex-1 overflow-y-auto chat-container mb-4 rounded-lg bg-white dark:bg-gray-800 shadow-lg">
                    <ChatMessages
                        messages={messages}
                        isTyping={isTyping}
                        messagesEndRef={messagesEndRef}
                    />
                </div>
                <ChatInput onSendMessage={handleSendMessage} isTyping={isTyping} />
            </div>
        </div>
    )
}

export default App