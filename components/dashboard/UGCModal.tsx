'use client';

import { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@heroui/modal';
import { Card, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';

import { CheckIcon } from '@/components/icons';
import { useUGCStore } from '@/lib/ugc-store';

import { TemplateStep } from './ugc-steps/TemplateStep';
import { ImageStep } from './ugc-steps/ImageStep';
import { ActionStep } from './ugc-steps/ActionStep';
import { AudioTextStep } from './ugc-steps/AudioTextStep';
import { AudioSettingsStep } from './ugc-steps/AudioSettingsStep';
import { BackgroundStep } from './ugc-steps/BackgroundStep';

const STEPS = [
  { id: 0, name: 'Template', component: TemplateStep },
  { id: 1, name: 'Character', component: ImageStep },
  { id: 2, name: 'Action', component: ActionStep },
  { id: 3, name: 'Script', component: AudioTextStep },
  { id: 4, name: 'Voice', component: AudioSettingsStep },
  { id: 5, name: 'Background', component: BackgroundStep },
];

export function UGCModal() {
  const {
    isModalOpen,
    setIsModalOpen,
    currentStep,
    setCurrentStep,
    videoConfig,
    resetVideoConfig,
  } = useUGCStore();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleClose = () => {
    setIsModalOpen(false);
    setCurrentStep(0);
    resetVideoConfig();
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepId: number) => {
    // Only allow navigation to completed steps or the next available step
    if (stepId <= currentStep || canNavigateToStep(stepId)) {
      setCurrentStep(stepId);
    }
  };

  const canNavigateToStep = (stepId: number): boolean => {
    // Check if all previous steps are completed
    for (let i = 0; i < stepId; i++) {
      if (!isStepCompleted(i)) {
        return false;
      }
    }

    return true;
  };

  const isStepCompleted = (stepId: number): boolean => {
    switch (stepId) {
      case 0: // Template
        return !!videoConfig.template;
      case 1: // Character
        return videoConfig.character.type === 'avatar'
          ? !!videoConfig.character.avatarId
          : !!videoConfig.character.imageUrl;
      case 2: // Action
        return !!videoConfig.action.movement && videoConfig.action.duration > 0;
      case 3: // Script
        return videoConfig.audio.text.length >= 10;
      case 4: // Voice
        return !!videoConfig.audio.voice && !!videoConfig.audio.tone;
      case 5: // Background
        return videoConfig.background.type === 'preset'
          ? !!videoConfig.background.presetId
          : !!videoConfig.background.imageUrl;
      default:
        return false;
    }
  };

  const isCurrentStepValid = (): boolean => {
    return isStepCompleted(currentStep);
  };

  const handleGenerate = async () => {
    if (!isCurrentStepValid()) return;

    setIsGenerating(true);
    try {
      // TODO: Implement actual video generation API call
      console.log('Generating video with config:', videoConfig);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // TODO: Add generated video to store
      handleClose();
    } catch (error) {
      console.error('Error generating video:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const CurrentStepComponent = STEPS[currentStep].component;

  return (
    <Modal
      isOpen={isModalOpen}
      scrollBehavior='inside'
      size='5xl'
      onClose={handleClose}
    >
      <ModalContent>
        <ModalHeader className='flex flex-col gap-1'>
          <h2 className='text-xl font-semibold'>Create UGC Video</h2>
          <p className='text-sm text-default-500'>
            Configure your video generation settings
          </p>
        </ModalHeader>

        <ModalBody>
          <div className='flex gap-6'>
            {/* Left Navigation Panel */}
            <div className='w-64 flex-shrink-0'>
              <Card className='bg-content1/60 border border-default-100'>
                <CardBody className='p-4'>
                  <div className='space-y-2'>
                    {STEPS.map(step => {
                      const isCompleted = isStepCompleted(step.id);
                      const isActive = currentStep === step.id;
                      const canNavigate =
                        step.id <= currentStep || canNavigateToStep(step.id);

                      return (
                        <button
                          key={step.id}
                          className={`w-full text-left p-3 rounded-lg transition-all ${
                            isActive
                              ? 'bg-primary text-primary-foreground'
                              : isCompleted
                                ? 'bg-success/20 text-success border border-success/30'
                                : canNavigate
                                  ? 'bg-default-100 hover:bg-default-200'
                                  : 'bg-default-50 text-default-400 cursor-not-allowed'
                          }`}
                          disabled={!canNavigate}
                          onClick={() => handleStepClick(step.id)}
                        >
                          <div className='flex items-center gap-3'>
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                                isActive
                                  ? 'bg-primary-foreground text-primary'
                                  : isCompleted
                                    ? 'bg-success text-success-foreground'
                                    : 'bg-default-300 text-default-600'
                              }`}
                            >
                              {isCompleted ? (
                                <CheckIcon className='w-3 h-3' />
                              ) : (
                                step.id + 1
                              )}
                            </div>
                            <span className='font-medium'>{step.name}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Right Content Area */}
            <div className='flex-1'>
              <Card className='bg-content1/60 border border-default-100'>
                <CardBody className='p-6'>
                  <CurrentStepComponent />
                </CardBody>
              </Card>
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <div className='flex justify-between w-full'>
            <Button
              isDisabled={currentStep === 0}
              variant='light'
              onPress={handlePrevious}
            >
              Previous
            </Button>

            <div className='flex gap-2'>
              <Button variant='light' onPress={handleClose}>
                Cancel
              </Button>

              {currentStep === STEPS.length - 1 ? (
                <Button
                  color='primary'
                  isDisabled={!isCurrentStepValid()}
                  isLoading={isGenerating}
                  onPress={handleGenerate}
                >
                  Generate Video
                </Button>
              ) : (
                <Button
                  color='primary'
                  isDisabled={!isCurrentStepValid()}
                  onPress={handleNext}
                >
                  Next
                </Button>
              )}
            </div>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
