export type InferredType = 'string' | 'number' | 'boolean';

export type SerializableConfigSchema = {
  type: 'object';
  properties: Record<
    string,
    {
      type: InferredType;
    }
  >;
  required: string[];
};

export default class ConfigSchema {
  readonly #type = 'object';
  readonly #properties: Record<string, { type: InferredType }> = {};
  #size = 0;

  public add(name: string, type: InferredType): string {
    if (!Object.hasOwn(this.#properties, name)) {
      this.#size++;
      this.#properties[name] = { type };
    }

    return name;
  }

  public get size() {
    return this.#size;
  }

  public inferType(value: string): InferredType {
    if (value === 'true' || value === 'false') {
      return 'boolean';
    }

    if (value === '0' || value === '1') {
      return 'boolean';
    }

    if (!Number.isNaN(Number.parseInt(value))) {
      return 'number';
    }

    return 'string';
  }

  public serialize(): SerializableConfigSchema | undefined {
    if (this.#size === 0) {
      return;
    }

    return {
      type: this.#type,
      properties: this.#properties,
      required: Object.keys(this.#properties),
    };
  }
}
