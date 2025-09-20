import React from 'react'

const ChatHeader = () => {
    return (
        <header className="bg-primary-700 text-white p-4 shadow-md">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <div className="font-bold text-xl md:text-2xl">Masters Union Chatbot</div>
                </div>
                <div className="text-sm md:text-base">Your AI Assistant</div>
            </div>
        </header>
    )
}

export default ChatHeader