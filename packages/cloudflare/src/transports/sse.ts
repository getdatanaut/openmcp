import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';
import { JSONRPCMessageSchema } from '@modelcontextprotocol/sdk/types.js';

/**
 * Server transport for SSE: this will send messages over an SSE connection and receive messages from HTTP POST requests.
 *
 * This implementation uses web standard Request and Response objects, making it compatible with Cloudflare Workers
 * and other modern web platforms.
 */
export class SSEServerTransport implements Transport {
  private _controller: ReadableStreamDefaultController<Uint8Array> | null = null;
  private _stream: ReadableStream<Uint8Array>;
  private _response: Response | null = null;
  private _encoder = new TextEncoder();
  private _endpoint: string;
  private _sessionId: string;

  onclose?: () => void;
  // eslint-disable-next-line no-unused-vars
  onerror?: (error: Error) => void;
  // eslint-disable-next-line no-unused-vars
  onmessage?: (message: JSONRPCMessage) => void;

  /**
   * Creates a new SSE server transport, which will direct the client to POST messages to the relative or absolute URL identified by `_endpoint`.
   */
  constructor(endpoint: string, sessionId: string) {
    this._endpoint = endpoint;
    this._sessionId = sessionId;

    this._stream = new ReadableStream({
      start: controller => {
        this._controller = controller;
      },
      cancel: () => {
        this._controller = null;
        this.onclose?.();
      },
    });
  }

  /**
   * Handles the initial SSE connection request.
   *
   * This should be called when a GET request is made to establish the SSE stream.
   */
  async start(): Promise<void> {
    if (this._response) {
      console.error('SSEServerTransport.start: already started');
      throw new Error(
        'SSEServerTransport already started! If using Server class, note that connect() calls start() automatically.',
      );
    }

    // Initialize the response with the stream
    this._response = new Response(this._stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });

    // Send the endpoint event
    this._controller?.enqueue(
      this._encoder.encode(`event: endpoint\ndata: ${encodeURI(this._endpoint)}?sessionId=${this._sessionId}\n\n`),
    );
  }

  /**
   * Returns the current response object. Should be called after start().
   */
  getResponse(): Response | null {
    return this._response;
  }

  /**
   * Handles incoming POST messages.
   *
   * This should be called when a POST request is made to send a message to the server.
   */
  async handlePostMessage(request: Request): Promise<Response> {
    if (!this._controller) {
      console.error('SSEServerTransport.handlePostMessage: controller not found');
      const message = 'SSE connection not established';
      return new Response(message, { status: 500 });
    }

    try {
      const contentTypeHeader = request.headers.get('content-type');
      if (!contentTypeHeader?.includes('application/json')) {
        throw new Error(`Unsupported content-type: ${contentTypeHeader}`);
      }

      const body = await request.json();
      await this.handleMessage(body);

      return new Response('Accepted', { status: 202 });
    } catch (error) {
      console.error('SSEServerTransport.handlePostMessage:', error);
      return new Response(String(error), { status: 400 });
    }
  }

  /**
   * Handle a client message, regardless of how it arrived. This can be used to inform the server of messages that arrive via a means different than HTTP POST.
   */
  async handleMessage(message: unknown): Promise<void> {
    let parsedMessage: JSONRPCMessage;
    try {
      parsedMessage = JSONRPCMessageSchema.parse(message);
    } catch (error) {
      this.onerror?.(error as Error);
      throw error;
    }

    this.onmessage?.(parsedMessage);
  }

  async close(): Promise<void> {
    this._controller?.close();
    this._controller = null;
    this.onclose?.();
  }

  async send(message: JSONRPCMessage): Promise<void> {
    if (!this._controller) {
      console.error('SSEServerTransport.send: not connected');
      throw new Error('Not connected');
    }

    this._controller.enqueue(this._encoder.encode(`event: message\ndata: ${JSON.stringify(message)}\n\n`));
  }

  /**
   * Returns the session ID for this transport.
   *
   * This can be used to route incoming POST requests.
   */
  get sessionId(): string {
    return this._sessionId;
  }
}
