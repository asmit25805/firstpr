/**
 * Parses a fetch() ReadableStream of server-sent events and calls `onData`
 * with the raw string payload of each `data:` line. Shared by the
 * Anthropic, OpenAI, and Gemini providers, since all three stream over SSE
 * (Gemini only when called with `alt=sse`).
 */
export async function parseSSEStream(
  body: ReadableStream<Uint8Array>,
  onData: (data: string) => void
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');

    let boundary = buffer.indexOf('\n\n');
    while (boundary !== -1) {
      const rawEvent = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);

      for (const line of rawEvent.split('\n')) {
        if (line.startsWith('data:')) {
          const data = line.slice(5).trim();
          if (data) onData(data);
        }
      }
      boundary = buffer.indexOf('\n\n');
    }
  }
}
