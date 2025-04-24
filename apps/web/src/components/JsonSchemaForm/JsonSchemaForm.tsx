import { Form, type FormStore } from '@libs/ui-primitives';
import { type ReactNode } from 'react';

import type { McpServer } from '~shared/zero-schema.ts';

import { JsonSchemaFormInternalContext } from './context.ts';

export interface JsonSchemaFormProps {
  schema: McpServer['configSchemaJson'];
  form: FormStore<Record<string, string | number | boolean>>;
  className?: string;
  children: ReactNode;
}

export const JsonSchemaForm = ({ schema, form, className, children }: JsonSchemaFormProps) => {
  return (
    <JsonSchemaFormInternalContext.Provider value={{ form, schema }}>
      <Form store={form} resetOnSubmit={false} className={className}>
        {children}
      </Form>
    </JsonSchemaFormInternalContext.Provider>
  );
};
