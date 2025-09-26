import React from 'react'
import ReactMarkdown from 'react-markdown'

const ChatMessages = ({ messages, isTyping, messagesEndRef }) => {
    return (
        <div className="p-6 space-y-6">
            {/* Futuristic welcome message */}
            {messages.length === 0 && (
                <div className="text-center py-12 slide-in-up">
                    {/* 3D holographic effect container */}
                    <div className="relative mb-8">
                        <div className="glass-container p-8 max-w-2xl mx-auto">
                            <h2 className="text-4xl md:text-5xl font-black gradient-text mb-4"
                                style={{ fontFamily: 'Orbitron, monospace' }}>
                                Welcome to the Future
                            </h2>
                            <p className="text-white/90 text-lg md:text-xl font-medium mb-6"
                                style={{ fontFamily: 'Inter, sans-serif' }}>
                                Ask me anything about Masters Union - programs, faculty, admissions, campus life, and more!
                            </p>

                            {/* Animated suggestion cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                                {[
                                    "🎓 Tell me about Masters Union's programs",
                                    "⭐ What makes Masters Union unique?",
                                    "📝 How can I apply to Masters Union?",
                                    "👨‍🏫 Who are the faculty members?"
                                ].map((suggestion, index) => (
                                    <button
                                        key={index}
                                        className="glass-container p-4 text-left transition-all duration-300
                                                 hover:scale-105 hover:bg-white/20 group slide-in-up"
                                        style={{ animationDelay: `${0.1 * (index + 1)}s` }}
                                        onClick={() => {
                                            const input = document.querySelector('input')
                                            if (input) {
                                                input.value = suggestion.substring(2) // Remove emoji
                                                input.focus()
                                            }
                                        }}
                                    >
                                        <span className="text-white/90 group-hover:text-white transition-colors">
                                            {suggestion}
                                        </span>
                                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400/20 to-purple-500/20
                                                      opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Chat messages with 3D effects */}
            {messages.map((message, index) => (
                <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} message-animation`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                >
                    <div className={`max-w-[80%] md:max-w-[70%] relative group ${message.sender === 'user' ? 'ml-8' : 'mr-8'
                        }`}>
                        {/* Message bubble with glassmorphism */}
                        <div className={`rounded-3xl p-4 relative overflow-hidden ${message.sender === 'user'
                                ? 'message-bubble-user text-white rounded-br-lg'
                                : message.isError
                                    ? 'glass-container border-red-400/50 text-red-200'
                                    : 'message-bubble-bot text-white rounded-bl-lg'
                            }`}>
                            {/* Message content */}
                            {message.sender === 'bot' ? (
                                <div>
                                    <ReactMarkdown className="prose prose-invert max-w-none
                                                             prose-headings:text-white prose-p:text-white/90
                                                             prose-a:text-cyan-400 prose-strong:text-white
                                                             prose-code:text-cyan-300 prose-code:bg-black/30">
                                        {message.text}
                                    </ReactMarkdown>

                                    {/* Futuristic sources display */}
                                    {message.sources && message.sources.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-white/20">
                                            <div className="text-xs text-cyan-300 mb-3 font-semibold flex items-center">
                                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Knowledge Sources:
                                            </div>
                                            <div className="space-y-2">
                                                {message.sources.map((source, index) => (
                                                    <div key={index} className="glass-container p-2 rounded-lg">
                                                        <span className="font-medium text-white/90">{source.filename}</span>
                                                        {source.similarity && (
                                                            <span className="ml-2 text-cyan-300 text-xs">
                                                                {(source.similarity * 100).toFixed(0)}% match
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* AI Status indicator */}
                                    {message.metadata && (
                                        <div className="mt-3 flex items-center text-xs">
                                            {message.metadata.ragEnabled ? (
                                                <div className="flex items-center text-green-300">
                                                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2 shadow-[0_0_10px_rgb(74,222,128)]"></div>
                                                    AI Enhanced Response
                                                </div>
                                            ) : (
                                                <div className="flex items-center text-yellow-300">
                                                    <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2 shadow-[0_0_10px_rgb(250,204,21)]"></div>
                                                    Fallback Mode
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-white font-medium">{message.text}</p>
                            )}

                            {/* Timestamp */}
                            <div className={`text-xs mt-2 opacity-70 ${message.sender === 'user' ? 'text-white/70' : 'text-white/50'
                                }`}>
                                {new Date(message.timestamp).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </div>

                            {/* Subtle glow effect */}
                            <div className={`absolute inset-0 rounded-3xl pointer-events-none opacity-0 
                                          group-hover:opacity-20 transition-opacity duration-300 ${message.sender === 'user'
                                    ? 'bg-gradient-to-r from-purple-400 to-blue-400'
                                    : 'bg-gradient-to-r from-cyan-400 to-teal-400'
                                }`}></div>
                        </div>
                    </div>
                </div>
            ))}

            {/* Futuristic typing indicator */}
            {isTyping && (
                <div className="flex justify-start message-animation">
                    <div className="mr-8 max-w-[80%] md:max-w-[70%]">
                        <div className="message-bubble-bot rounded-3xl rounded-bl-lg p-4 relative">
                            <div className="flex items-center space-x-3">
                                <div className="flex space-x-2">
                                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 typing-dot"></div>
                                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 typing-dot"></div>
                                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 typing-dot"></div>
                                </div>
                                <span className="text-white/70 text-sm font-medium">AI is thinking...</span>
                            </div>

                            {/* Animated border */}
                            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-cyan-400/30 to-purple-500/30
                                          opacity-50 animate-pulse pointer-events-none"></div>
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