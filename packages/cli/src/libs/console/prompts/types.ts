export type TextPrompt = {
  type: 'text';
  config: {
    message: string;
    placeholder?: string;
    mask?: string;
    help?: string;
    defaultValue?: string;
    validate?(value: string): string | void;
  };
};

export type ConfirmPrompt = {
  type: 'confirm';
  config: {
    message: string;
    defaultValue?: boolean;
  };
};

export type SelectPromptOption = {
  label: string;
  hint?: string;
  value: string;
};

export type SelectPrompt = {
  type: 'select';
  config: {
    message: string;
    initialValue?: string;
    options: SelectPromptOption[];
  };
};

export type MultiSelectPrompt = {
  type: 'multi-select';
  config: {
    message: string;
    initialValues?: string[];
    options: SelectPromptOption[];
    optional?: boolean;
  };
};

export type Prompt = TextPrompt | ConfirmPrompt | SelectPrompt | MultiSelectPrompt;
