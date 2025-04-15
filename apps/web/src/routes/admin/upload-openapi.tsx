import { Form, FormButton, FormField, FormInput, Heading, useFormStore } from '@libs/ui-primitives';
import { isDefinedError } from '@orpc/client';
import { useMutation } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

import { rpc } from '~/libs/rpc.ts';

export const Route = createFileRoute('/admin/upload-openapi')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex flex-col gap-4 p-10">
      <Heading size={5}>Upload OpenAPI</Heading>

      <div className="max-w-[40rem]">
        <UploadOpenApiForm />
      </div>
    </div>
  );
}

function UploadOpenApiForm() {
  const [error, setError] = useState<string | null>(null);
  const form = useFormStore({ defaultValues: { openapi: '', serverUrl: '' } });
  const $ = form.names;

  const uploadFromOpenApi = useMutation(rpc.mcpServers.uploadFromOpenApi.mutationOptions());

  form.useSubmit(async state => {
    console.log('uploading from openapi');
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
            console.log('uploaded from openapi', data);
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
                for (const issue of error.data?.issues ?? []) {
                  form.setError(issue.path[0]!, issue.message);
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
