import { generateTTS, generateTalkingHead } from './fal-client';
import { createProject, updateProjectStatus, updateProject } from './projects';
import { createRender, updateRender, updateRenderStatus } from './renders';
import { CreateProjectData } from '@/types/projects';

export interface VideoGenerationConfig {
  script: string;
  voiceId: string;
  avatarId: string;
  imageUrl: string;
}

export interface VideoGenerationResult {
  projectId: string;
  ttsRenderId: string;
  avatarRenderId: string;
  finalVideoUrl?: string;
  duration?: number;
}

export class VideoGenerationService {
  static async generateVideo(
    userId: string,
    config: VideoGenerationConfig,
    onProgress?: (message: string) => void
  ): Promise<VideoGenerationResult> {
    try {
      // Step 1: Create project
      onProgress?.('Creating project...');
      const projectData: CreateProjectData = {
        title: `UGC Video ${Date.now()}`,
        flow: {
          script: config.script,
          voiceId: config.voiceId,
          avatarId: config.avatarId,
        },
        duration: 0, // Will be updated after generation
      };
      
      const project = await createProject(userId, projectData);
      
      // Step 2: Generate TTS
      onProgress?.('Generating speech...');
      const ttsRender = await createRender(userId, project.id, {
        kind: 'tts',
        model: 'elevenlabs-tts-turbo-v2.5',
        providerJobId: '',
        input: {
          text: config.script,
          voice: config.voiceId,
        }
      });
      
      await updateRenderStatus(userId, project.id, ttsRender.id, 'running');
      
      const ttsResult = await generateTTS(config.script, {
        onProgress: (log) => onProgress?.(`TTS: ${log}`)
      }); 
      
      await updateRender(userId, project.id, ttsRender.id, {
        status: 'succeeded',
        output: ttsResult.output,
        providerJobId: ttsResult.requestId
      });
      
      // Step 3: Generate talking head
      onProgress?.('Generating talking head video...');
      const avatarRender = await createRender(userId, project.id, {
        kind: 'avatar',
        model: 'omnihuman',
        providerJobId: '',
        input: {
          image_url: 'https://storage.googleapis.com/falserverless/example_inputs/omnihuman.png',
          audio_url: ttsResult.output.audio.url,
        }
      });
      
      await updateRenderStatus(userId, project.id, avatarRender.id, 'running');
      
      console.log('Starting OmniHuman generation with:');
      console.log('- Image URL:', 'https://storage.googleapis.com/falserverless/example_inputs/omnihuman.png');
      console.log('- Audio URL:', ttsResult.output.audio.url);
      
      const avatarResult = await generateTalkingHead(
        'https://storage.googleapis.com/falserverless/example_inputs/omnihuman.png',
        ttsResult.output.audio.url,
        (log) => onProgress?.(`Avatar: ${log}`)
      );
      
      console.log('OmniHuman generation completed successfully!');
      
      await updateRender(userId, project.id, avatarRender.id, {
        status: 'succeeded',
        output: avatarResult.output,
        providerJobId: avatarResult.requestId
      });
      
      // Step 4: Update project with final results
      await updateProjectStatus(userId, project.id, 'complete');
      await updateProject(userId, project.id, {
        duration: avatarResult.duration || 0,
        usedCredits: 1
      });
      
      return {
        projectId: project.id,
        ttsRenderId: ttsRender.id,
        avatarRenderId: avatarRender.id,
        finalVideoUrl: avatarResult.output.video?.url,
        duration: avatarResult.duration
      };
      
    } catch (error) {
      console.error('Video generation failed:', error);
      throw error;
    }
  }

  static async generateVideoWithErrorHandling(
    userId: string,
    config: VideoGenerationConfig,
    onProgress?: (message: string) => void
  ): Promise<VideoGenerationResult> {
    let projectId: string | null = null;
    let ttsRenderId: string | null = null;
    let avatarRenderId: string | null = null;

    try {
      // Step 1: Create project
      onProgress?.('Creating project...');
      const projectData: CreateProjectData = {
        title: `UGC Video ${Date.now()}`,
        flow: {
          script: config.script,
          voiceId: config.voiceId,
          avatarId: config.avatarId,
        },
        duration: 0,
      };
      
      const project = await createProject(userId, projectData);
      projectId = project.id;
      
      // Step 2: Generate TTS
      onProgress?.('Generating speech...');
      const ttsRender = await createRender(userId, project.id, {
        kind: 'tts',
        model: 'elevenlabs-tts-turbo-v2.5',
        providerJobId: '',
        input: {
          text: config.script,
          voice: config.voiceId,
        }
      });
      
      ttsRenderId = ttsRender.id;
      await updateRenderStatus(userId, project.id, ttsRender.id, 'running');
      
      const ttsResult = await generateTTS(config.script, {
        onProgress: (log) => onProgress?.(`TTS: ${log}`)
      });
      
      console.log('TTS Result:', ttsResult);
      console.log('TTS Audio URL:', ttsResult.output.audio?.url);
      
      if (!ttsResult.output.audio?.url) {
        throw new Error('TTS generation failed: No audio URL returned');
      }
      
      await updateRender(userId, project.id, ttsRender.id, {
        status: 'succeeded',
        output: ttsResult.output,
        providerJobId: ttsResult.requestId
      });
      
      // Step 3: Generate talking head
      onProgress?.('Generating talking head video...');
      const avatarRender = await createRender(userId, project.id, {
        kind: 'avatar',
        model: 'omnihuman',
        providerJobId: '',
        input: {
          image_url: config.imageUrl,
          audio_url: ttsResult.output.audio.url,
        }
      });
      
      avatarRenderId = avatarRender.id;
      await updateRenderStatus(userId, project.id, avatarRender.id, 'running');
      
      console.log('Starting OmniHuman generation with:');
      console.log('- Image URL:', config.imageUrl);
      console.log('- Audio URL:', ttsResult.output.audio.url);
      
      const avatarResult = await generateTalkingHead(
        config.imageUrl,
        ttsResult.output.audio.url,
        (log) => onProgress?.(`Avatar: ${log}`)
      );
      
      console.log('OmniHuman generation completed successfully!');
      
      await updateRender(userId, project.id, avatarRender.id, {
        status: 'succeeded',
        output: avatarResult.output,
        providerJobId: avatarResult.requestId
      });
      
      // Step 4: Update project with final results
      await updateProjectStatus(userId, project.id, 'complete');
      await updateProject(userId, project.id, {
        duration: avatarResult.duration || 0,
        usedCredits: 1
      });
      
      return {
        projectId: project.id,
        ttsRenderId: ttsRender.id,
        avatarRenderId: avatarRender.id,
        finalVideoUrl: avatarResult.output.video?.url,
        duration: avatarResult.duration
      };
      
    } catch (error) {
      console.error('Video generation failed:', error);
      
      // Update failed status for renders and project
      if (projectId) {
        try {
          await updateProjectStatus(userId, projectId, 'failed');
          
          if (ttsRenderId) {
            await updateRenderStatus(userId, projectId, ttsRenderId, 'failed');
            await updateRender(userId, projectId, ttsRenderId, {
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
          
          if (avatarRenderId) {
            await updateRenderStatus(userId, projectId, avatarRenderId, 'failed');
            await updateRender(userId, projectId, avatarRenderId, {
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        } catch (updateError) {
          console.error('Failed to update error status:', updateError);
        }
      }
      
      throw error;
    }
  }
} 