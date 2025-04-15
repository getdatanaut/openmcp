/**
 * MIT License
 *
 * Copyright (c) 2024 Anthropic, PBC
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
// This is a copy of the StreamableHTTPClientTransport from the SDK, modified to work with Cloudflare Workers.
// JSON response has been removed

import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import type { JSONRPCMessage, RequestId } from '@modelcontextprotocol/sdk/types.js';
import { JSONRPCMessageSchema } from '@modelcontextprotocol/sdk/types.js';

const MAXIMUM_MESSAGE_SIZE = 4 * 1024 * 1024; // 4mb

/**
 * Configuration options for StreamableHTTPServerTransport
 */
export interface StreamableHTTPServerTransportOptions {
  /**
   * Function that generates a session ID for the transport.
   * The session ID SHOULD be globally unique and cryptographically secure (e.g., a securely generated UUID, a JWT, or a cryptographic hash)
   *
   * Return undefined to disable session management.
   */
  sessionIdGenerator: () => string | undefined;
}

export class StreamableHTTPServerTransport implements Transport {
  // when sessionId is not set (undefined), it means the transport is in stateless mode
  private readonly sessionIdGenerator: () => string | undefined;
  private _started: boolean = false;
  private _responseMapping: Map<RequestId, ReadableStreamDefaultController<Uint8Array>> = new Map();
  private _requestResponseMap: Map<RequestId, JSONRPCMessage> = new Map();
  private _initialized: boolean = false;
  private _standaloneSSE: ReadableStreamDefaultController<Uint8Array> | undefined;
  private readonly _encoder: TextEncoder = new TextEncoder();

  sessionId?: string | undefined;
  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: (message: JSONRPCMessage) => void;

  constructor(options: StreamableHTTPServerTransportOptions) {
    this.sessionIdGenerator = options.sessionIdGenerator;
  }

  /**
   * Starts the transport. This is required by the Transport interface but is a no-op
   * for the Streamable HTTP transport as connections are managed per-request.
   */
  async start() {
    if (this._started) {
      throw new Error('Transport already started');
    }
    this._started = true;
  }
  /**
   * Handles an incoming HTTP request, whether GET or POST
   */
  handleRequest(req: Request): Promise<Response> {
    switch (req.method) {
      case 'POST':
        return this.handlePostRequest(req);
      case 'GET':
        return this.handleGetRequest(req);
      case 'DELETE':
        return this.handleDeleteRequest(req);
      default:
        return this.handleUnsupportedRequest();
    }
  }
  /**
   * Handles GET requests for SSE stream
   */
  async handleGetRequest(req: Request): Promise<Response> {
    // The client MUST include an Accept header, listing text/event-stream as a supported content type.
    const acceptHeader = req.headers.get('accept');
    if (!acceptHeader?.includes('text/event-stream')) {
      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Not Acceptable: Client must accept text/event-stream',
          },
          id: null,
        }),
        {
          status: 406,
        },
      );
    }

    // If a Mcp-Session-Id is returned by the server during initialization,
    // clients using the Streamable HTTP transport MUST include it
    // in the Mcp-Session-Id header on all of their subsequent HTTP requests.
    const res = this.validateSession(req);
    if (res) {
      return res;
    }

    // The server MUST either return Content-Type: text/event-stream in response to this HTTP GET,
    // or else return HTTP 405 Method Not Allowed
    const headers: Record<string, string> = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    };

    // After initialization, always include the session ID if we have one
    if (this.sessionId !== undefined) {
      headers['mcp-session-id'] = this.sessionId;
    }

    // The server MAY include a Last-Event-ID header in the response to this HTTP GET.
    // Resumability will be supported in the future

    // Check if there's already an active standalone SSE stream for this session

    if (this._standaloneSSE !== undefined) {
      // Only one GET SSE stream is allowed per session
      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Conflict: Only one SSE stream is allowed per session',
          },
          id: null,
        }),
      );
    }

    const stream = new ReadableStream({
      start: controller => {
        this._standaloneSSE = controller;
      },
      cancel: () => {
        this._standaloneSSE = undefined;
        this.onclose?.();
      },
    });

    return new Response(stream, {
      headers,
      status: 200,
    });
  }

  /**
   * Handles unsupported requests (PUT, PATCH, etc.)
   */
  protected async handleUnsupportedRequest(): Promise<Response> {
    return new Response(
      JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Method not allowed.',
        },
        id: null,
      }),
      {
        status: 405,
        headers: {
          Allow: 'GET, POST, DELETE',
        },
      },
    );
  }

  /**
   * Handles POST requests containing JSON-RPC messages
   */
  protected async handlePostRequest(req: Request): Promise<Response> {
    try {
      // Validate the Accept header
      const acceptHeader = req.headers.get('Accept');
      // The client MUST include an Accept header, listing both application/json and text/event-stream as supported content types.
      if (!acceptHeader?.includes('application/json') || !acceptHeader.includes('text/event-stream')) {
        return new Response(
          JSON.stringify({
            jsonrpc: '2.0',
            error: {
              code: -32000,
              message: 'Not Acceptable: Client must accept both application/json and text/event-stream',
            },
            id: null,
          }),
          {
            status: 406,
          },
        );
      }

      const ct = req.headers.get('Content-Type');
      if (!ct?.includes('application/json')) {
        return new Response(
          JSON.stringify({
            jsonrpc: '2.0',
            error: {
              code: -32000,
              message: 'Unsupported Media Type: Content-Type must be application/json',
            },
            id: null,
          }),
          {
            status: 415,
          },
        );
      }

      let rawMessage: unknown;
      try {
        rawMessage = await req.json();
      } catch {
        if (req.body) {
          const encoding = getCharset(ct) ?? 'utf-8';
          rawMessage = JSON.parse(
            await readAsString(req.body, {
              limit: MAXIMUM_MESSAGE_SIZE,
              encoding,
            }),
          );
        }
      }

      let messages: JSONRPCMessage[];

      // handle batch and single messages
      if (Array.isArray(rawMessage)) {
        messages = rawMessage.map(msg => JSONRPCMessageSchema.parse(msg));
      } else {
        messages = [JSONRPCMessageSchema.parse(rawMessage)];
      }

      // Check if this is an initialization request
      // https://spec.modelcontextprotocol.io/specification/2025-03-26/basic/lifecycle/
      const isInitializationRequest = messages.some(msg => 'method' in msg && msg.method === 'initialize');
      if (isInitializationRequest) {
        if (this._initialized) {
          return new Response(
            JSON.stringify({
              jsonrpc: '2.0',
              error: {
                code: -32600,
                message: 'Invalid Request: Server already initialized',
              },
              id: null,
            }),
            {
              status: 400,
            },
          );
        }

        if (messages.length > 1) {
          return new Response(
            JSON.stringify({
              jsonrpc: '2.0',
              error: {
                code: -32600,
                message: 'Invalid Request: Only one initialization request is allowed',
              },
              id: null,
            }),
            {
              status: 400,
            },
          );
        }
        this.sessionId = this.sessionIdGenerator();
        this._initialized = true;
      } else {
        // If a Mcp-Session-Id is returned by the server during initialization,
        // clients using the Streamable HTTP transport MUST include it
        // in the Mcp-Session-Id header on all of their subsequent HTTP requests.
        const res = this.validateSession(req);
        if (res) {
          return res;
        }
      }

      // check if it contains requests
      const hasRequests = messages.some(msg => 'method' in msg && 'id' in msg);
      const hasOnlyNotificationsOrResponses = messages.every(
        msg => ('method' in msg && !('id' in msg)) || 'result' in msg || 'error' in msg,
      );

      if (hasOnlyNotificationsOrResponses) {
        // handle each message
        for (const message of messages) {
          this.onmessage?.(message);
        }

        // if it only contains notifications or responses, return 202
        return new Response(undefined, {
          status: 202,
        });
      } else if (hasRequests) {
        // The default behavior is to use SSE streaming
        // but in some cases server will return JSON responses
        const headers: Record<string, string> = {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        };

        // After initialization, always include the session ID if we have one
        if (this.sessionId !== undefined) {
          headers['mcp-session-id'] = this.sessionId;
        }

        let _controller: ReadableStreamDefaultController;
        const stream = new ReadableStream({
          start: controller => {
            // Store the response for this request to send messages back through this connection
            // We need to track by request ID to maintain the connection
            for (const message of messages) {
              if ('method' in message && 'id' in message) {
                this._responseMapping.set(message.id, controller);
              }
            }

            _controller = controller;
          },
          cancel: () => {
            // Remove all entries that reference this response
            for (const [id, storedController] of this._responseMapping.entries()) {
              if (storedController === _controller) {
                this._responseMapping.delete(id);
                this._requestResponseMap.delete(id);
              }
            }
            this.onclose?.();
          },
        });

        // handle each message
        for (const message of messages) {
          this.onmessage?.(message);
        }
        // The server SHOULD NOT close the SSE stream before sending all JSON-RPC responses
        // This will be handled by the send() method when responses are ready

        return new Response(stream, {
          headers,
          status: 200,
        });
      }

      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: -32600,
            message: 'Invalid Request: No requests found',
          },
          id: null,
        }),
        {
          status: 400,
        },
      );
    } catch (error) {
      this.onerror?.(error as Error);
      // return JSON-RPC formatted error
      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: -32700,
            message: 'Parse error',
            data: String(error),
          },
          id: null,
        }),
        {
          status: 400,
        },
      );
    }
  }

  /**
   * Handles DELETE requests to terminate sessions
   */
  private async handleDeleteRequest(req: Request): Promise<Response> {
    const res = this.validateSession(req);
    if (res) {
      return res;
    }

    await this.close();
    return new Response(undefined, { status: 200 });
  }

  /**
   * Validates session ID for non-initialization requests
   * Returns true if the session is valid, false otherwise
   */
  private validateSession(req: Request): Response | undefined {
    if (!this._initialized) {
      // If the server has not been initialized yet, reject all requests
      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Bad Request: Server not initialized',
          },
          id: null,
        }),
        {
          status: 400,
        },
      );
    }

    const sessionId = req.headers.get('mcp-session-id');
    if (this.sessionId === undefined) {
      // If the session ID is not set, the session management is disabled
      // and we don't need to validate the session ID
      return;
    }

    if (!sessionId) {
      // Non-initialization requests without a session ID should return 400 Bad Request
      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Bad Request: Mcp-Session-Id header is required',
          },
          id: null,
        }),
        {
          status: 400,
        },
      );
    } else if (Array.isArray(sessionId)) {
      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Bad Request: Mcp-Session-Id header must be a single value',
          },
          id: null,
        }),
        {
          status: 400,
        },
      );
    } else if (sessionId !== this.sessionId) {
      // Reject requests with invalid session ID with 404 Not Found
      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: -32001,
            message: 'Session not found',
          },
          id: null,
        }),
        {
          status: 404,
        },
      );
    }
  }

  async close(): Promise<void> {
    // Close all SSE connections
    this._responseMapping.forEach(controller => {
      controller.close();
    });
    this._responseMapping.clear();

    // Clear any pending responses
    this._requestResponseMap.clear();

    this.onclose?.();
  }

  async send(message: JSONRPCMessage, options?: { relatedRequestId?: RequestId }): Promise<void> {
    let requestId = options?.relatedRequestId;
    if ('result' in message || 'error' in message) {
      // If the message is a response, use the request ID from the message
      requestId = message.id;
    }

    // Check if this message should be sent on the standalone SSE stream (no request ID)
    // Ignore notifications from tools (which have relatedRequestId set)
    // Those will be sent via dedicated response SSE streams
    if (requestId === undefined) {
      // For standalone SSE streams, we can only send requests and notifications
      if ('result' in message || 'error' in message) {
        throw new Error('Cannot send a response on a standalone SSE stream unless resuming a previous client request');
      }

      if (this._standaloneSSE === undefined) {
        // The spec says the server MAY send messages on the stream, so it's ok to discard if no stream
        return;
      }

      // Send the message to the standalone SSE stream
      this._standaloneSSE.enqueue(this._encoder.encode(`event: message\ndata: ${JSON.stringify(message)}\n\n`));
      return;
    }

    // Get the response for this request
    const controller = this._responseMapping.get(requestId);
    if (!controller) {
      throw new Error(`No connection established for request ID: ${String(requestId)}`);
    }

    controller.enqueue(this._encoder.encode(`event: message\ndata: ${JSON.stringify(message)}\n\n`));
    if ('result' in message || 'error' in message) {
      this._requestResponseMap.set(requestId, message);

      // Get all request IDs that share the same request response object
      const relatedIds = Array.from(this._responseMapping.entries())
        .filter(([_, res]) => res === controller)
        .map(([id]) => id);

      // Check if we have responses for all requests using this connection
      const allResponsesReady = relatedIds.every(id => this._requestResponseMap.has(id));

      if (allResponsesReady) {
        // End the SSE stream
        controller.close();
        // Clean up
        for (const id of relatedIds) {
          this._requestResponseMap.delete(id);
          this._responseMapping.delete(id);
        }
      }
    }
  }
}

async function* getRawBody(stream: ReadableStream<Uint8Array>, limit: number): AsyncIterable<Uint8Array> {
  const reader = stream.getReader();
  let totalSize = 0;

  try {
    while (totalSize < limit) {
      const { done, value } = await reader.read();
      if (done) break;

      if (value) {
        const remaining = limit - totalSize;
        if (value.length > remaining) {
          yield value.subarray(0, remaining);
          totalSize += remaining;
          break;
        } else {
          yield value;
          totalSize += value.length;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

async function readAsString(
  stream: ReadableStream<Uint8Array>,
  options: { limit: number; encoding: string },
): Promise<string> {
  const decoder = new TextDecoder(options.encoding);
  let output = '';
  for await (const chunk of getRawBody(stream, options.limit)) {
    output += decoder.decode(chunk, { stream: true });
  }

  output += decoder.decode(); // flush any remaining bytes
  return output;
}

function getCharset(contentTypeHeader: string): string | undefined {
  const parts = contentTypeHeader.split(';');
  for (const part of parts) {
    const [key, value] = part.trim().split('=');
    if (key?.toLowerCase() === 'charset') {
      return value;
    }
  }

  return;
}
