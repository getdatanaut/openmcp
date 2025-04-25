import { Form, FormButton, FormField, FormInput, Heading, useFormStore } from '@libs/ui-primitives';
import { isDefinedError } from '@orpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

import { CanvasLayout } from '~/components/CanvasLayout.tsx';
import { rpc } from '~/libs/rpc.ts';

export const Route = createFileRoute('/admin/upload-openapi')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <CanvasLayout>
      <div className="flex flex-col gap-4 p-10">
        <Heading size={5}>Upload OpenAPI</Heading>

        <div className="max-w-[40rem]">
          <UploadOpenApiForm />
        </div>

        <div className="my-10 border-t" />

        <Heading size={5}>Seed Servers</Heading>

        <div className="max-w-[40rem]">
          <UploadRawDefinitionsForm />
        </div>
      </div>
    </CanvasLayout>
  );
}

function UploadOpenApiForm() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const form = useFormStore({ defaultValues: { openapi: '', serverUrl: '' } });
  const $ = form.names;

  const uploadFromOpenApi = useMutation(
    rpc.mcpServers.uploadFromOpenApi.mutationOptions({
      onSuccess() {
        void queryClient.invalidateQueries({ queryKey: rpc.mcpServers.key() });
      },
    }),
  );

  form.useSubmit(async state => {
    setError(null);

    return new Promise((resolve, reject) => {
      uploadFromOpenApi.mutate(
        {
          openapi: state.values.openapi,
          serverUrl: state.values.serverUrl || undefined,
        },
        {
          onSettled() {},
          onSuccess(data) {
            resolve();
          },
          onError(error) {
            if (!isDefinedError(error)) {
              setError('An unknown error occurred');
              reject(error);
              return;
            }

            switch (error.code) {
              case 'UNAUTHORIZED':
                setError('You are not authorized to upload an OpenAPI specification');
                break;
              case 'BAD_REQUEST':
                setError(error.message);
                break;
              case 'INPUT_VALIDATION_FAILED':
                setError(error.data.formErrors[0] ?? error.message);
                for (const [key, values] of Object.entries(error.data.fieldErrors)) {
                  form.setError(key, values.join('. '));
                }
                break;
            }

            reject(error);
          },
        },
      );
    });
  });

  return (
    <Form store={form}>
      <FormField
        name={$.serverUrl}
        label="Server URL"
        hint="The URL of the server. If not provided, the first server URL in the OpenAPI specification will be used."
      >
        <FormInput name={$.serverUrl} placeholder="https://api.example.com" autoComplete="off" />
      </FormField>

      <FormField name={$.openapi} label="OpenAPI URL" hint="Url to the OpenAPI specification">
        <FormInput name={$.openapi} required />
      </FormField>

      {/* <FormField name={$.openapi} label="OpenAPI" hint="The OpenAPI specification for the server">
        <FormInput
          name={$.openapi}
          required
          render={({ ...props }) => (
            <textarea
              {...props}
              className="ak-edge h-full resize-none rounded-xs border p-4 focus:outline-none"
              placeholder="Paste your OpenAPI specification here"
              rows={10}
            />
          )}
        />
      </FormField> */}

      {error && <div className="ak-text-danger text-sm">{error}</div>}

      <div className="flex gap-2">
        <FormButton validProps={{ intent: 'primary' }} type="submit">
          Upload
        </FormButton>
      </div>
    </Form>
  );
}

function UploadRawDefinitionsForm() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const form = useFormStore({ defaultValues: { definitions: JSON.stringify(servers, null, 2) } });
  const $ = form.names;

  const uploadFromOpenApi = useMutation(rpc.mcpServers.uploadFromOpenApi.mutationOptions());

  form.useSubmit(async state => {
    setError(null);

    const definitions = JSON.parse(state.values.definitions) as typeof servers;
    for (const definition of definitions) {
      setStatus(`Uploading ${definition.name}...`);

      await new Promise<void>((resolve, reject) => {
        uploadFromOpenApi.mutate(
          {
            name: definition.name || undefined,
            openapi: definition.transport.serverConfig.openapi,
            serverUrl: definition.transport.serverConfig.serverUrl || undefined,
            iconUrl: definition.icon || undefined,
            developer: definition.developer || undefined,
            sourceUrl: definition.sourceUrl || undefined,
            configSchema: definition.configSchema || undefined,
            visibility: 'public',
          },
          {
            onSettled() {},
            onSuccess() {
              resolve();
            },
            onError(error) {
              if (!isDefinedError(error)) {
                setError(`An unknown error occurred while uploading ${definition.name}`);
                reject(error);
                return;
              }

              switch (error.code) {
                case 'UNAUTHORIZED':
                  setError('You are not authorized to upload an OpenAPI specification');
                  break;
                case 'BAD_REQUEST':
                  setError(error.message);
                  break;
                case 'INPUT_VALIDATION_FAILED':
                  setError(error.data.formErrors[0] ?? error.message);
                  for (const [key, values] of Object.entries(error.data.fieldErrors)) {
                    form.setError(key, values.join('. '));
                  }
                  break;
              }

              reject(error);
            },
          },
        );
      });

      void queryClient.invalidateQueries({ queryKey: rpc.mcpServers.key() });
    }

    setStatus('');
  });

  return (
    <Form store={form}>
      <FormField name={$.definitions} label="Configs">
        <FormInput
          name={$.definitions}
          required
          render={({ ...props }) => (
            <textarea
              {...props}
              className="ak-edge h-full resize-none rounded-xs border p-4 focus:outline-none"
              placeholder="Paste your OpenAPI specification here"
              rows={10}
            />
          )}
        />
      </FormField>

      {error && <div className="ak-text-danger text-sm">{error}</div>}

      <div className="flex items-center gap-2">
        <FormButton validProps={{ intent: 'primary' }} type="submit">
          Upload All
        </FormButton>
        <div>{status}</div>
      </div>
    </Form>
  );
}

const servers = [
  {
    name: 'Cal.com',
    developer: 'Datanaut',
    icon: 'https://www.cal.com/favicon.ico',
    sourceUrl: 'https://github.com/getdatanaut/openmcp/tree/main/packages/directory/src/mcp/calcom',
    transport: {
      type: 'openapi',
      serverConfig: {
        openapi: 'https://raw.githubusercontent.com/calcom/cal.com/refs/heads/main/docs/api-reference/v2/openapi.json',
        serverUrl: 'https://api.cal.com',
      },
      clientConfig: {
        headers: { Authorization: 'Bearer {{apiKey}}' },
      },
    },
    get configSchema() {
      return {
        type: 'object',
        properties: {
          apiKey: {
            type: 'string',
            description:
              'API key for your Cal.com account. https://cal.com/docs/api-reference/v2/introduction#1-api-key',
            format: 'secret',
            title: 'API Key',
          },
        },
        required: ['apiKey'],
      };
    },
  } as const,
  {
    name: 'Firecrawl',
    developer: 'Datanaut',
    icon: 'https://www.firecrawl.dev/favicon.ico',
    sourceUrl: 'https://github.com/getdatanaut/openmcp/tree/main/packages/directory/src/mcp/firecrawl',
    transport: {
      type: 'openapi',
      serverConfig: {
        openapi: 'https://raw.githubusercontent.com/mendableai/firecrawl/refs/heads/main/apps/api/v1-openapi.json',
        serverUrl: 'https://api.firecrawl.dev/v1',
      },
      clientConfig: {
        headers: { Authorization: 'Bearer {{apiKey}}' },
      },
    },
    get configSchema() {
      return {
        type: 'object',
        properties: {
          apiKey: {
            type: 'string',
            description:
              'API key for your Firecrawl account. https://docs.firecrawl.dev/api-reference/introduction#authentication',
            format: 'secret',
            title: 'API Key',
          },
        },
        required: ['apiKey'],
      };
    },
  } as const,
  {
    name: 'Google Calendar',
    developer: 'Datanaut',
    sourceUrl: 'https://github.com/getdatanaut/openmcp/tree/main/packages/directory/src/mcp/gcal',
    icon: 'https://calendar.google.com/googlecalendar/images/favicons_2020q4/calendar_31_256.ico',
    transport: {
      type: 'openapi',
      serverConfig: {
        openapi: 'https://api.apis.guru/v2/specs/googleapis.com/calendar/v3/openapi.json',
        serverUrl: 'https://www.googleapis.com/calendar/v3',
      },
      clientConfig: {
        headers: { Authorization: 'Bearer {{token}}' },
      },
    },
    get configSchema() {
      return {
        type: 'object',
        properties: {
          token: {
            type: 'string',
            format: 'secret',
            title: 'Access Token',
            description: 'Access token for the Google API',
          },
          calendarId: {
            type: 'string',
            title: 'Calendar ID',
            description:
              'Open google calendar, and find your calendar on the left in the "My Calendars" section. Hover over, press the triple dot menu, and select "Settings and sharing". Scroll to the bottom and you will see the calendar ID, right under "Integrate calendar".',
          },
        },
        required: ['token', 'calendarId'],
      };
    },
  } as const,
  {
    name: 'Gmail',
    developer: 'Datanaut',
    icon: 'https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico',
    sourceUrl: 'https://github.com/getdatanaut/openmcp/tree/main/packages/directory/src/mcp/gmail',
    transport: {
      type: 'openapi',
      serverConfig: {
        openapi:
          'https://gist.githubusercontent.com/marbemac/fd4c88cb50fc6e2197fdc331f431631a/raw/cce1c424fbf5feff33249e9b5069261ddc847aa7/gmail.openapi.json',
        serverUrl: 'https://gmail.googleapis.com',
      },
      clientConfig: {
        headers: { Authorization: 'Bearer {{apiKey}}' },
      },
    },
    get configSchema() {
      return {
        type: 'object',
        properties: {
          apiKey: {
            type: 'string',
            description: 'Google Cloud API Key. https://developers.google.com/workspace/guides/create-credentials',
            format: 'secret',
            title: 'Google Cloud API Key',
          },
        },
        required: ['apiKey'],
      };
    },
  } as const,
  {
    name: 'Petstore',
    developer: 'Datanaut',
    sourceUrl: 'https://github.com/getdatanaut/openmcp/tree/main/packages/directory/src/mcp/petstore',
    icon: 'https://www.petco.com/favicon.ico',
    transport: {
      type: 'openapi',
      serverConfig: {
        openapi: 'https://petstore3.swagger.io/api/v3/openapi.json',
        serverUrl: 'https://petstore3.swagger.io/api/v3',
      },
    },
    get configSchema() {
      return {
        type: 'object',
        properties: {
          apiKey: {
            type: 'string',
            title: 'API Key',
            description: 'The API key for the MCP Server',
            format: 'secret',
          },
        },
        required: ['apiKey'],
      };
    },
  } as const,
  {
    name: 'Pokemon',
    developer: 'Datanaut',
    sourceUrl: 'https://github.com/getdatanaut/openmcp/tree/main/packages/directory/src/mcp/pokemon',
    icon: 'https://www.pokemon.com/favicon.ico',
    transport: {
      type: 'openapi',
      serverConfig: {
        openapi: 'https://raw.githubusercontent.com/PokeAPI/pokeapi/refs/heads/master/openapi.yml',
        serverUrl: 'https://pokeapi.co',
      },
    },
    get configSchema() {
      return {};
    },
  } as const,
  {
    name: 'Resend',
    developer: 'Datanaut',
    sourceUrl: 'https://github.com/getdatanaut/openmcp/tree/main/packages/directory/src/mcp/resend',
    icon: 'https://www.resend.com/static/favicons/favicon.ico',
    transport: {
      type: 'openapi',
      serverConfig: {
        openapi: 'https://raw.githubusercontent.com/resend/resend-openapi/refs/heads/main/resend.yaml',
        serverUrl: 'https://api.resend.com',
      },
      clientConfig: {
        headers: { Authorization: 'Bearer {{apiKey}}' },
      },
    },
    get configSchema() {
      return {
        type: 'object',
        properties: {
          apiKey: {
            type: 'string',
            description:
              'API key for the Resend API. https://resend.com/docs/dashboard/api-keys/introduction#add-api-key',
            format: 'secret',
            title: 'API Key',
            example: 're_123456789',
          },
        },
        required: ['apiKey'],
      };
    },
  } as const,
  {
    name: 'SerpAPI',
    developer: 'Datanaut',
    icon: 'https://www.serpapi.com/favicon.ico',
    sourceUrl: 'https://github.com/getdatanaut/openmcp/tree/main/packages/directory/src/mcp/serpapi',
    transport: {
      type: 'openapi',
      serverConfig: {
        openapi:
          'https://gist.githubusercontent.com/marbemac/726eb53c24b94e43e2f5379c2ed0a7a7/raw/bc87c7f36a46e74bb9cfb8267b60f949d98f344a/serp.openapi.json',
        serverUrl: 'https://serpapi.com',
      },
      clientConfig: {
        query: { api_key: '{{apiKey}}' },
      },
    },
    get configSchema() {
      return {
        type: 'object',
        properties: {
          apiKey: {
            type: 'string',
            description: 'API key for your SerpAPI account. https://serpapi.com/dashboard',
            format: 'secret',
            title: 'API Key',
          },
        },
        required: ['apiKey'],
      };
    },
  } as const,
  {
    name: 'Slack',
    developer: 'Datanaut',
    sourceUrl: 'https://github.com/getdatanaut/openmcp/tree/main/packages/directory/src/mcp/slack',
    icon: 'https://www.slack.com/favicon.ico',
    transport: {
      type: 'openapi',
      serverConfig: {
        openapi: 'https://raw.githubusercontent.com/slackapi/slack-api-specs/master/web-api/slack_web_openapi_v2.json',
        serverUrl: 'https://slack.com/api',
      },
      clientConfig: {
        headers: { Authorization: 'Bearer {{token}}' },
      },
    },
    get configSchema() {
      return {
        type: 'object',
        properties: {
          token: {
            type: 'string',
            description: 'OAuth token for the Slack API',
            format: 'secret',
            title: 'OAuth Token',
          },
        },
        required: ['token'],
      };
    },
  } as const,
];
