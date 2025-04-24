/**
 * Represents a single operation chunk from an OpenAPI specification
 */
export interface OperationChunk {
  /** The path of the operation (e.g., /users) */
  path: string;
  /** The HTTP method of the operation (e.g., GET, POST) */
  method: string;
  /** The operation object from the OpenAPI specification */
  operation: {
    /** The operation ID */
    operationId?: unknown;
    /** The original description of the operation */
    description?: unknown;
    /** The summary of the operation */
    summary?: unknown;
    /** The parameters of the operation */
    parameters?: unknown[];
    /** The request body of the operation */
    requestBody?: unknown;
    /** The responses of the operation */
    responses?: Record<string, unknown>;
  };
}

export interface Metadata {
  title: string | undefined;
  description?: string;
  contact:
    | {
        name: string | undefined;
        url: string | undefined;
        email: string | undefined;
      }
    | undefined;
  version: string | undefined;
  serverUrls: string[];
}
