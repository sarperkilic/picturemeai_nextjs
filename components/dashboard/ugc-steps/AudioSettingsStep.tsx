'use client';

import { useState } from 'react';
import { Card, CardBody } from '@heroui/card';

import { useUGCStore } from '@/lib/ugc-store';

const VOICE_OPTIONS = [
  {
    id: '1',
    name: 'Sarah',
    gender: 'Female',
    accent: 'American',
    description: 'Warm and friendly',
  },
  {
    id: '2',
    name: 'Michael',
    gender: 'Male',
    accent: 'American',
    description: 'Professional and confident',
  },
  {
    id: '3',
    name: 'Emma',
    gender: 'Female',
    accent: 'British',
    description: 'Elegant and sophisticated',
  },
  {
    id: '4',
    name: 'David',
    gender: 'Male',
    accent: 'British',
    description: 'Authoritative and trustworthy',
  },
  {
    id: '5',
    name: 'Lisa',
    gender: 'Female',
    accent: 'Australian',
    description: 'Casual and approachable',
  },
  {
    id: '6',
    name: 'James',
    gender: 'Male',
    accent: 'Australian',
    description: 'Relaxed and natural',
  },
];

const TONE_OPTIONS = [
  {
    id: 'friendly',
    name: 'Friendly',
    description: 'Warm and approachable',
    icon: '😊',
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Business-like and formal',
    icon: '💼',
  },
  {
    id: 'energetic',
    name: 'Energetic',
    description: 'High energy and enthusiastic',
    icon: '⚡',
  },
  { id: 'calm', name: 'Calm', description: 'Relaxed and soothing', icon: '🌊' },
  {
    id: 'confident',
    name: 'Confident',
    description: 'Assured and authoritative',
    icon: '💪',
  },
  {
    id: 'casual',
    name: 'Casual',
    description: 'Informal and conversational',
    icon: '👋',
  },
];

export function AudioSettingsStep() {
  const { videoConfig, updateVideoConfig } = useUGCStore();
  const [selectedVoice, setSelectedVoice] = useState<string>(
    videoConfig.audio.voice || ''
  );
  const [selectedTone, setSelectedTone] = useState<string>(
    videoConfig.audio.tone || ''
  );

  const handleVoiceChange = (voiceId: string) => {
    setSelectedVoice(voiceId);
    updateVideoConfig({
      audio: {
        ...videoConfig.audio,
        voice: voiceId,
      },
    });
  };

  const handleToneChange = (toneId: string) => {
    setSelectedTone(toneId);
    updateVideoConfig({
      audio: {
        ...videoConfig.audio,
        tone: toneId,
      },
    });
  };

  const selectedVoiceData = VOICE_OPTIONS.find(v => v.id === selectedVoice);
  const selectedToneData = TONE_OPTIONS.find(t => t.id === selectedTone);

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-semibold mb-2'>Choose Voice & Tone</h3>
        <p className='text-sm text-default-500'>
          Select the voice that will speak your script and the tone that matches
          your content.
        </p>
      </div>

      {/* Voice Selection */}
      <div>
        <h4 className='font-medium mb-3'>Voice Selection</h4>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {VOICE_OPTIONS.map(voice => (
            <Card
              key={voice.id}
              isPressable
              className={`cursor-pointer transition-all ${
                selectedVoice === voice.id
                  ? 'ring-2 ring-primary border-primary'
                  : 'hover:shadow-md'
              }`}
              onPress={() => handleVoiceChange(voice.id)}
            >
              <CardBody className='p-4'>
                <div className='flex items-start gap-3'>
                  <div className='w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center'>
                    <span className='text-lg font-semibold text-primary'>
                      {voice.name.charAt(0)}
                    </span>
                  </div>
                  <div className='flex-1'>
                    <h5 className='font-medium text-sm mb-1'>{voice.name}</h5>
                    <div className='flex flex-wrap gap-1 mb-1'>
                      <span className='px-2 py-1 bg-default-100 text-xs rounded-full'>
                        {voice.gender}
                      </span>
                      <span className='px-2 py-1 bg-default-100 text-xs rounded-full'>
                        {voice.accent}
                      </span>
                    </div>
                    <p className='text-xs text-default-500'>
                      {voice.description}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>

      {/* Tone Selection */}
      <div>
        <h4 className='font-medium mb-3'>Tone Selection</h4>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
          {TONE_OPTIONS.map(tone => (
            <Card
              key={tone.id}
              isPressable
              className={`cursor-pointer transition-all ${
                selectedTone === tone.id
                  ? 'ring-2 ring-primary border-primary'
                  : 'hover:shadow-md'
              }`}
              onPress={() => handleToneChange(tone.id)}
            >
              <CardBody className='p-3'>
                <div className='text-center'>
                  <div className='text-2xl mb-2'>{tone.icon}</div>
                  <h5 className='font-medium text-sm mb-1'>{tone.name}</h5>
                  <p className='text-xs text-default-500'>{tone.description}</p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>

      {/* Selection Summary */}
      {(selectedVoice || selectedTone) && (
        <Card className='bg-primary/5 border border-primary/20'>
          <CardBody className='p-4'>
            <h4 className='font-medium mb-2'>Voice & Tone Preview</h4>
            <div className='grid grid-cols-2 gap-4 text-sm'>
              {selectedVoiceData && (
                <div>
                  <span className='text-default-500'>Voice:</span>
                  <span className='ml-2 font-medium'>
                    {selectedVoiceData.name}
                  </span>
                  <p className='text-xs text-default-600 mt-1'>
                    {selectedVoiceData.gender} • {selectedVoiceData.accent} •{' '}
                    {selectedVoiceData.description}
                  </p>
                </div>
              )}
              {selectedToneData && (
                <div>
                  <span className='text-default-500'>Tone:</span>
                  <span className='ml-2 font-medium'>
                    {selectedToneData.name}
                  </span>
                  <p className='text-xs text-default-600 mt-1'>
                    {selectedToneData.description}
                  </p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Tips */}
      <Card className='bg-default-50 border border-default-200'>
        <CardBody className='p-4'>
          <h4 className='font-medium mb-2 text-sm'>🎤 Voice & Tone Tips</h4>
          <ul className='text-xs text-default-600 space-y-1'>
            <li>• Choose a voice that matches your target audience</li>
            <li>• Professional tone works well for business content</li>
            <li>
              • Friendly tone is great for social media and casual content
            </li>
            <li>
              • Energetic tone is perfect for entertainment and product launches
            </li>
            <li>• Consider your brand personality when selecting tone</li>
            <li>• Test different combinations to find what works best</li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
