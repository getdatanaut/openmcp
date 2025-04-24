/**
 * TypeScript interfaces for the OpenAPI enhancer
 */

/**
 * Represents a suggested improvement for an operation description
 */
export interface SuggestedImprovement {
  /** The operation ID */
  operationId?: string;
  /** The path of the operation */
  path: string;
  /** The HTTP method of the operation */
  method: string;
  /** The original description of the operation */
  originalDescription?: string;
  /** The suggested improved description */
  suggestedDescription: string;
  /** The suggested tool name for the operation */
  toolName?: string;
  /** A short summary of the operation */
  summary?: string;
  /** Examples for Schema, Header, and Parameter objects */
  examples?: {
    schema?: Record<string, any>;
    header?: Record<string, any>;
    parameter?: Record<string, any>;
  };
  /** The importance/relevance score of the operation (1-10, 10 being most important) */
  importanceScore?: number;
}

/**
 * Represents service-level information
 */
export interface ServiceInfo {
  /** The title of the API service */
  title?: string;
  /** The description of the API service */
  description?: string;
  /** A short summary of the API service */
  summary?: string;
  /** The business fields or markets the API serves */
  fields?: string[];
  /** The company name */
  company?: string;
}

/**
 * Represents the state of the analysis process
 */
export interface AnalysisState {
  /** The list of suggested improvements */
  improvements: SuggestedImprovement[];
  /** Service-level information */
  serviceInfo?: ServiceInfo;
  /** Endpoints sorted by importance/relevance */
  rankedEndpoints?: {
    path: string;
    method: string;
    operationId?: string;
    score: number;
  }[];
}
