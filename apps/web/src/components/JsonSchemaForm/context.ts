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
  schema,
  defaultValues: passedDefaultValues,
  values: passedValues,
}: {
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
          values[key] = passedDefaultValues?.[key] ?? prop.default;
        } else {
          values[key] =
            passedDefaultValues?.[key] ?? (prop.type === 'string' ? '' : prop.type === 'number' ? 0 : false);
        }
      });
    }

    return values;
  }, [schema, passedDefaultValues]);

  const values = useMemo(() => {
    return Object.assign({}, defaultValues, passedValues);
  }, [defaultValues, passedValues]);

  const form = useFormStore<Record<string, string | number | boolean>>({ defaultValues: values });

  useEffect(() => {
    // If values change externally, update the form state. Not the best approach because non-committed edits
    // will be overwritten, but OK for now.
    form.setValues(values);
  }, [form, values]);

  return { form };
};
