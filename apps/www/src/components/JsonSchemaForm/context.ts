import { createContext, type FormStore, useFormStore } from '@libs/ui-primitives';
import type { ServerStorageData } from '@openmcp/manager';
import { useMemo } from 'react';

export const [JsonSchemaFormInternalContext, useJsonSchemaFormInternalContext] = createContext<{
  form: FormStore<Record<string, string | number | boolean>>;
  schema: ServerStorageData['configSchema'];
}>({
  name: 'JsonSchemaFormInternalContext',
  strict: true,
});

export const useJsonSchemaForm = ({
  schema,
  defaultValues: initialValues,
  values,
}: {
  schema: ServerStorageData['configSchema'];
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

  return { form };
};
