'use client';

import { useState } from 'react';
import { Card, CardBody } from '@heroui/card';
import { Textarea } from '@heroui/input';

import { useUGCStore } from '@/lib/ugc-store';

export function AudioTextStep() {
  const { videoConfig, updateVideoConfig } = useUGCStore();
  const [script, setScript] = useState<string>(videoConfig.audio.text || '');

  const handleScriptChange = (value: string) => {
    setScript(value);
    updateVideoConfig({
      audio: {
        ...videoConfig.audio,
        text: value,
      },
    });
  };

  const characterCount = script.length;
  const wordCount = script
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0).length;

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-semibold mb-2'>Write Your Script</h3>
        <p className='text-sm text-default-500'>
          Write what you want your character to say in the video. Be natural and
          conversational.
        </p>
      </div>

      {/* Script Input */}
      <div>
        <h4 className='font-medium mb-3'>Your Script</h4>
        <div className='space-y-3'>
          <Textarea
            className='w-full'
            maxRows={12}
            minRows={6}
            placeholder="Write your script here... Be natural and conversational. You can talk about products, share stories, give advice, or anything else you'd like to say."
            value={script}
            onChange={e => handleScriptChange(e.target.value)}
          />

          {/* Character and Word Count */}
          <div className='flex justify-between text-xs text-default-500'>
            <span>{characterCount} characters</span>
            <span>{wordCount} words</span>
            <span>
              {wordCount > 0 && (
                <>~{Math.ceil((wordCount / 150) * 60)} seconds estimated</>
              )}
            </span>
          </div>
        </div>
      </div>


    </div>
  );
}
