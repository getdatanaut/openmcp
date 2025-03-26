import { createContext, Form, FormField, FormInput, type FormStore, useFormStore } from '@libs/ui-primitives';
import type { ServerStorageData } from '@openmcp/manager';
import { type ReactNode, useMemo } from 'react';

export const [JsonSchemaFormContext, useJsonSchemaFormContext] = createContext<{
  form: FormStore<Record<string, string | number | boolean>>;
  schema: ServerStorageData['configSchema'];
}>({
  name: 'JsonSchemaFormContext',
  strict: true,
});

export interface JsonSchemaFormProps {
  schema: ServerStorageData['configSchema'];
  form: FormStore<Record<string, string | number | boolean>>;
  className?: string;
  children: ReactNode;
}

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

export const JsonSchemaForm = ({ schema, form, className, children }: JsonSchemaFormProps) => {
  return (
    <JsonSchemaFormContext.Provider value={{ form, schema }}>
      <Form store={form} className={className}>
        {children}
      </Form>
    </JsonSchemaFormContext.Provider>
  );
};

export const JsonSchemaFormFields = () => {
  const { schema, form } = useJsonSchemaFormContext();

  const $ = form.names;

  return Object.entries(schema?.properties || {}).map(([key, prop], index) => (
    <FormField key={key} name={$[key]!} label={prop.title || key} hint={prop.description}>
      <FormInput
        name={$[key]!}
        required={schema?.required?.includes(key)}
        placeholder={prop.example !== undefined ? String(prop.example) : undefined}
        type={prop.format === 'secret' ? 'password' : 'text'}
        defaultValue={prop.default !== undefined ? String(prop.default) : undefined}
        autoComplete={prop.format === 'secret' ? 'off' : undefined}
        autoFocus={index === 0}
      />
    </FormField>
  ));
};
