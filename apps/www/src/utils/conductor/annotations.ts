import type { ServerId } from '@openmcp/manager';
import { type LanguageModelUsage } from 'ai';

export type McpConductorUsageAnnotation = {
  type: 'planning-usage' | 'assistant-usage' | 'tool-usage';
  usage: LanguageModelUsage;
  stepIndex: number;
  provider: string;
  modelId: string;
  toolCallId?: string;
} & (
  | {
      type: 'planning-usage' | 'assistant-usage';
    }
  | {
      type: 'tool-usage';
      toolCallId: string;
    }
);

export type McpConductorReasoningAnnotation =
  | McpConductorReasoningStartAnnotation
  | McpConductorReasoningFinishAnnotation;

export type McpConductorReasoningStartAnnotation = {
  type: 'reasoning-start';
  stepIndex: number;
  name: string;
  serverId?: ServerId;
};

export type McpConductorReasoningFinishAnnotation = {
  type: 'reasoning-finish';
  stepIndex: number;
  duration: number;
  serverId?: ServerId;
};

export type McpConductorAnnotation = McpConductorUsageAnnotation | McpConductorReasoningAnnotation;

export const isUsageAnnotation = (annotation: unknown): annotation is McpConductorUsageAnnotation => {
  return (
    typeof annotation === 'object' &&
    annotation !== null &&
    'type' in annotation &&
    typeof annotation.type === 'string' &&
    ['planning-usage', 'assistant-usage', 'tool-usage'].includes(annotation.type)
  );
};

export const isReasoningAnnotation = (annotation: unknown): annotation is McpConductorReasoningAnnotation => {
  return (
    typeof annotation === 'object' &&
    annotation !== null &&
    'type' in annotation &&
    typeof annotation.type === 'string' &&
    ['reasoning-start', 'reasoning-finish'].includes(annotation.type)
  );
};
