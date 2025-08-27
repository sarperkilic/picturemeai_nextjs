'use client';

import { Card, CardBody } from '@heroui/card';
import { Chip } from '@heroui/chip';
import { Button } from '@heroui/button';
import { useVideos, getVideosPerformanceMetrics } from '@/lib/hooks/use-videos';

interface PerformanceMonitorProps {
  showDetails?: boolean;
}

export function PerformanceMonitor({ showDetails = false }: PerformanceMonitorProps) {
  const { 
    performanceMetrics, 
    totalVideos, 
    processingCount, 
    completedCount,
    clearCache,
    prefetchVideos 
  } = useVideos({ 
    limit: 10,
    enablePerformanceMonitoring: true,
    enableAdvancedCaching: true
  });

  const globalMetrics = getVideosPerformanceMetrics();

  if (!showDetails) {
    return (
      <div className="flex items-center gap-2 text-xs text-default-500">
        {performanceMetrics && (
          <>
            <span>Fetch: {performanceMetrics.fetchTime.toFixed(0)}ms</span>
            {performanceMetrics.errorCount > 0 && (
              <Chip size="sm" color="danger" variant="flat">
                {performanceMetrics.errorCount} errors
              </Chip>
            )}
            {performanceMetrics.retryCount > 0 && (
              <Chip size="sm" color="warning" variant="flat">
                {performanceMetrics.retryCount} retries
              </Chip>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <Card className="bg-content1/60 border border-default-100">
      <CardBody className="p-4">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Performance Monitor - Phase 5
            </h3>
            <p className="text-xs text-default-500">
              Real-time performance metrics for SWR video fetching
            </p>
          </div>

          {performanceMetrics && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-default-500">Fetch Time:</span>
                  <span className="font-mono">{performanceMetrics.fetchTime.toFixed(0)}ms</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-default-500">Cache Hit:</span>
                  <Chip 
                    size="sm" 
                    color={performanceMetrics.cacheHit ? "success" : "default"}
                    variant="flat"
                  >
                    {performanceMetrics.cacheHit ? "Yes" : "No"}
                  </Chip>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-default-500">Error Count:</span>
                  <Chip 
                    size="sm" 
                    color={performanceMetrics.errorCount > 0 ? "danger" : "success"}
                    variant="flat"
                  >
                    {performanceMetrics.errorCount}
                  </Chip>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-default-500">Retry Count:</span>
                  <Chip 
                    size="sm" 
                    color={performanceMetrics.retryCount > 0 ? "warning" : "success"}
                    variant="flat"
                  >
                    {performanceMetrics.retryCount}
                  </Chip>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-default-500">Total Videos:</span>
                  <span className="font-mono">{totalVideos}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-default-500">Processing:</span>
                  <Chip 
                    size="sm" 
                    color={processingCount > 0 ? "primary" : "default"}
                    variant="flat"
                  >
                    {processingCount}
                  </Chip>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-default-500">Completed:</span>
                  <Chip 
                    size="sm" 
                    color="success"
                    variant="flat"
                  >
                    {completedCount}
                  </Chip>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-default-500">Cache Hit Rate:</span>
                  <span className="font-mono">{(globalMetrics.cacheHitRate * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              variant="flat"
              color="primary"
              onClick={prefetchVideos}
            >
              Prefetch
            </Button>
            <Button
              size="sm"
              variant="flat"
              color="warning"
              onClick={clearCache}
            >
              Clear Cache
            </Button>
          </div>

          <div className="text-xs text-default-400 pt-2 border-t border-default-200">
            <p>Phase 5 Features:</p>
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li>Performance monitoring with real-time metrics</li>
              <li>Advanced caching strategies</li>
              <li>Error tracking and retry analytics</li>
              <li>Cache management utilities</li>
            </ul>
          </div>
        </div>
      </CardBody>
    </Card>
  );
} 