import * as timers from 'node:timers/promises';

import { HttpParamStyles } from '@stoplight/types';
import fetchMock from 'fetch-mock';
import { describe, expect, it } from 'vitest';

import { Client, type OperationClientMeta } from '../src/client.ts';

describe('Client', () => {
  const baseURL = new URL('https://api.datanaut.ai');

  describe('createTimedController()', () => {
    it.concurrent('should create a controller that aborts after the specified timeout', async () => {
      using controller = Client.createTimedController(50);

      const abortPromise = new Promise<void>(resolve => {
        controller.signal.addEventListener('abort', () => resolve());
      });

      await expect(abortPromise).resolves.toBeUndefined();
      expect(controller.signal.aborted).toBe(true);
    });

    it.concurrent('should allow manual abort before timeout', async () => {
      using controller = Client.createTimedController(1000);

      const abortPromise = new Promise<void>(resolve => {
        controller.signal.addEventListener('abort', () => resolve());
      });

      controller.abort();

      await expect(abortPromise).resolves.toBeUndefined();
      expect(controller.signal.aborted).toBe(true);
    });

    it.concurrent('should be disposable', async () => {
      let controller: ReturnType<typeof Client.createTimedController>;

      {
        using _controller = Client.createTimedController(1);
        controller = _controller;
        expect(controller.signal.aborted).toBe(false);
      }

      await timers.setTimeout(20);

      // the controller never gets aborted
      expect(controller.signal.aborted).toBe(false);
    });
  });

  describe('createFetchRequestInit()', () => {
    it('should create a basic URL with no parameters', () => {
      const client = createClient({
        baseURL: new URL('https://datanaut.ai/api'),
      });
      const meta: OperationClientMeta = {
        path: '/',
        method: 'GET',
      };

      const [url, init] = client.createFetchRequestInit(meta, {});

      expect(url.toString()).toBe('https://datanaut.ai/api/');
      expect(init.method).toBe('GET');
      expect(init.body).toBeUndefined();
    });

    it('should handle simple path parameters', () => {
      const client = createClient({});
      const meta: OperationClientMeta = {
        path: '/users/{userId}/posts/{postId}',
        method: 'GET',
      };

      const [url, init] = client.createFetchRequestInit(meta, {
        path: {
          userId: 123,
          postId: 456,
        },
      });

      expect(url.toString()).toBe('https://api.datanaut.ai/users/123/posts/456');
      expect(init.method).toBe('GET');
    });

    it.each([
      {
        style: HttpParamStyles.Form,
        explode: true,
        query: { tags: ['javascript', 'typescript'] },
        expected: 'https://api.datanaut.ai/search?tags=javascript&tags=typescript',
      },
      {
        style: HttpParamStyles.Form,
        explode: false,
        query: { tags: ['javascript', 'typescript'] },
        expected: 'https://api.datanaut.ai/search?tags=javascript%2Ctypescript',
      },
      {
        style: HttpParamStyles.SpaceDelimited,
        explode: false,
        query: { tags: ['javascript', 'typescript'] },
        expected: 'https://api.datanaut.ai/search?tags=javascript+typescript',
      },
      {
        style: HttpParamStyles.PipeDelimited,
        explode: false,
        query: { tags: ['javascript', 'typescript'] },
        expected: 'https://api.datanaut.ai/search?tags=javascript%7Ctypescript',
      },
      {
        style: HttpParamStyles.CommaDelimited,
        explode: false,
        query: { tags: ['javascript', 'typescript'] },
        expected: 'https://api.datanaut.ai/search?tags=javascript%2Ctypescript',
      },
      {
        style: HttpParamStyles.TabDelimited,
        explode: false,
        query: { tags: ['javascript', 'typescript'] },
        expected: 'https://api.datanaut.ai/search?tags=javascript%09typescript',
      },
    ] as const)(
      'should handle array query parameters with $style style (explode=$explode)',
      ({ style, explode, query, expected }) => {
        const client = createClient({});
        const meta: OperationClientMeta = {
          path: '/search',
          method: 'GET',
          params: {
            query: {
              tags: { style, explode },
            },
          },
        };

        const [url] = client.createFetchRequestInit(meta, { query });

        expect(url.toString()).toBe(expected);
      },
    );

    it.each([
      {
        style: HttpParamStyles.Form,
        explode: true,
        query: { filter: { color: 'red', size: 'large' } },
        expected: 'https://api.datanaut.ai/search?color=red&size=large',
      },
      {
        style: HttpParamStyles.Form,
        explode: false,
        query: { filter: { color: 'red', size: 'large' } },
        expected: 'https://api.datanaut.ai/search?filter=color%2Cred%2Csize%2Clarge',
      },
      {
        style: HttpParamStyles.DeepObject,
        explode: false, // explode doesn't matter for DeepObject
        query: { filter: { color: 'red', size: 'large' } },
        expected: 'https://api.datanaut.ai/search?filter%5Bcolor%5D=red&filter%5Bsize%5D=large',
      },
    ] as const)(
      'should handle object query parameters with $style style (explode=$explode)',
      ({ style, explode, query, expected }) => {
        const client = createClient({});
        const meta: OperationClientMeta = {
          path: '/search',
          method: 'GET',
          params: {
            query: {
              filter: { style, explode },
            },
          },
        };

        const [url] = client.createFetchRequestInit(meta, { query });

        expect(url.toString()).toBe(expected);
      },
    );

    it('should handle path parameters with Label style', () => {
      const client = createClient({});
      const meta: OperationClientMeta = {
        path: '/users/{.userId}/posts/{.postId}',
        method: 'GET',
      };

      const [url] = client.createFetchRequestInit(meta, {
        path: {
          userId: 123,
          postId: 456,
        },
      });

      // The path should be expanded with Label style
      expect(url.toString()).toBe('https://api.datanaut.ai/users/.123/posts/.456');
    });

    it('should handle path parameters with Matrix style', () => {
      const client = createClient({});
      const meta: OperationClientMeta = {
        path: '/users/{;userId}/posts/{;postId}',
        method: 'GET',
      };

      const [url] = client.createFetchRequestInit(meta, {
        path: {
          userId: 123,
          postId: 456,
        },
      });

      // The path should be expanded with Matrix style
      expect(url.toString()).toBe('https://api.datanaut.ai/users/;userId=123/posts/;postId=456');
    });

    it('should handle mixed path parameter styles', () => {
      const client = createClient({});
      const meta: OperationClientMeta = {
        path: '/users/{userId}/posts/{.postId}/comments/{;commentId}',
        method: 'GET',
      };

      const [url] = client.createFetchRequestInit(meta, {
        path: {
          userId: 123,
          postId: 456,
          commentId: 789,
        },
      });

      expect(url.toString()).toBe('https://api.datanaut.ai/users/123/posts/.456/comments/;commentId=789');
    });

    it('should handle complex query parameters with multiple styles', () => {
      const client = createClient({});
      const meta: OperationClientMeta = {
        path: '/search',
        method: 'GET',
        params: {
          query: {
            tags: { style: HttpParamStyles.Form, explode: true },
            filter: { style: HttpParamStyles.SpaceDelimited },
            sort: { style: HttpParamStyles.PipeDelimited },
            fields: { style: HttpParamStyles.CommaDelimited },
            options: { style: HttpParamStyles.DeepObject },
          },
        },
      };

      const [url] = client.createFetchRequestInit(meta, {
        query: {
          tags: ['javascript', 'typescript'],
          filter: ['active', 'featured'],
          sort: ['name', 'date'],
          fields: ['id', 'title', 'author'],
          options: { limit: 10, offset: 20 },
        },
      });

      // Check that URL contains all the expected query parameters with their respective styles
      const urlString = url.toString();
      expect(urlString).toContain('tags=javascript&tags=typescript');
      expect(urlString).toContain('filter=active+featured');
      expect(urlString).toContain('sort=name%7Cdate');
      expect(urlString).toContain('fields=id%2Ctitle%2Cauthor');
      expect(urlString).toContain('options%5Blimit%5D=10');
      expect(urlString).toContain('options%5Boffset%5D=20');
    });

    it('should handle empty and undefined query parameters', () => {
      const client = createClient({});
      const meta: OperationClientMeta = {
        path: '/search',
        method: 'GET',
        params: {
          query: {
            q: { style: HttpParamStyles.Form },
            filter: { style: HttpParamStyles.Form },
            sort: { style: HttpParamStyles.Form },
          },
        },
      };

      const [url] = client.createFetchRequestInit(meta, {
        query: {
          q: '',
          filter: undefined,
          sort: null,
        },
      });

      expect(url.toString()).toBe('https://api.datanaut.ai/search?q=&sort=null');
    });

    it('should handle headers in request init', () => {
      const client = createClient({});
      const meta: OperationClientMeta = {
        path: '/test',
        method: 'GET',
      };

      const [, { headers }] = client.createFetchRequestInit(meta, {
        headers: {
          'X-API-Key': 'test-key',
          'Accept-Language': 'en-US',
        },
      });

      expect(headers.get('X-API-Key')).toBe('test-key');
      expect(headers.get('Accept-Language')).toBe('en-US');
    });

    it('should handle array headers', () => {
      const client = createClient({});
      const meta: OperationClientMeta = {
        path: '/test',
        method: 'GET',
      };

      const [, { headers }] = client.createFetchRequestInit(meta, {
        headers: {
          'X-Custom-Header': ['value1', 'value2'],
        },
      });

      expect(headers.get('X-Custom-Header')).toBe('value1, value2');
    });
  });

  describe('request()', () => {
    it.concurrent('should send a GET request and return text response', async () => {
      const fetch = fetchMock.createInstance();
      const client = createClient({ fetch: fetch.fetchHandler });
      const meta: OperationClientMeta = {
        path: '/test',
        method: 'GET',
      };

      fetch.get('https://api.datanaut.ai/test', {
        status: 200,
        body: 'response text',
        headers: { 'content-type': 'text/plain' },
      });

      await expect(client.request(meta, {})).resolves.toStrictEqual({
        ok: true,
        status: 200,
        error: null,
        data: 'response text',
      });
    });

    it.concurrent('should send a POST request with JSON body', async () => {
      const fetch = fetchMock.createInstance();
      const client = createClient({ fetch: fetch.fetchHandler });

      const meta: OperationClientMeta = {
        path: '/post',
        method: 'POST',
        requestContentType: 'application/json',
      };

      fetch.post(
        req =>
          req.url === 'https://api.datanaut.ai/post' &&
          req.options.headers?.['content-type'] === 'application/json; charset=utf-8',
        {
          status: 200,
          body: { success: true, id: 123 },
          headers: { 'content-type': 'application/json' },
        },
      );

      const requestBody = { name: 'Test User', email: 'test@example.com' };
      await expect(client.request(meta, { body: requestBody })).resolves.toStrictEqual({
        ok: true,
        status: 200,
        error: null,
        data: { success: true, id: 123 },
      });
    });

    it.concurrent('should send a PUT request to update a resource', async () => {
      const fetch = fetchMock.createInstance();
      const client = createClient({ fetch: fetch.fetchHandler });

      const meta: OperationClientMeta = {
        path: '/users/123',
        method: 'PUT',
        requestContentType: 'application/json',
      };

      fetch.put(
        req =>
          req.url === 'https://api.datanaut.ai/users/123' &&
          req.options.headers?.['content-type'] === 'application/json; charset=utf-8',
        {
          status: 200,
          body: { success: true, updated: true },
          headers: { 'content-type': 'application/json' },
        },
      );

      const requestBody = { name: 'Updated Name', role: 'admin' };
      await expect(client.request(meta, { body: requestBody })).resolves.toStrictEqual({
        ok: true,
        status: 200,
        error: null,
        data: {
          success: true,
          updated: true,
        },
      });
    });

    it.concurrent('should send a DELETE request', async () => {
      const fetch = fetchMock.createInstance();
      const client = createClient({ fetch: fetch.fetchHandler });

      const meta: OperationClientMeta = {
        path: '/users/456',
        method: 'DELETE',
      };

      fetch.delete('https://api.datanaut.ai/users/456', {
        status: 204,
        headers: {},
      });

      await expect(client.request(meta, {})).resolves.toStrictEqual({
        ok: true,
        status: 204,
        error: null,
        data: null,
      });
    });

    it.concurrent('should handle error responses', async () => {
      const fetch = fetchMock.createInstance();
      const client = createClient({ fetch: fetch.fetchHandler });

      const meta: OperationClientMeta = {
        path: '/not-found',
        method: 'GET',
      };

      fetch.get(req => req.url === 'https://api.datanaut.ai/not-found', {
        status: 404,
        body: { error: 'Resource not found' },
        headers: { 'content-type': 'application/json' },
      });

      const result = await client.request(meta, {});

      expect(result).toStrictEqual({
        ok: false,
        status: 404,
        error: 'Not Found',
        data: { error: 'Resource not found' },
      });
    });

    it.concurrent('should handle URL with path parameters', async () => {
      const fetch = fetchMock.createInstance();
      const client = createClient({ fetch: fetch.fetchHandler });

      const meta: OperationClientMeta = {
        path: '/users/{userId}/posts/{postId}',
        method: 'GET',
      };

      fetch.get(req => req.url === 'https://api.datanaut.ai/users/123/posts/456', {
        status: 200,
        body: { userId: 123, postId: 456, title: 'Test Post' },
        headers: { 'content-type': 'application/json' },
      });

      await expect(
        client.request(meta, {
          path: {
            userId: 123,
            postId: 456,
          },
        }),
      ).resolves.toStrictEqual({
        ok: true,
        status: 200,
        error: null,
        data: { userId: 123, postId: 456, title: 'Test Post' },
      });
    });

    it.concurrent('should handle query parameters with different styles', async () => {
      const fetch = fetchMock.createInstance();
      const client = createClient({ fetch: fetch.fetchHandler });

      const meta: OperationClientMeta = {
        path: '/search',
        method: 'GET',
        params: {
          query: {
            tags: { style: HttpParamStyles.Form, explode: true },
            filter: { style: HttpParamStyles.SpaceDelimited },
          },
        },
      };

      fetch.get(
        req => {
          const url = new URL(req.url);
          return (
            url.pathname === '/search' &&
            url.searchParams.getAll('tags').includes('javascript') &&
            url.searchParams.getAll('tags').includes('typescript') &&
            url.searchParams.get('filter') === 'active featured'
          );
        },
        {
          status: 200,
          body: { results: ['item1', 'item2'] },
          headers: { 'content-type': 'application/json' },
        },
      );

      await expect(
        client.request(meta, {
          query: {
            tags: ['javascript', 'typescript'],
            filter: ['active', 'featured'],
          },
        }),
      ).resolves.toStrictEqual({
        ok: true,
        status: 200,
        error: null,
        data: { results: ['item1', 'item2'] },
      });
    });

    it.concurrent('should send a multipart/form-data request with binary data', async () => {
      const fetch = fetchMock.createInstance();
      const client = createClient({ fetch: fetch.fetchHandler });

      const meta: OperationClientMeta = {
        path: '/upload',
        method: 'POST',
        requestContentType: 'multipart/form-data',
      };

      // Create a binary blob
      const binaryData = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]); // PNG header
      const blob = new Blob([binaryData], { type: 'image/png' });

      fetch.post(
        req => {
          return (
            req.url === 'https://api.datanaut.ai/upload' &&
            // FormData is not easily inspectable in fetch-mock, so we just check the URL
            req.options.body instanceof FormData
          );
        },
        {
          status: 200,
          body: { success: true, fileSize: 123 },
          headers: { 'content-type': 'application/json' },
        },
      );

      const requestBody = {
        file: blob,
        description: 'Test image upload',
      };

      await expect(client.request(meta, { body: requestBody })).resolves.toStrictEqual({
        ok: true,
        status: 200,
        error: null,
        data: {
          success: true,
          fileSize: 123,
        },
      });
    });

    it.concurrent('should receive binary data in response', async () => {
      const fetch = fetchMock.createInstance();
      const client = createClient({ fetch: fetch.fetchHandler });

      const meta: OperationClientMeta = {
        path: '/download',
        method: 'GET',
      };

      // Create binary data for the response
      const binaryData = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]); // PNG header
      const buffer = binaryData.buffer;

      fetch.get('https://api.datanaut.ai/download', {
        status: 200,
        body: buffer,
        headers: { 'content-type': 'application/octet-stream' },
      });

      const response = await client.request(meta, {});
      expect(response).toStrictEqual({
        ok: true,
        status: 200,
        error: null,
        data: expect.any(ArrayBuffer),
      });
      expect(new Uint8Array(response.data as ArrayBuffer)).toStrictEqual(binaryData);
    });

    it.concurrent('should send a plain text request body', async () => {
      const fetch = fetchMock.createInstance();
      const client = createClient({ fetch: fetch.fetchHandler });

      const meta: OperationClientMeta = {
        path: '/text',
        method: 'POST',
        requestContentType: 'text/plain',
      };

      fetch.post('https://api.datanaut.ai/text', {
        status: 200,
        body: { success: true, length: 13 },
        headers: { 'content-type': 'application/json' },
      });

      await expect(client.request(meta, { body: 'Hello, world!' })).resolves.toStrictEqual({
        ok: true,
        status: 200,
        error: null,
        data: {
          success: true,
          length: 13,
        },
      });
    });

    it.concurrent.each([
      {
        name: 'XML response',
        path: '/xml',
        contentType: 'application/xml',
        body: '<root><item>value</item></root>',
        isBinary: true,
      },
      {
        name: 'HTML response',
        path: '/html',
        contentType: 'text/html',
        body: '<html lang="pl"><body>Hello</body></html>',
        isBinary: false,
      },
      {
        name: 'CSV response',
        path: '/csv',
        contentType: 'text/csv',
        body: 'id,name\n1,John\n2,Jane',
        isBinary: false,
      },
    ])('should handle $name ($contentType)', async ({ path, contentType, body, isBinary }) => {
      const fetch = fetchMock.createInstance();
      const client = createClient({ fetch: fetch.fetchHandler });

      const meta: OperationClientMeta = {
        path,
        method: 'GET',
      };

      fetch.get(`https://api.datanaut.ai${path}`, {
        status: 200,
        body,
        headers: { 'content-type': contentType },
      });

      const response = await client.request(meta, {});

      expect(response).toStrictEqual({
        ok: true,
        status: 200,
        error: null,
        data: expect.anything(),
      });

      if (isBinary) {
        expect(response.data).toBeInstanceOf(ArrayBuffer);
        const responseString = new TextDecoder().decode(response.data as ArrayBuffer);
        expect(responseString).toBe(body);
      } else {
        expect(response.data).toBe(body);
      }
    });

    it.concurrent('should use a signal with defaultRequestTimeout', async () => {
      const fetch = fetchMock.createInstance();
      using controller = createDisposableAbortController();
      const client = createClient({
        fetch: fetch.fetchHandler,
        defaultRequestTimeout: 20,
      });

      const meta: OperationClientMeta = {
        path: '/delayed',
        method: 'GET',
      };

      fetch.get('https://api.datanaut.ai/delayed', async () => {
        await timers.setTimeout(1000, null, { signal: controller.signal });
        return {
          status: 200,
        };
      });

      const response = await client.request(meta, {});
      expect(response).toStrictEqual({
        ok: false,
        status: null,
        error: 'aborted or timed out',
        data: null,
      });
    });

    it.concurrent('should not use a signal if defaultRequestTimeout is lower than or equal to 0', async () => {
      const fetch = fetchMock.createInstance();
      using controller = createDisposableAbortController();
      const client = createClient({
        fetch: fetch.fetchHandler,
        defaultRequestTimeout: 0,
      });

      const meta: OperationClientMeta = {
        path: '/delayed',
        method: 'GET',
      };

      fetch.get('https://api.datanaut.ai/delayed', async () => {
        await timers.setTimeout(50, null, { signal: controller.signal });
        return {
          status: 200,
          body: 'delayed response',
          headers: {
            'content-type': 'text/plain',
          },
        };
      });

      await expect(client.request(meta, {})).resolves.toStrictEqual({
        ok: true,
        status: 200,
        error: null,
        data: 'delayed response',
      });
    });

    it.concurrent('should use the provided signal instead of default timeout', async () => {
      const fetch = fetchMock.createInstance();
      using controller = createDisposableAbortController();
      const client = createClient({
        fetch: fetch.fetchHandler,
        defaultRequestTimeout: 10,
      });

      const meta: OperationClientMeta = {
        path: '/delayed',
        method: 'GET',
      };

      fetch.get('https://api.datanaut.ai/delayed', async () => {
        await timers.setTimeout(50, null, { signal: controller.signal });
        return {
          status: 200,
          body: 'delayed response',
          headers: {
            'content-type': 'text/plain',
          },
        };
      });

      // The request should complete successfully because we're using a custom signal
      // that won't be aborted
      await expect(client.request(meta, { signal: new AbortController().signal })).resolves.toStrictEqual({
        ok: true,
        status: 200,
        error: null,
        data: 'delayed response',
      });
    });

    it.concurrent('should abort the request when the signal is aborted', async () => {
      const fetch = fetchMock.createInstance();
      using timeoutController = createDisposableAbortController();
      const fetchController = new AbortController();
      const client = createClient({
        fetch: fetch.fetchHandler,
      });

      const meta: OperationClientMeta = {
        path: '/delayed',
        method: 'GET',
      };

      fetch.get('https://api.datanaut.ai/delayed', async () => {
        await timers.setTimeout(50, null, { signal: timeoutController.signal });
        return {
          status: 200,
          body: 'delayed response',
          headers: {
            'content-type': 'text/plain',
          },
        };
      });

      const requestPromise = client.request(meta, { signal: fetchController.signal });
      setImmediate(() => {
        fetchController.abort();
      });

      const response = await requestPromise;
      expect(response).toStrictEqual({
        ok: false,
        status: null,
        error: 'aborted or timed out',
        data: null,
      });
    });
  });

  function createClient({
    baseURL: url = baseURL,
    fetch,
    defaultRequestTimeout,
  }: {
    baseURL?: URL;
    fetch?: typeof globalThis.fetch;
    defaultRequestTimeout?: number;
  }) {
    return new Client(url, { fetch, defaultRequestTimeout });
  }

  function createDisposableAbortController() {
    const controller = new AbortController();
    const abort = controller.abort.bind(controller);
    return {
      signal: controller.signal,
      abort,
      [Symbol.dispose]: abort,
    };
  }
});
