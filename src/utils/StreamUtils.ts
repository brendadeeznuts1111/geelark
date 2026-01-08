/**
 * Enhanced stream utilities using Bun's native capabilities
 * Provides streaming conversions and transformations with throttling and progress support
 */

/**
 * Options for uint8ArrayToStream
 */
export interface StreamOptions {
  /** Chunk size in bytes (default: 64KB) */
  chunkSize?: number;
  /** Delay between chunks in ms for throttling (default: 0) */
  delay?: number;
}

/**
 * Output format for readableTo
 */
export type OutputFormat = 'arrayBuffer' | 'text' | 'json' | 'blob';

/**
 * Result type for readableTo based on format
 */
export type ReadableResult<T extends OutputFormat> = T extends 'arrayBuffer'
  ? ArrayBuffer
  : T extends 'text'
    ? string
    : T extends 'json'
      ? unknown
      : T extends 'blob'
        ? Blob
        : never;

/**
 * Stream utilities class with static methods
 */
export class StreamUtils {
  /**
   * Convert a Uint8Array to a ReadableStream with optional chunking and throttling
   * @param arr - The Uint8Array to convert
   * @param options - Stream options including chunkSize and delay
   * @returns A ReadableStream of the array data
   */
  static uint8ArrayToStream(
    arr: Uint8Array,
    options: StreamOptions = {}
  ): ReadableStream<Uint8Array> {
    const { chunkSize = 64 * 1024, delay = 0 } = options; // 64KB default

    // Handle empty array
    if (arr.length === 0) {
      return new ReadableStream({
        start(ctrl) {
          ctrl.close();
        }
      });
    }

    // Fast path: no delay, use Blob.stream()
    if (delay === 0) {
      return new Blob([arr]).stream(chunkSize);
    }

    // Throttled streaming for rate limiting / progress simulation
    return new ReadableStream({
      async start(controller) {
        let offset = 0;

        while (offset < arr.length) {
          const size = Math.min(chunkSize, arr.length - offset);
          const chunk = arr.subarray(offset, offset + size);
          controller.enqueue(chunk);
          offset += size;

          if (offset < arr.length) await Bun.sleep(delay);
        }

        controller.close();
      }
    });
  }

  /**
   * Convert a Node.js Readable stream to various formats
   * Uses Response as an adapter for clean conversion
   * @param stream - NodeJS.ReadableStream to convert
   * @param format - Desired output format
   * @returns Promise resolving to the requested format
   */
  static async readableTo<T extends OutputFormat>(
    stream: NodeJS.ReadableStream,
    format: T
  ): Promise<ReadableResult<T>> {
    const response = new Response(stream as ReadableStream);

    switch (format) {
      case 'arrayBuffer':
        return (await response.arrayBuffer()) as ReadableResult<T>;
      case 'text':
        return (await response.text()) as ReadableResult<T>;
      case 'json':
        return (await response.json()) as ReadableResult<T>;
      case 'blob':
        return (await response.blob()) as ReadableResult<T>;
      default:
        throw new Error(`Unknown format: ${format}`);
    }
  }

  /**
   * Convert Node.js Readable to ArrayBuffer
   */
  static async readableToArrayBuffer(
    stream: NodeJS.ReadableStream
  ): Promise<ArrayBuffer> {
    return this.readableTo(stream, 'arrayBuffer');
  }

  /**
   * Convert Node.js Readable to text string
   */
  static async readableToText(stream: NodeJS.ReadableStream): Promise<string> {
    return this.readableTo(stream, 'text');
  }

  /**
   * Convert Node.js Readable to parsed JSON
   */
  static async readableToJson<T = unknown>(
    stream: NodeJS.ReadableStream
  ): Promise<T> {
    return (await this.readableTo(stream, 'json')) as T;
  }

  /**
   * Convert Node.js Readable to Blob
   */
  static async readableToBlob(stream: NodeJS.ReadableStream): Promise<Blob> {
    return this.readableTo(stream, 'blob');
  }

  /**
   * Create a streaming response with proper error handling
   * @param data - Data to stream
   * @param options - Stream options
   * @returns Response object with streaming body
   */
  static createStreamingResponse(
    data: Uint8Array | string,
    options: StreamOptions = {}
  ): Response {
    const arr = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    const stream = this.uint8ArrayToStream(arr, options);

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Transfer-Encoding': 'chunked'
      }
    });
  }

  /**
   * Pipe a ReadableStream to a writable target (like a file)
   * @param stream - Source ReadableStream
   * @param target - Target file path
   */
  static async streamToFile(
    stream: ReadableStream<Uint8Array>,
    target: string
  ): Promise<void> {
    const chunks: Uint8Array[] = [];
    const reader = stream.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;

    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    await Bun.write(target, result);
  }

  /**
   * Merge multiple Uint8Arrays into a single stream
   * @param arrays - Arrays to merge
   * @param options - Stream options
   */
  static mergeArrays(
    arrays: Uint8Array[],
    options: StreamOptions = {}
  ): ReadableStream<Uint8Array> {
    return new ReadableStream({
      async start(controller) {
        for (const arr of arrays) {
          const stream = this.uint8ArrayToStream(arr, options);
          const reader = stream.getReader();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
            if (options.delay) await Bun.sleep(options.delay);
          }
        }
        controller.close();
      }
    });
  }

  /**
   * Create a transform stream that processes chunks
   * @param transform - Transform function for each chunk
   */
  static createTransformStream(
    transform: (chunk: Uint8Array) => Uint8Array | Promise<Uint8Array>
  ): TransformStream<Uint8Array, Uint8Array> {
    return new TransformStream({
      async transform(chunk, controller) {
        const result = await transform(chunk);
        controller.enqueue(result);
      }
    });
  }
}

// Export utility functions for convenient access
export const Stream = {
  /**
   * Convert Uint8Array to ReadableStream
   */
  toStream: (arr: Uint8Array, options?: StreamOptions) =>
    StreamUtils.uint8ArrayToStream(arr, options),

  /**
   * Convert Node.js Readable to ArrayBuffer
   */
  toArrayBuffer: (stream: NodeJS.ReadableStream) =>
    StreamUtils.readableToArrayBuffer(stream),

  /**
   * Convert Node.js Readable to text
   */
  toText: (stream: NodeJS.ReadableStream) =>
    StreamUtils.readableToText(stream),

  /**
   * Convert Node.js Readible to JSON
   */
  toJson: <T = unknown>(stream: NodeJS.ReadableStream) =>
    StreamUtils.readableToJson<T>(stream),

  /**
   * Convert Node.js Readable to Blob
   */
  toBlob: (stream: NodeJS.ReadableStream) =>
    StreamUtils.readableToBlob(stream),

  /**
   * Create streaming Response
   */
  response: (data: Uint8Array | string, options?: StreamOptions) =>
    StreamUtils.createStreamingResponse(data, options),

  /**
   * Stream to file
   */
  toFile: (stream: ReadableStream<Uint8Array>, target: string) =>
    StreamUtils.streamToFile(stream, target),

  /**
   * Merge multiple arrays into stream
   */
  merge: (arrays: Uint8Array[], options?: StreamOptions) =>
    StreamUtils.mergeArrays(arrays, options),

  /**
   * Create transform stream
   */
  transform: (fn: (chunk: Uint8Array) => Uint8Array | Promise<Uint8Array>) =>
    StreamUtils.createTransformStream(fn)
};

// Re-export types
export type { StreamOptions, OutputFormat, ReadableResult };
