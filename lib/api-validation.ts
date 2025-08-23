import { NextRequest } from 'next/server';
import { ProjectStatus, RenderKind, RenderStatus } from '@/types/projects';

export function validateProjectStatus(status: string): status is ProjectStatus {
  const validStatuses: ProjectStatus[] = ['draft', 'ready', 'rendering', 'complete', 'failed'];
  return validStatuses.includes(status as ProjectStatus);
}

export function validateRenderKind(kind: string): kind is RenderKind {
  const validKinds: RenderKind[] = ['tts', 'avatar', 'final'];
  return validKinds.includes(kind as RenderKind);
}

export function validateRenderStatus(status: string): status is RenderStatus {
  const validStatuses: RenderStatus[] = ['queued', 'running', 'succeeded', 'failed'];
  return validStatuses.includes(status as RenderStatus);
}

export function validateCreateProjectData(data: any): data is {
  title: string;
  flow: {
    script: string;
    voiceId: string;
    avatarId: string;
  };
  duration?: number;
} {
  return (
    typeof data.title === 'string' &&
    data.title.trim().length > 0 &&
    typeof data.flow === 'object' &&
    typeof data.flow.script === 'string' &&
    data.flow.script.trim().length > 0 &&
    typeof data.flow.voiceId === 'string' &&
    data.flow.voiceId.trim().length > 0 &&
    typeof data.flow.avatarId === 'string' &&
    data.flow.avatarId.trim().length > 0 &&
    (data.duration === undefined || typeof data.duration === 'number')
  );
}

export function validateCreateRenderData(data: any): data is {
  kind: RenderKind;
  model: string;
  providerJobId: string;
  input: Record<string, any>;
} {
  return (
    validateRenderKind(data.kind) &&
    typeof data.model === 'string' &&
    data.model.trim().length > 0 &&
    typeof data.providerJobId === 'string' &&
    data.providerJobId.trim().length > 0 &&
    typeof data.input === 'object' &&
    data.input !== null
  );
} 