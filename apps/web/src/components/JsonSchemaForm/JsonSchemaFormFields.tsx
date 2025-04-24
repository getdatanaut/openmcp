import { FormField, FormInput } from '@libs/ui-primitives';

import { useJsonSchemaFormInternalContext } from './context.ts';

export const JsonSchemaFormFields = () => {
  const { schema, form } = useJsonSchemaFormInternalContext();

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
