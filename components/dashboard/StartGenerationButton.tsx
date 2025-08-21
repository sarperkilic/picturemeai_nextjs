'use client';

import { Button } from '@heroui/button';

import { RefreshIcon } from '@/components/icons';
import { useUGCStore } from '@/lib/ugc-store';

interface StartGenerationButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'bordered' | 'light';
}

export function StartGenerationButton({
  className = '',
  size = 'lg',
  variant = 'solid',
}: StartGenerationButtonProps) {
  const { setIsModalOpen } = useUGCStore();

  const handleStartGeneration = () => {
    setIsModalOpen(true);
  };

  return (
    <Button
      className={className}
      color='primary'
      size={size}
      startContent={<RefreshIcon className='w-4 h-4' />}
      variant={variant}
      onClick={handleStartGeneration}
    >
      Start Generation
    </Button>
  );
}
