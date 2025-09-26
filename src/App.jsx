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
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
    const messagesEndRef = useRef(null)
    const chatContainerRef = useRef(null)

    // Initialize RAG service and check status on component mount
    useEffect(() => {
        initializeRAGService()
        checkRAGStatus()
    }, [])

    // Scroll to bottom only when appropriate
    useEffect(() => {
        if (shouldAutoScroll) {
            scrollToBottom()
        }
    }, [messages, shouldAutoScroll])

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
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
        }
    }

    // Check if user is near bottom of chat
    const isNearBottom = () => {
        if (!chatContainerRef.current) return true
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current
        return scrollHeight - scrollTop - clientHeight < 100
    }

    // Handle scroll to detect if user is manually scrolling
    const handleScroll = () => {
        setShouldAutoScroll(isNearBottom())
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
        setShouldAutoScroll(true) // Ensure auto-scroll when user sends message
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
            setShouldAutoScroll(true) // Ensure auto-scroll when bot responds
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
        <div className="futuristic-bg min-h-screen flex flex-col">
            {/* Animated background particles */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-20 left-10 w-2 h-2 bg-cyan-400 rounded-full opacity-60 animate-ping"></div>
                <div className="absolute top-40 right-20 w-1 h-1 bg-purple-400 rounded-full opacity-80 animate-pulse"></div>
                <div className="absolute bottom-32 left-20 w-3 h-3 bg-blue-400 rounded-full opacity-40 animate-bounce"></div>
                <div className="absolute bottom-40 right-10 w-1.5 h-1.5 bg-cyan-300 rounded-full opacity-70 animate-ping"></div>
            </div>

            <ChatHeader
                ragStatus={ragStatus}
                ragStats={ragStats}
                onClearConversation={handleClearConversation}
            />

            <div className="flex-1 flex items-center justify-center p-4 md:p-8 relative z-10">
                <div className="w-full max-w-4xl h-full max-h-[80vh] flex flex-col">
                    {/* Main chat container with glassmorphism */}
                    <div className="glass-chat flex-1 flex flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto chat-container"
                            ref={chatContainerRef}
                            onScroll={handleScroll}>
                            <ChatMessages
                                messages={messages}
                                isTyping={isTyping}
                                messagesEndRef={messagesEndRef}
                            />
                        </div>

                        {/* Input section */}
                        <div className="p-6 border-t border-white/10">
                            <ChatInput onSendMessage={handleSendMessage} isTyping={isTyping} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default App