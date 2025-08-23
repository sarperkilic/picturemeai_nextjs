My current db table is below:

users/{uid}
tier: "free" | "pro" | "team"
credits: number (remaining)
email: string
name: string
createdAt: serverTimestamp
updatedAt: serverTimestamp

I need to add projects and renders 

1) projects/{projectId}
nest this under the user (users/{uid}/projects/*), strict per-user hierarchies and plan to use collection-group queries across all projects later. 

title: string
status: "draft" | "ready" | "rendering" | "complete" | "failed"
duration: number
flow: object
  script: string
  voiceId: string
  avatarId: string
usedCredits: number (total consumed)
createdAt / updatedAt: timestamps

2) users/{uid}/projects/{projectId}/renders/{renderId} (subcollection)

Each third-party job (TTS, talking-head) is a render.

kind: "tts" | "avatar" | "final"
provider: "elevenlabs" | "heygen" | "did" | "luma" | ...
providerJobId: string
status: "queued" | "running" | "succeeded" | "failed"
input: map (e.g., script text, voice params, avatar ref)
output: map (e.g., audioUrl, videoUrl, duration)
error: string (optional)
createdAt / updatedAt: timestamps
Subcollections keep each job small & queryable; later you can run collection-group queries like “all failed renders last 24h.” 