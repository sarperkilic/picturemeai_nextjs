export type ProjectStatus = "draft" | "ready" | "rendering" | "complete" | "failed";
export type RenderKind = "tts" | "avatar" | "final";
export type RenderStatus = "queued" | "running" | "succeeded" | "failed";

export interface CreateProjectData {
  title: string;
  flow: {
    script: string;
    voiceId: string;
    avatarId: string;
  };
  duration?: number;
}

export interface UpdateProjectData {
  title?: string;
  status?: ProjectStatus;
  duration?: number;
  flow?: {
    script?: string;
    voiceId?: string;
    avatarId?: string;
  };
  usedCredits?: number;
}

export interface CreateRenderData {
  kind: RenderKind;
  model: string;
  providerJobId: string;
  input: Record<string, any>;
}

export interface UpdateRenderData {
  status?: RenderStatus;
  output?: Record<string, any>;
  error?: string;
  providerJobId?: string;
} 