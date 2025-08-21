'use client';

import { useState } from 'react';
import { Card, CardBody } from '@heroui/card';
import Image from 'next/image';

import { useUGCStore } from '@/lib/ugc-store';
import { type VideoTemplate } from '@/types/ugc';

// Mock template data - in real app, this would come from an API
const TEMPLATES: VideoTemplate[] = [
  {
    id: '1',
    name: 'Professional Talking Head',
    thumbnail: '/images/sample1.png',
    style: 'Professional',
    cameraMovement: 'Static',
  },
  {
    id: '2',
    name: 'Casual Vlog Style',
    thumbnail: '/images/sample2.png',
    style: 'Casual',
    cameraMovement: 'Gentle Pan',
  },
  {
    id: '3',
    name: 'Product Review',
    thumbnail: '/images/sample3.png',
    style: 'Commercial',
    cameraMovement: 'Zoom In',
  },
  {
    id: '4',
    name: 'Social Media Story',
    thumbnail: '/images/sample4.png',
    style: 'Trendy',
    cameraMovement: 'Dynamic',
  },
  {
    id: '5',
    name: 'Educational Content',
    thumbnail: '/images/sample5.png',
    style: 'Educational',
    cameraMovement: 'Slow Pan',
  },
  {
    id: '6',
    name: 'Fashion Showcase',
    thumbnail: '/images/sample6.png',
    style: 'Fashion',
    cameraMovement: '360° Rotate',
  },
];

export function TemplateStep() {
  const { videoConfig, updateVideoConfig } = useUGCStore();
  const [selectedTemplate, setSelectedTemplate] =
    useState<VideoTemplate | null>(videoConfig.template);

  const handleTemplateSelect = (template: VideoTemplate) => {
    setSelectedTemplate(template);
    updateVideoConfig({ template });
  };

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-semibold mb-2'>
          Choose Your Video Template
        </h3>
        <p className='text-sm text-default-500'>
          Select a template that matches your content style and target audience.
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {TEMPLATES.map(template => (
          <Card
            key={template.id}
            isPressable
            className={`cursor-pointer transition-all ${
              selectedTemplate?.id === template.id
                ? 'ring-2 ring-primary border-primary'
                : 'hover:shadow-md'
            }`}
            onPress={() => handleTemplateSelect(template)}
          >
            <CardBody className='p-4'>
              <div className='aspect-video mb-3 overflow-hidden rounded-lg'>
                <Image
                  alt={template.name}
                  className='w-full h-full object-cover'
                  height={200}
                  src={template.thumbnail}
                  width={300}
                />
              </div>
              <div>
                <h4 className='font-medium text-sm mb-1'>{template.name}</h4>
                <div className='flex flex-wrap gap-1'>
                  <span className='px-2 py-1 bg-default-100 text-xs rounded-full'>
                    {template.style}
                  </span>
                  <span className='px-2 py-1 bg-default-100 text-xs rounded-full'>
                    {template.cameraMovement}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {selectedTemplate && (
        <Card className='bg-primary/5 border border-primary/20'>
          <CardBody className='p-4'>
            <h4 className='font-medium mb-2'>
              Selected Template: {selectedTemplate.name}
            </h4>
            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div>
                <span className='text-default-500'>Style:</span>
                <span className='ml-2 font-medium'>
                  {selectedTemplate.style}
                </span>
              </div>
              <div>
                <span className='text-default-500'>Camera Movement:</span>
                <span className='ml-2 font-medium'>
                  {selectedTemplate.cameraMovement}
                </span>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
