import { useState, useRef, useEffect } from 'react'
import ChatHeader from './components/ChatHeader'
import ChatInput from './components/ChatInput'
import ChatMessages from './components/ChatMessages'
import { processUserMessage } from './services/chatService'

function App() {
    const [messages, setMessages] = useState([])
    const [isTyping, setIsTyping] = useState(false)
    const messagesEndRef = useRef(null)

    // Scroll to bottom whenever messages change
    useEffect(() => {
        scrollToBottom()
    }, [messages])

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
            // Process the message and get response
            const response = await processUserMessage(message)

            // Add bot response to chat
            const botMessage = {
                id: Date.now() + 1,
                text: response,
                sender: 'bot',
                timestamp: new Date().toISOString()
            }

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

    return (
        <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
            <ChatHeader />
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