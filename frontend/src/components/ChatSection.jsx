// src/components/ChatSection.jsx
import React, { useRef, useEffect } from 'react';
import { Send, MessageSquare, Brain, Loader2 } from 'lucide-react';

const ChatSection = ({ messages, input, isProcessing, setInput, handleSubmit }) => {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const Message = ({ message }) => {
    const isUser = message.type === 'user';
    
    return (
      <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser ? 'bg-blue-600 text-white' : 'bg-gradient-to-br from-blue-500 to-blue-700 text-white'
        }`}>
          {isUser ? <div className="w-4 h-4 bg-white rounded-full" /> : <Brain className="w-4 h-4" />}
        </div>
        <div className={`flex-1 ${isUser ? 'flex justify-end' : ''}`}>
          <div className={`max-w-[80%] p-3 rounded-2xl ${
            isUser 
              ? 'bg-blue-600 text-white rounded-br-md' 
              : 'bg-gray-800/70 border border-gray-600/50 rounded-bl-md shadow-lg text-white'
          }`}>
            <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </div>
            
            {message.hasChart && (
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-900/50 to-gray-800/50 rounded-lg border border-blue-700/30">
                <div className="h-40 bg-gray-900/50 rounded border border-gray-600/30 flex items-center justify-center">
                  <Send className="w-8 h-8 text-blue-400" />
                  <span className="ml-2 text-gray-300">Publication Trends Visualization</span>
                </div>
              </div>
            )}
            
            {message.sources && (
              <div className="mt-3 pt-3 border-t border-gray-600/30">
                <p className="text-xs text-gray-400 mb-2">Sources:</p>
                <div className="flex flex-wrap gap-2">
                  {message.sources.map((source, idx) => (
                    <span key={idx} className="px-2 py-1 bg-gray-700/70 text-gray-300 text-xs rounded-full border border-gray-600/30">
                      {source.title} ({source.count})
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <p className={`text-xs mt-2 ${isUser ? 'text-blue-200' : 'text-gray-400'}`}>
              {message.timestamp.toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const ProcessingIndicator = () => (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-blue-500 to-blue-700 text-white">
        <Brain className="w-4 h-4" />
      </div>
      <div className="flex-1">
        <div className="max-w-[80%] p-3 rounded-2xl bg-gray-800/70 border border-gray-600/50 rounded-bl-md shadow-lg text-white">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
            <span className="text-sm text-gray-300">Agent is processing your request...</span>
          </div>
          <div className="mt-2 flex gap-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-900/70 backdrop-blur-sm rounded-2xl border border-blue-800/30 shadow-2xl h-[calc(100vh-70px)] flex flex-col">
      <div className="p-4 border-b border-gray-700/50 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-white">Research Assistant</h3>
        <div className="ml-auto">
          {isProcessing && (
            <div className="flex items-center gap-2 text-sm text-blue-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing...</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-900/50 to-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-700/30">
              <MessageSquare className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Start a Conversation</h3>
            <p className="text-sm text-gray-400 max-w-md mx-auto">
              Ask me about research papers, trends, datasets, or any academic topic. I'll use various tools to provide comprehensive answers.
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <Message key={message.id} message={message} />
            ))}
            {isProcessing && <ProcessingIndicator />}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-700/50">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me about research papers, trends, datasets..."
            className="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={isProcessing || !input.trim()}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {isProcessing ? 'Processing...' : 'Send'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatSection;