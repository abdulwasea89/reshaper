import { useState, useCallback } from "react";

export function useStreamingChat() {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');

  const sendMessage = useCallback(async (prompt: string) => {
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: prompt }]);
    setIsLoading(true);
    setStreamingContent('');

    try {
      const response = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) throw new Error('Failed to generate');
      if (!response.body) throw new Error('No response body');

      // Read the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;
        setStreamingContent(fullContent); // Update UI in real-time
      }

      // Add assistant message when complete
      if (fullContent.trim()) {
        setMessages(prev => [...prev, { role: 'assistant', content: fullContent }]);
      }
      setStreamingContent('');

    } catch (error) {
      console.error('Streaming error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error generating response' }]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { messages, isLoading, streamingContent, sendMessage };
}