import React from 'react'

const ChatHeader = ({ ragStatus, ragStats, onClearConversation }) => {
    return (
        <header className="relative z-20 p-6 md:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Glass container for header */}
                <div className="glass-container p-6 slide-in-up">
                    <div className="flex items-center justify-between">
                        {/* Left side with 3D orb and title */}
                        <div className="flex items-center space-x-4">
                            {/* 3D Floating Orb */}
                            <div className="floating-orb glow-animation flex items-center justify-center">
                                <svg
                                    className="w-10 h-10 text-white"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
                                >
                                    {/* Robot Head */}
                                    <rect x="7" y="4" width="10" height="8" rx="2" fill="currentColor" opacity="0.9" />

                                    {/* Robot Eyes */}
                                    <circle cx="9.5" cy="7" r="1" fill="#00ffff" opacity="0.8">
                                        <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" />
                                    </circle>
                                    <circle cx="14.5" cy="7" r="1" fill="#00ffff" opacity="0.8">
                                        <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" />
                                    </circle>

                                    {/* Robot Mouth/Speaker */}
                                    <rect x="10" y="9" width="4" height="1.5" rx="0.75" fill="#8b5cf6" opacity="0.7" />

                                    {/* Robot Body */}
                                    <rect x="8" y="12" width="8" height="6" rx="1" fill="currentColor" opacity="0.8" />

                                    {/* Robot Chest Panel */}
                                    <rect x="10" y="14" width="4" height="2" rx="0.5" fill="#00ffff" opacity="0.3" />

                                    {/* Robot Arms */}
                                    <rect x="5" y="13" width="2" height="4" rx="1" fill="currentColor" opacity="0.7" />
                                    <rect x="17" y="13" width="2" height="4" rx="1" fill="currentColor" opacity="0.7" />

                                    {/* Robot Legs */}
                                    <rect x="9" y="18" width="2" height="3" rx="1" fill="currentColor" opacity="0.7" />
                                    <rect x="13" y="18" width="2" height="3" rx="1" fill="currentColor" opacity="0.7" />

                                    {/* Antenna */}
                                    <line x1="12" y1="4" x2="12" y2="2" stroke="currentColor" strokeWidth="1" opacity="0.6" />
                                    <circle cx="12" cy="2" r="0.5" fill="#8b5cf6">
                                        <animate attributeName="fill" values="#8b5cf6;#00ffff;#8b5cf6" dur="3s" repeatCount="indefinite" />
                                    </circle>
                                </svg>
                            </div>

                            {/* Title and subtitle */}
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black gradient-text"
                                    style={{ fontFamily: 'Poppins, sans-serif' }}>
                                    Masters Union AI
                                </h1>
                                <p className="text-white/80 text-sm md:text-base font-medium slide-in-up"
                                    style={{ animationDelay: '0.2s' }}>
                                    Your Intelligent Assistant
                                </p>
                            </div>
                        </div>

                        {/* Right side with status and controls */}
                        <div className="flex items-center space-x-3">
                            {/* RAG Status Indicator */}
                            <div className="glass-container px-3 py-2 slide-in-up"
                                style={{ animationDelay: '0.4s' }}>
                                <div className="flex items-center space-x-2">
                                    <div className={`w-2 h-2 rounded-full ${ragStatus === 'initialized' ? 'bg-green-400 shadow-[0_0_10px_rgb(74,222,128)]' :
                                        ragStatus === 'failed' ? 'bg-red-400 shadow-[0_0_10px_rgb(248,113,113)]' :
                                            'bg-yellow-400 shadow-[0_0_10px_rgb(250,204,21)]'
                                        } animate-pulse`}></div>
                                    <span className="text-white/90 text-sm font-medium">
                                        {ragStatus === 'initialized' ? 'AI Active' :
                                            ragStatus === 'failed' ? 'Fallback Mode' :
                                                'Initializing...'}
                                    </span>
                                </div>
                            </div>

                            {/* Clear button */}
                            <button
                                onClick={onClearConversation}
                                className="neon-button px-4 py-2 rounded-xl text-white font-semibold text-sm
                                         slide-in-up hover:scale-105 transition-transform"
                                style={{ animationDelay: '0.6s' }}
                            >
                                Clear Chat
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    )
}

export default ChatHeader