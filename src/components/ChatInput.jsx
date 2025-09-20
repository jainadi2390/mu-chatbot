import React, { useState } from 'react'

const ChatInput = ({ onSendMessage, isTyping }) => {
    const [message, setMessage] = useState('')

    const handleSubmit = (e) => {
        e.preventDefault()
        if (message.trim() && !isTyping) {
            onSendMessage(message)
            setMessage('')
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="flex items-center bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2"
        >
            <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask anything about Masters Union..."
                className="flex-1 p-2 bg-transparent outline-none text-gray-700 dark:text-gray-200"
                disabled={isTyping}
            />
            <button
                type="submit"
                disabled={!message.trim() || isTyping}
                className={`ml-2 px-4 py-2 rounded-md ${!message.trim() || isTyping
                    ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                    : 'bg-primary-600 hover:bg-primary-700'} text-white transition-colors`}
            >
                {isTyping ? (
                    <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing
                    </span>
                ) : 'Send'}
            </button>
        </form>
    )
}

export default ChatInput