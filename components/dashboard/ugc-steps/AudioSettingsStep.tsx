'use client';

import { useState } from 'react';
import { Card, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';

import { useUGCStore } from '@/lib/ugc-store';
import { VoiceLibraryModal } from './VoiceLibraryModal';
import { VoiceTemplate } from '@/types/voices';



export function AudioSettingsStep() {
  const { videoConfig, updateVideoConfig } = useUGCStore();
  const [selectedVoice, setSelectedVoice] = useState<VoiceTemplate | null>(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  const handleVoiceSelect = (voice: VoiceTemplate) => {
    setSelectedVoice(voice);
    updateVideoConfig({
      audio: {
        text: videoConfig.audio.text,
        voice: voice.voice_id, // Use ElevenLabs voice_id for generation
        voiceSettings: voice.settings, // Include voice settings for generation
      },
    });
  };

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-semibold mb-2'>Choose Voice</h3>
        <p className='text-sm text-default-500'>
          Select the voice that will speak your script.
        </p>
      </div>

      {/* Voice Selection */}
      <div>
        <h4 className='font-medium mb-3'>Voice Selection</h4>
        
        {selectedVoice ? (
          <Card className="mb-4">
            <CardBody className='p-4'>
              <div className='flex items-start gap-3'>
                <div className='w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center'>
                  <span className='text-lg font-semibold text-primary'>
                    {selectedVoice.name.charAt(0)}
                  </span>
                </div>
                <div className='flex-1'>
                  <h5 className='font-medium text-sm mb-1'>{selectedVoice.name}</h5>
                  <div className='flex flex-wrap gap-1 mb-1'>
                    {selectedVoice.age_group && (
                      <span className='px-2 py-1 bg-default-100 text-xs rounded-full'>
                        {selectedVoice.age_group}
                      </span>
                    )}
                    {selectedVoice.gender && (
                      <span className='px-2 py-1 bg-default-100 text-xs rounded-full'>
                        {selectedVoice.gender}
                      </span>
                    )}
                    {selectedVoice.accent && (
                      <span className='px-2 py-1 bg-default-100 text-xs rounded-full'>
                        {selectedVoice.accent}
                      </span>
                    )}
                  </div>
                  {selectedVoice.description && (
                    <p className='text-xs text-default-500'>
                      {selectedVoice.description}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="flat"
                  color="danger"
                  onPress={() => {
                    setSelectedVoice(null);
                    updateVideoConfig({
                      audio: {
                        text: videoConfig.audio.text,
                        voice: '',
                      },
                    });
                  }}
                >
                  Change
                </Button>
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className="text-center py-8 border-2 border-dashed border-default-200 rounded-lg">
            <p className="text-default-500 mb-4">No voice selected</p>
            <Button
              color="primary"
              onPress={() => setIsVoiceModalOpen(true)}
            >
              Browse Voices
            </Button>
          </div>
        )}

        <Button
          color="primary"
          variant="flat"
          onPress={() => setIsVoiceModalOpen(true)}
        >
          {selectedVoice ? 'Change Voice' : 'Select Voice'}
        </Button>
      </div>

      {/* Voice Library Modal */}
      <VoiceLibraryModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onSelect={handleVoiceSelect}
      />

      {/* Tips */}
      <Card className='bg-default-50 border border-default-200'>
        <CardBody className='p-4'>
          <h4 className='font-medium mb-2 text-sm'>🎤 Voice Selection Tips</h4>
          <ul className='text-xs text-default-600 space-y-1'>
            <li>• Choose a voice that matches your target audience</li>
            <li>• Professional voices work well for business content</li>
            <li>• Friendly voices are great for social media and casual content</li>
            <li>• Consider your brand personality when selecting a voice</li>
            <li>• Test different voices to find what works best for your content</li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
