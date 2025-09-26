import React, { useState, useEffect, useRef } from 'react'

const ChatInput = ({ onSendMessage, isTyping }) => {
    const [message, setMessage] = useState('')
    const [placeholder, setPlaceholder] = useState('')
    const inputRef = useRef(null)

    const placeholderTexts = [
        "Ask me anything about Masters Union...",
        "Discover programs, faculty, and more...",
        "Your AI assistant is ready to help...",
        "Explore admissions, campus life..."
    ]

    // Animated typing placeholder
    useEffect(() => {
        let currentIndex = 0
        let currentText = ''
        let isDeleting = false

        const typeText = () => {
            const fullText = placeholderTexts[currentIndex]

            if (isDeleting) {
                currentText = fullText.substring(0, currentText.length - 1)
            } else {
                currentText = fullText.substring(0, currentText.length + 1)
            }

            setPlaceholder(currentText)

            let typeSpeed = isDeleting ? 50 : 100

            if (!isDeleting && currentText === fullText) {
                typeSpeed = 2000
                isDeleting = true
            } else if (isDeleting && currentText === '') {
                isDeleting = false
                currentIndex = (currentIndex + 1) % placeholderTexts.length
                typeSpeed = 500
            }

            setTimeout(typeText, typeSpeed)
        }

        typeText()
    }, [])

    const handleSubmit = (e) => {
        e.preventDefault()
        if (message.trim() && !isTyping) {
            onSendMessage(message)
            setMessage('')
            inputRef.current?.focus()
        }
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit(e)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex items-center space-x-4">
            {/* Glass input container */}
            <div className="flex-1 relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={placeholder}
                    className="glass-input w-full px-6 py-4 text-white placeholder-white/60
                             focus:ring-2 focus:ring-cyan-400/50 transition-all duration-300"
                    disabled={isTyping}
                    style={{ fontSize: '16px' }} // Prevent zoom on mobile
                />

                {/* Animated border glow */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 
                              opacity-0 hover:opacity-20 transition-opacity duration-300 pointer-events-none"></div>
            </div>

            {/* Neon send button */}
            <button
                type="submit"
                disabled={!message.trim() || isTyping}
                className={`relative group min-w-[60px] h-[60px] rounded-full transition-all duration-300 ${!message.trim() || isTyping
                        ? 'opacity-50 cursor-not-allowed glass-container'
                        : 'neon-button hover:scale-110 active:scale-95'
                    }`}
            >
                {isTyping ? (
                    <div className="flex items-center justify-center">
                        <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-white rounded-full typing-dot"></div>
                            <div className="w-2 h-2 bg-white rounded-full typing-dot"></div>
                            <div className="w-2 h-2 bg-white rounded-full typing-dot"></div>
                        </div>
                    </div>
                ) : (
                    <svg
                        className="w-6 h-6 text-white mx-auto transition-transform group-hover:scale-110"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                    </svg>
                )}

                {/* Button glow effect */}
                {message.trim() && !isTyping && (
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 
                                  opacity-30 animate-pulse pointer-events-none"></div>
                )}
            </button>
        </form>
    )
}

export default ChatInput