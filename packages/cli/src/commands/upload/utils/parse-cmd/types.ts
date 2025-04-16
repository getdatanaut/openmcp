export type ResultArg =
  | {
      type: 'positional';
      raw: string; // value passed to initialize the server
      value: string; // value used in the config
    }
  | {
      type: 'flag';
      name: string;
      raw: string; // value passed to initialize the server
      value: string; // value used in the config
    };

export type Result = {
  externalId: string;
  command: string;
  args: ResultArg[];
  env: Record<string, string>;
  vars: Set<string>;
};
