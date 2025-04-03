import { type LanguageModelUsage } from 'ai';

import type { ServerId } from '../types.ts';

export type MpcConductorUsageAnnotation = {
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

export type MpcConductorReasoningAnnotation =
  | MpcConductorReasoningStartAnnotation
  | MpcConductorReasoningFinishAnnotation;

export type MpcConductorReasoningStartAnnotation = {
  type: 'reasoning-start';
  stepIndex: number;
  name: string;
  serverId?: ServerId;
};

export type MpcConductorReasoningFinishAnnotation = {
  type: 'reasoning-finish';
  stepIndex: number;
  duration: number;
  serverId?: ServerId;
};

export type MpcConductorAnnotation = MpcConductorUsageAnnotation | MpcConductorReasoningAnnotation;

export const isUsageAnnotation = (annotation: unknown): annotation is MpcConductorUsageAnnotation => {
  return (
    typeof annotation === 'object' &&
    annotation !== null &&
    'type' in annotation &&
    typeof annotation.type === 'string' &&
    ['planning-usage', 'assistant-usage', 'tool-usage'].includes(annotation.type)
  );
};

export const isReasoningAnnotation = (annotation: unknown): annotation is MpcConductorReasoningAnnotation => {
  return (
    typeof annotation === 'object' &&
    annotation !== null &&
    'type' in annotation &&
    typeof annotation.type === 'string' &&
    ['reasoning-start', 'reasoning-finish'].includes(annotation.type)
  );
};
