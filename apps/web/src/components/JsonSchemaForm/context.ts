import { createContext, type FormStore, useFormStore } from '@libs/ui-primitives';
import { useEffect, useMemo } from 'react';

import type { McpServer } from '~shared/zero-schema.ts';

export const [JsonSchemaFormInternalContext, useJsonSchemaFormInternalContext] = createContext<{
  form: FormStore<Record<string, string | number | boolean>>;
  schema: McpServer['configSchemaJson'];
}>({
  name: 'JsonSchemaFormInternalContext',
  strict: true,
});

export const useJsonSchemaForm = ({
  id,
  schema,
  defaultValues: initialValues,
  values,
}: {
  // This is used as a unique identifier for the form, and it's state
  id: string;
  schema: McpServer['configSchemaJson'];
  defaultValues?: Record<string, string | number | boolean>;
  values?: Record<string, string | number | boolean>;
}) => {
  const defaultValues = useMemo(() => {
    if (!schema) return {};

    const values: Record<string, string | number | boolean> = {};

    // Initialize default values from schema properties
    if (schema.properties) {
      Object.entries(schema.properties).forEach(([key, prop]) => {
        if (prop.default !== undefined) {
          values[key] = initialValues?.[key] ?? prop.default;
        } else {
          values[key] = initialValues?.[key] ?? (prop.type === 'string' ? '' : prop.type === 'number' ? 0 : false);
        }
      });
    }

    return values;
  }, [schema, initialValues]);

  const form = useFormStore<Record<string, string | number | boolean>>({ defaultValues, values });

  useEffect(() => {
    form.reset();
    form.setValues(values ?? {});
  }, [form, id, values]);

  return { form };
};
