import { Form, type FormStore } from '@libs/ui-primitives';
import type { ServerStorageData } from '@openmcp/manager';
import { type ReactNode } from 'react';

import { JsonSchemaFormInternalContext } from './context.ts';

export interface JsonSchemaFormProps {
  schema: ServerStorageData['configSchema'];
  form: FormStore<Record<string, string | number | boolean>>;
  className?: string;
  children: ReactNode;
}

export const JsonSchemaForm = ({ schema, form, className, children }: JsonSchemaFormProps) => {
  return (
    <JsonSchemaFormInternalContext.Provider value={{ form, schema }}>
      <Form store={form} className={className}>
        {children}
      </Form>
    </JsonSchemaFormInternalContext.Provider>
  );
};
