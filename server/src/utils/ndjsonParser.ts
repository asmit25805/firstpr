/**
 * Parses a fetch() ReadableStream of newline-delimited JSON objects, which
 * is the format Ollama's /api/chat streaming endpoint uses.
 */
export async function parseNDJSONStream(
  body: ReadableStream<Uint8Array>,
  onData: (obj: Record<string, unknown>) => void
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIndex = buffer.indexOf('\n');
    while (newlineIndex !== -1) {
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);
      if (line) {
        try {
          onData(JSON.parse(line));
        } catch {
          // Skip malformed lines rather than crashing the whole stream.
        }
      }
      newlineIndex = buffer.indexOf('\n');
    }
  }
}
