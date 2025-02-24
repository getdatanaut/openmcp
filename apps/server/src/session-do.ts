import { DurableObject } from 'cloudflare:workers';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { JSONRPCMessageSchema, type JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createServer as createServer2 } from './create-server';

export class SessionDO extends DurableObject<Env> implements Transport {
	private _controller: ReadableStreamDefaultController<Uint8Array> | null = null;
	private _stream: ReadableStream<Uint8Array> | null = null;
	private _response: Response | null = null;
	private _encoder = new TextEncoder();
	private _endpoint: string = '/messages';
	private _server: McpServer;

	onclose?: () => void;
	onerror?: (error: Error) => void;
	onmessage?: (message: JSONRPCMessage) => void;

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this._server = createServer2();
	}

	private get sessionId() {
		return this.ctx.id.toString();
	}

	/**
	 * Handles the initial SSE connection request.
	 *
	 * This should be called when a GET request is made to establish the SSE stream.
	 */
	async start(): Promise<void> {
		this._stream = new ReadableStream({
			start: (controller) => {
				console.log('SessionDO.stream.start', this.sessionId);
				this._controller = controller;
			},
			cancel: () => {
				console.log('SessionDO.stream.cancel', this.sessionId);
				this._controller = null;
				this.onclose?.();
			},
		});

		if (this._response) {
			throw new Error('SessionDO already started! If using Server class, note that connect() calls start() automatically.');
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
		this._controller?.enqueue(this._encoder.encode(`event: endpoint\ndata: ${encodeURI(this._endpoint)}?sessionId=${this.sessionId}\n\n`));
	}

	/**
	 * Handles incoming POST messages.
	 *
	 * This should be called when a POST request is made to send a message to the server.
	 */
	async handlePostMessage(request: Request): Promise<Response> {
		if (!this._controller) {
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

		console.log('SessionDO.handleMessage', this.sessionId, parsedMessage);

		this.onmessage?.(parsedMessage);
	}

	async close(): Promise<void> {
		console.log('SessionDO.close', this.sessionId);
		this._controller?.close();
		this._controller = null;
		this.onclose?.();
	}

	async send(message: JSONRPCMessage): Promise<void> {
		if (!this._controller) {
			throw new Error('Not connected');
		}

		console.log('SessionDO.send', this.sessionId, message);

		this._controller.enqueue(this._encoder.encode(`event: message\ndata: ${JSON.stringify(message)}\n\n`));
	}

	async fetch(request: Request) {
		const url = new URL(request.url);
		console.log('SessionDO.fetch', this.sessionId, request.method, url.pathname);

		if (request.method === 'GET') {
			await this._server.connect(this);
			return this._response!;
		}

		// For POST requests, handle incoming messages
		if (request.method === 'POST' && url.pathname === '/messages') {
			return this.handlePostMessage(request);
		}

		return new Response('Method not allowed', { status: 405 });
	}
}
