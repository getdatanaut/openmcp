import type ConfigSchema from '../config-schema.ts';

export type ResultArg =
  | {
      type: 'command';
      value: string;
    }
  | {
      type: 'positional';
      dataType: 'string' | 'number';
      value: string;
      masked: string | null;
    }
  | ResultArgFlag;

export type ResultArgFlag = {
  type: 'flag';
  name: string;
} & (
  | {
      dataType: 'boolean';
      value: true | false;
    }
  | {
      dataType: 'string' | 'number';
      value: string;
      masked: string | null;
    }
);

export type Result = {
  externalId: string;
  command: string;
  args: ResultArg[];
  env: Record<string, string>;
  configSchema: ConfigSchema;
};
