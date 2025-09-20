import React from 'react'
import ReactMarkdown from 'react-markdown'

const ChatMessages = ({ messages, isTyping, messagesEndRef }) => {
    return (
        <div className="p-4 space-y-4">
            {/* Welcome message */}
            {messages.length === 0 && (
                <div className="text-center py-8">
                    <h2 className="text-2xl font-bold text-primary-700 dark:text-primary-400 mb-2">
                        Welcome to Masters Union Chatbot
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                        Ask me anything about Masters Union college - programs, faculty, admissions, campus life, and more!
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-lg mx-auto">
                        {[
                            "Tell me about Masters Union's programs",
                            "What makes Masters Union unique?",
                            "How can I apply to Masters Union?",
                            "Who are the faculty members?"
                        ].map((suggestion, index) => (
                            <button
                                key={index}
                                className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg p-2 text-sm text-left transition-colors"
                                onClick={() => document.querySelector('input').value = suggestion}
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Chat messages */}
            {messages.map((message) => (
                <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} message-animation`}
                >
                    <div
                        className={`max-w-[80%] md:max-w-[70%] rounded-lg p-3 ${message.sender === 'user'
                            ? 'bg-primary-600 text-white rounded-tr-none'
                            : message.isError
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-tl-none'
                                : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-tl-none'
                            }`}
                    >
                        {message.sender === 'bot' ? (
                            <ReactMarkdown className="prose dark:prose-invert max-w-none">
                                {message.text}
                            </ReactMarkdown>
                        ) : (
                            <p>{message.text}</p>
                        )}
                        <div
                            className={`text-xs mt-1 ${message.sender === 'user'
                                ? 'text-primary-200'
                                : message.isError
                                    ? 'text-red-500 dark:text-red-400'
                                    : 'text-gray-500 dark:text-gray-400'
                                }`}
                        >
                            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
                <div className="flex justify-start message-animation">
                    <div className="bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-lg rounded-tl-none p-3 max-w-[80%] md:max-w-[70%]">
                        <div className="flex space-x-2">
                            <div className="w-2 h-2 rounded-full bg-gray-500 dark:bg-gray-400 animate-bounce"></div>
                            <div className="w-2 h-2 rounded-full bg-gray-500 dark:bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 rounded-full bg-gray-500 dark:bg-gray-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Invisible element for scrolling to bottom */}
            <div ref={messagesEndRef} />
        </div>
    )
}

export default ChatMessages