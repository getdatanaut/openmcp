import { observer } from 'mobx-react-lite';
import React from 'react';

import { state } from '#libs/console/prompts';

import { ConfirmInput, MultiSelectInput, SelectInput, TextInput } from './input/index.ts';

const Prompt = observer(() => {
  const currentPrompt = state.currentPrompt.get();
  switch (currentPrompt?.type) {
    case 'text':
      return (
        <TextInput
          label={currentPrompt.config.message}
          defaultValue={currentPrompt.config.defaultValue}
          mask={currentPrompt.config.mask}
          hint={currentPrompt.config.help}
          placeholder={currentPrompt.config.placeholder}
          validate={currentPrompt.config.validate}
          onSubmit={currentPrompt.resolve}
        />
      );
    case 'confirm':
      return (
        <ConfirmInput
          label={currentPrompt.config.message}
          defaultValue={currentPrompt.config.defaultValue}
          onSubmit={currentPrompt.resolve}
        />
      );
    case 'select':
      return (
        <SelectInput
          label={currentPrompt.config.message}
          defaultValue={currentPrompt.config.initialValue}
          options={currentPrompt.config.options}
          onSubmit={currentPrompt.resolve}
        />
      );
    case 'multi-select':
      return (
        <MultiSelectInput
          label={currentPrompt.config.message}
          defaultValues={currentPrompt.config.initialValues}
          options={currentPrompt.config.options}
          onSubmit={currentPrompt.resolve}
        />
      );
    case undefined:
      return null;
  }
});

export default Prompt;
