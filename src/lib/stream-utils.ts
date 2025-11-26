/**
 * Utility functions for streaming responses from NEAR Cloud AI
 */

// Reading speed: ~200-250 words per minute = ~4-5 characters per second
// Add small delay between chunks to make it readable
const READING_SPEED_DELAY = 30; // milliseconds per character (adjustable)

export async function* streamChatCompletion(
  reader: ReadableStreamDefaultReader<Uint8Array>
): AsyncGenerator<string, void, unknown> {
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        // Process any remaining buffer
        if (buffer.trim()) {
          yield buffer;
        }
        break;
      }

      // Decode the chunk and add to buffer
      buffer += decoder.decode(value, { stream: true });
      
      // Process complete lines (SSE format: data: {...})
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          if (data === '[DONE]') {
            return;
          }

          try {
            const json = JSON.parse(data);
            const content = json.choices?.[0]?.delta?.content || '';
            if (content) {
              // Add delay based on content length to simulate reading speed
              const delay = content.length * READING_SPEED_DELAY;
              await new Promise(resolve => setTimeout(resolve, Math.min(delay, 100))); // Cap at 100ms per chunk
              yield content;
            }
          } catch (e) {
            // Skip invalid JSON
            continue;
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

