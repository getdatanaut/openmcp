import { bundleOas3Service } from '@stoplight/http-spec';

import weatherGov from './openapi-examples/weather-gov.json';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export const createServer = () => {
	// @ts-expect-error ignore
	const service = bundleOas3Service({ document: weatherGov });

	const server = new McpServer({
		name: service.name,
		version: service.version,
	});

	for (const operation of service.operations) {
		server.tool(
			operation.iid || `${operation.method} ${operation.path}`,
			operation.description || '',
			{}, // @TODO: add parameters
			async (params) => {
				console.log('operation', operation.method, operation.path, params);
				const res = await fetch(operation.path, {
					method: operation.method,
				});

				const data = await res.json();

				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(data, null, 2),
						},
					],
				};
			},
		);
	}

	return server;
};
