'use client';

import { useEffect } from 'react';
import { Card, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import { XIcon } from '@/components/icons';
import { useUGCStore } from '@/lib/ugc-store';

export function ToastNotification() {
  const { toast, hideToast } = useUGCStore();

  // Auto-hide toast when it becomes visible
  useEffect(() => {
    if (toast.isVisible) {
      const timer = setTimeout(() => {
        hideToast();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [toast.isVisible, hideToast]);

  if (!toast.isVisible) {
    return null;
  }

  const getToastColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-success/90 border-success/30 text-success-foreground';
      case 'error':
        return 'bg-danger/90 border-danger/30 text-danger-foreground';
      case 'info':
        return 'bg-primary/90 border-primary/30 text-primary-foreground';
      default:
        return 'bg-default/90 border-default/30 text-default-foreground';
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'info':
        return 'ℹ';
      default:
        return '•';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-2 duration-300">
      <Card className={`${getToastColor()} border shadow-lg min-w-[300px] max-w-[400px]`}>
        <CardBody className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
              {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-relaxed">
                {toast.message}
              </p>
            </div>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              className="flex-shrink-0 text-white/80 hover:text-white"
              onPress={hideToast}
            >
              <XIcon className="w-4 h-4" />
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
} 