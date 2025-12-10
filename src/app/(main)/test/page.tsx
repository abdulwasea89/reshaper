'use client';

import { useState, useRef, useEffect } from 'react';
import { useStreamingChat } from '@/hooks/useStreamingChat';

export default function TestPage() {
  const [input, setInput] = useState('');
  const { messages, isLoading, streamingContent, sendMessage } = useStreamingChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    sendMessage(input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-[600px] bg-gray-900 rounded-lg">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-3 rounded-lg ${msg.role === 'user'
                ? 'bg-blue-600 ml-auto max-w-[80%]'
                : 'bg-gray-700 max-w-[80%]'
              }`}
          >
            <p className="text-white whitespace-pre-wrap">{msg.content}</p>
          </div>
        ))}

        {/* Streaming message (while loading) */}
        {isLoading && streamingContent && (
          <div className="bg-gray-700 p-3 rounded-lg max-w-[80%]">
            <p className="text-white whitespace-pre-wrap">{streamingContent}</p>
            <span className="animate-pulse">▊</span>
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && !streamingContent && (
          <div className="bg-gray-700 p-3 rounded-lg max-w-[80%]">
            <span className="animate-pulse">Researching and generating post...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter a URL or topic to create a LinkedIn post..."
            className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            {isLoading ? 'Generating...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}