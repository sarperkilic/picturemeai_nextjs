'use client';

import { useState } from 'react';
import { Card, CardBody } from '@heroui/card';
import { Textarea } from '@heroui/input';

import { useUGCStore } from '@/lib/ugc-store';

const SCRIPT_TEMPLATES = [
  {
    id: '1',
    name: 'Product Review',
    text: "Hey everyone! Today I want to share this amazing product with you. I've been using it for the past month and I'm absolutely blown away by the results. The quality is outstanding and it's definitely worth every penny.",
  },
  {
    id: '2',
    name: 'Social Media Story',
    text: "OMG you guys! I just had the most incredible experience today. I can't believe what happened - it was literally life-changing. You have to see this for yourself!",
  },
  {
    id: '3',
    name: 'Professional Introduction',
    text: "Hello, I'm excited to introduce myself. I'm a passionate professional with over 5 years of experience in this field. I love helping people achieve their goals and I'm here to share valuable insights with you today.",
  },
  {
    id: '4',
    name: 'Educational Content',
    text: "Today we're going to learn about something really important. This concept has changed the way I think about this topic, and I think it will help you too. Let me break it down for you.",
  },
  {
    id: '5',
    name: 'Personal Story',
    text: "I want to share something personal with you today. This journey has been incredible, and I've learned so much along the way. I hope my story can inspire you to pursue your own dreams.",
  },
];

export function AudioTextStep() {
  const { videoConfig, updateVideoConfig } = useUGCStore();
  const [script, setScript] = useState<string>(videoConfig.audio.text || '');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const handleScriptChange = (value: string) => {
    setScript(value);
    updateVideoConfig({
      audio: {
        ...videoConfig.audio,
        text: value,
      },
    });
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = SCRIPT_TEMPLATES.find(t => t.id === templateId);

    if (template) {
      setScript(template.text);
      setSelectedTemplate(templateId);
      updateVideoConfig({
        audio: {
          ...videoConfig.audio,
          text: template.text,
        },
      });
    }
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

      {/* Script Templates */}
      <div>
        <h4 className='font-medium mb-3'>Quick Templates</h4>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
          {SCRIPT_TEMPLATES.map(template => (
            <Card
              key={template.id}
              isPressable
              className={`cursor-pointer transition-all ${
                selectedTemplate === template.id
                  ? 'ring-2 ring-primary border-primary'
                  : 'hover:shadow-md'
              }`}
              onPress={() => handleTemplateSelect(template.id)}
            >
              <CardBody className='p-3'>
                <h5 className='font-medium text-sm mb-1'>{template.name}</h5>
                <p className='text-xs text-default-500 line-clamp-2'>
                  {template.text.substring(0, 80)}...
                </p>
              </CardBody>
            </Card>
          ))}
        </div>
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

      {/* Writing Tips */}
      <Card className='bg-default-50 border border-default-200'>
        <CardBody className='p-4'>
          <h4 className='font-medium mb-2 text-sm'>✍️ Writing Tips</h4>
          <ul className='text-xs text-default-600 space-y-1'>
            <li>
              • Keep it conversational and natural - write like you&apos;re talking
              to a friend
            </li>
            <li>
              • Aim for 50-200 words for best results (about 15-60 seconds)
            </li>
            <li>• Include a clear call-to-action if promoting something</li>
            <li>• Use simple, everyday language that&apos;s easy to understand</li>
            <li>• Break up long sentences for better pacing</li>
            <li>• Include emotional words to make it more engaging</li>
          </ul>
        </CardBody>
      </Card>

      {/* Script Preview */}
      {script && (
        <Card className='bg-primary/5 border border-primary/20'>
          <CardBody className='p-4'>
            <h4 className='font-medium mb-2'>Script Preview</h4>
            <div className='bg-white rounded-lg p-3 text-sm'>
              <p className='whitespace-pre-wrap'>{script}</p>
            </div>
            <div className='mt-3 text-xs text-default-600'>
              <p>
                <strong>Length:</strong> {wordCount} words, ~
                {Math.ceil((wordCount / 150) * 60)} seconds
              </p>
              <p>
                <strong>Style:</strong>{' '}
                {wordCount < 50
                  ? 'Short and punchy'
                  : wordCount < 150
                    ? 'Medium length'
                    : 'Detailed explanation'}
              </p>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
